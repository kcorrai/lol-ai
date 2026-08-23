import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon";
import type { PreviewMastery } from "@/types/preview";

interface Props {
  mastery: PreviewMastery[];
}

function points(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/**
 * Champion mastery, richest first.
 *
 * Worth its own strip beside the recent champion pool because it is the only signal Riot serves
 * that predates the match window: ten games say what someone is playing this week, mastery says
 * what they have played for years.
 */
export function ProfileMastery({ mastery }: Props): React.ReactElement | null {
  if (mastery.length === 0) return null;

  return (
    <section className="notch border border-border bg-surface p-5">
      <p className="hud-label mb-3.5">{"// Mastery"}</p>

      <div className="space-y-2.5">
        {mastery.map((m) => (
          <div key={m.championId} className="flex items-center gap-3">
            <Image
              src={championIconUrl(m.championName)}
              alt=""
              aria-hidden
              width={30}
              height={30}
              unoptimized
              className="shrink-0 border border-border"
            />
            <span className="min-w-0 flex-1 truncate text-[13px] text-text">
              {m.championName}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-text-muted">
              M{m.championLevel} · {points(m.championPoints)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
