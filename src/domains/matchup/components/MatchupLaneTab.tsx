"use client";

import Image from "next/image";
import { Zap, Eye, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDDragonItems } from "@/hooks/useDDragonItems";
import type { MatchupAnalysis } from "../types/matchup.types";

const ADVANTAGE_STYLES = {
  favorable: "bg-green-500/15 text-green-400 border-green-500/30",
  unfavorable: "bg-red-500/15 text-red-400 border-red-500/30",
  even: "bg-border/40 text-text-muted border-border",
};
const ADVANTAGE_LABELS = { favorable: "Avantajlı", unfavorable: "Dezavantajlı", even: "Dengeli" };

function InfoBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <p className="mb-1 text-xs font-semibold text-text-muted">{label}</p>
      <p className="text-sm text-text">{text}</p>
    </div>
  );
}

function TipBox({
  icon,
  label,
  text,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-3 flex items-start gap-2.5">
      <span className={cn("mt-0.5 shrink-0", color)}>{icon}</span>
      <div>
        <p className={cn("mb-0.5 text-xs font-semibold", color)}>{label}</p>
        <p className="text-sm text-text">{text}</p>
      </div>
    </div>
  );
}

export function MatchupLaneTab({ data }: { data: MatchupAnalysis }) {
  const { getItemIconUrl } = useDDragonItems();
  const { laneAnalysis: la } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("rounded border px-2 py-0.5 text-xs font-semibold", ADVANTAGE_STYLES[la.advantage])}>
          {ADVANTAGE_LABELS[la.advantage]}
        </span>
        <p className="text-sm text-text">{la.summary}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoBox label="Level 1-3 Planı" text={la.levels1to3} />
        <InfoBox label="Level 6 Planı" text={la.level6Plan} />
      </div>

      {la.powerSpikes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">Güç Noktaları</p>
          <ul className="space-y-1.5">
            {la.powerSpikes.map((spike, i) => {
              const spikeItemUrl = spike.item ? getItemIconUrl(spike.item) : null;
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {spike.level ? (
                    <span className="font-medium text-accent shrink-0">Lv{spike.level}</span>
                  ) : spike.item ? (
                    <span className="inline-flex items-center gap-1 font-medium text-accent shrink-0">
                      {spikeItemUrl && (
                        <Image src={spikeItemUrl} alt={spike.item} width={14} height={14} className="rounded" unoptimized />
                      )}
                      {spike.item}
                    </span>
                  ) : null}
                  <span>{spike.description}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(la.waveControl || la.wardingTip) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {la.waveControl && (
            <TipBox
              icon={<Waves className="h-4 w-4" />}
              label="Minyon Kontrolü"
              text={la.waveControl}
              color="text-blue-400"
            />
          )}
          {la.wardingTip && (
            <TipBox
              icon={<Eye className="h-4 w-4" />}
              label="Görüş Kontrolü"
              text={la.wardingTip}
              color="text-yellow-400"
            />
          )}
        </div>
      )}
    </div>
  );
}
