"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert, Trophy } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import { keystoneIconUrlByName, runePathIconUrlByName } from "@/lib/ddragon";
import { useDDragonItems } from "@/hooks/useDDragonItems";
import type { CounterEntry } from "../types/counter.types";

const TIER_STYLES: Record<NonNullable<CounterEntry["tier"]>, string> = {
  S: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
  A: "bg-green-500/20 text-green-400 border-green-500/40",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  C: "bg-border/40 text-text-muted border-border",
};

const DIFFICULTY_STYLES: Record<CounterEntry["difficulty"], string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

const DIFFICULTY_LABELS: Record<CounterEntry["difficulty"], string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const PHASE_STYLES = {
  Strong: "bg-green-500/20 text-green-400",
  Even: "bg-border/40 text-text-muted",
  Weak: "bg-red-500/15 text-red-400",
};
const PHASE_LABELS = { Strong: "Güçlü", Even: "Dengeli", Weak: "Zayıf" };
const PHASE_KEYS: Array<[keyof NonNullable<CounterEntry["lanePhases"]>, string]> = [
  ["early", "Early"],
  ["mid", "Mid"],
  ["late", "Late"],
];

function computeScore(entry: CounterEntry): number {
  const base = { S: 92, A: 80, B: 68, C: 56 }[entry.tier] ?? 68;
  const bonus = entry.winRate != null ? Math.round((entry.winRate - 50) * 2) : 0;
  return Math.min(98, Math.max(50, base + bonus));
}

export function CounterCard({ entry }: { entry: CounterEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { getItemIconUrl } = useDDragonItems();
  const score = computeScore(entry);

  return (
    <div className={cn(
      "group overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200",
      "hover:border-accent/40 hover:shadow-[0_0_16px_rgba(var(--accent-rgb),0.1)] hover:scale-[1.01]"
    )}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <ChampionIcon name={entry.champion} size={44} className="rounded-lg shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-text">{entry.champion}</p>
            <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-bold", TIER_STYLES[entry.tier])}>
              {entry.tier}
            </span>
          </div>
          <p className="truncate text-xs text-text-muted leading-snug">{entry.reasonWhy}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-accent tabular-nums">{score}</span>
            <span className="text-[10px] text-text-muted">/100</span>
          </div>
          <div className="flex items-center gap-1.5">
            {entry.winRate != null && (
              <span className="text-xs font-medium text-text-muted tabular-nums">
                {entry.winRate.toFixed(1)}%
              </span>
            )}
            <span className={cn("text-xs font-medium", DIFFICULTY_STYLES[entry.difficulty])}>
              {DIFFICULTY_LABELS[entry.difficulty]}
            </span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5 text-text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-text-muted" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border space-y-4 px-4 py-3.5">
          {/* Lane Phases */}
          {entry.lanePhases && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Lane Fazları</p>
              <div className="flex gap-2">
                {PHASE_KEYS.map(([key, label]) => (
                  <div key={key} className="flex flex-1 flex-col items-center gap-0.5">
                    <span className="text-[10px] text-text-muted">{label}</span>
                    <span className={cn("w-full rounded px-1 py-0.5 text-center text-[11px] font-medium", PHASE_STYLES[entry.lanePhases![key]])}>
                      {PHASE_LABELS[entry.lanePhases![key]]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rune Advice */}
          {entry.runeAdvice && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Önerilen Runlar</p>
              <div className="flex items-end gap-3">
                <RuneDisplay url={keystoneIconUrlByName(entry.runeAdvice.keystone)} label={entry.runeAdvice.keystone} size={28} />
                <div className="flex items-end gap-1.5">
                  <RuneDisplay url={runePathIconUrlByName(entry.runeAdvice.primaryPath)} label={entry.runeAdvice.primaryPath} size={20} />
                  <span className="mb-4 text-xs text-text-muted">+</span>
                  <RuneDisplay url={runePathIconUrlByName(entry.runeAdvice.secondaryPath)} label={entry.runeAdvice.secondaryPath} size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Key Items */}
          {entry.keyItems && entry.keyItems.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Core Build</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.keyItems.map((item) => {
                  const url = getItemIconUrl(item);
                  return (
                    <span key={item} className="inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-xs text-text">
                      {url && <Image src={url} alt={item} width={14} height={14} className="rounded" unoptimized />}
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lane Advantage */}
          <DetailRow label="Lane Avantajı" value={entry.laneAdvantage} />
          <DetailRow label="Dikkat Et" value={entry.watchOut} />

          {/* Win Conditions */}
          {entry.winConditions && entry.winConditions.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
                <Trophy className="h-3 w-3 text-green-400" /> Kazanma Koşulları
              </p>
              <ul className="space-y-0.5">
                {entry.winConditions.map((c, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-text"><span className="mt-0.5 text-green-400 shrink-0">✓</span>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {entry.commonMistakes && entry.commonMistakes.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-red-400" /> Sık Yapılan Hatalar
              </p>
              <ul className="space-y-0.5">
                {entry.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-text"><span className="mt-0.5 text-red-400 shrink-0">✗</span>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-0.5 text-xs text-text">{value}</p>
    </div>
  );
}

function RuneDisplay({ url, label, size }: { url: string; label: string; size: number }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex flex-col items-center gap-0.5">
      {url && !errored ? (
        <Image src={url} alt={label} width={size} height={size} className="rounded" onError={() => setErrored(true)} unoptimized />
      ) : (
        <span className="rounded bg-surface-2 ring-1 ring-border/40" style={{ width: size, height: size }} />
      )}
      <span className="text-[9px] text-text-muted max-w-[52px] text-center truncate">{label}</span>
    </div>
  );
}
