"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { keystoneIconUrlByName, runePathIconUrlByName } from "@/lib/ddragon";
import { useDDragonItems } from "@/hooks/useDDragonItems";
import type { MatchupAnalysis } from "../types/matchup.types";

const SKILL_COLORS: Record<string, string> = {
  Q: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  W: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  E: "bg-green-500/20 text-green-400 border-green-500/30",
  R: "bg-red-500/20 text-red-400 border-red-500/30",
};

function SkillBadge({ skill }: { skill: string }) {
  return (
    <span className={cn(
      "rounded border px-2.5 py-1 text-xs font-bold",
      SKILL_COLORS[skill] ?? "bg-surface-2 text-text-muted border-border"
    )}>
      {skill}
    </span>
  );
}

function ItemWithIcon({ name, size = "sm", getIconUrl }: {
  name: string;
  size?: "sm" | "lg";
  getIconUrl: (n: string) => string | null;
}) {
  const [errored, setErrored] = useState(false);
  const url = getIconUrl(name);
  const px = size === "lg" ? 20 : 16;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 text-text",
      size === "lg" ? "px-2.5 py-1.5 text-sm font-medium" : "px-2 py-1 text-xs"
    )}>
      {url && !errored && (
        <Image
          src={url}
          alt={name}
          width={px}
          height={px}
          className="rounded"
          onError={() => setErrored(true)}
          unoptimized
        />
      )}
      {name}
    </span>
  );
}

function RuneIcon({ url, label, size = 24 }: { url: string; label: string; size?: number }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex flex-col items-center gap-0.5">
      {url && !errored ? (
        <Image
          src={url}
          alt={label}
          width={size}
          height={size}
          className="rounded"
          onError={() => setErrored(true)}
          unoptimized
        />
      ) : (
        <span className="rounded bg-surface-2 ring-1 ring-border/40" style={{ width: size, height: size }} />
      )}
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

export function MatchupBuildTab({ data }: { data: MatchupAnalysis }) {
  const { getItemIconUrl } = useDDragonItems();
  const { buildAdvice: ba } = data;

  return (
    <div className="space-y-4">
      {ba.skillOrder && ba.skillOrder.length > 0 && (
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <p className="mb-2 text-xs font-semibold text-text-muted">Yetenek Sırası (Önce Maxla)</p>
          <div className="flex items-center gap-2">
            {ba.skillOrder.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <SkillBadge skill={skill} />
                {i < ba.skillOrder!.length - 1 && (
                  <span className="text-xs text-text-muted/50">&gt;</span>
                )}
              </span>
            ))}
          </div>
          {ba.skillOrderNote && (
            <p className="mt-2 text-xs text-text-muted">{ba.skillOrderNote}</p>
          )}
        </div>
      )}

      {data.runeAdvice && (
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Rün Tavsiyesi</p>
          <div className="flex items-end gap-4">
            <RuneIcon
              url={keystoneIconUrlByName(data.runeAdvice.keystone)}
              label={data.runeAdvice.keystone}
              size={32}
            />
            <div className="flex items-end gap-2">
              <RuneIcon
                url={runePathIconUrlByName(data.runeAdvice.primaryPath)}
                label={data.runeAdvice.primaryPath}
                size={22}
              />
              <span className="mb-4 text-xs text-text-muted">+</span>
              <RuneIcon
                url={runePathIconUrlByName(data.runeAdvice.secondaryPath)}
                label={data.runeAdvice.secondaryPath}
                size={22}
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold text-text-muted">Başlangıç Eşyaları</p>
        <div className="flex flex-wrap gap-1.5">
          {ba.startingItems.map((item) => (
            <ItemWithIcon key={item} name={item} getIconUrl={getItemIconUrl} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-text-muted">Core Eşyalar</p>
        <div className="flex flex-wrap gap-2">
          {ba.coreItems.map((item) => (
            <ItemWithIcon key={item} name={item} size="lg" getIconUrl={getItemIconUrl} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-text-muted">Durumsal Eşyalar</p>
        <div className="flex flex-wrap gap-1.5">
          {ba.situationalItems.map((item) => (
            <ItemWithIcon key={item} name={item} getIconUrl={getItemIconUrl} />
          ))}
        </div>
      </div>

      <p className="text-sm italic text-text-muted">{ba.reasoning}</p>
    </div>
  );
}
