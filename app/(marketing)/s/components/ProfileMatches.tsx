import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon";
import { POSITION_LABELS } from "@/lib/riot/rankDisplay";
import type { PreviewMatch } from "@/types/preview";

interface Props {
  matches: PreviewMatch[];
}

/** (K + A) / max(D, 1) — deaths floored so a deathless game is a number, not infinity. */
function kda(m: PreviewMatch): string {
  return ((m.kills + m.assists) / Math.max(m.deaths, 1)).toFixed(1);
}

export function ProfileMatches({ matches }: Props): React.ReactElement | null {
  if (matches.length === 0) return null;

  return (
    <section className="notch border border-border bg-surface p-5">
      <p className="hud-label mb-3.5">{`// Last ${matches.length} matches`}</p>

      <ul className="space-y-1.5">
        {matches.map((m, i) => (
          <li
            key={`${m.championName}-${i}`}
            className={`flex items-center gap-3 border-l-2 bg-surface-dark px-3 py-2 ${
              m.win ? "border-accent" : "border-danger"
            }`}
          >
            <Image
              src={championIconUrl(m.championName)}
              alt=""
              aria-hidden
              width={30}
              height={30}
              unoptimized
              className="shrink-0 border border-border"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-text">{m.championName}</p>
              <p className="hud-label">{POSITION_LABELS[m.position] ?? m.position}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[12px] text-text">
                {m.kills}/{m.deaths}/{m.assists}
              </p>
              <p className="font-mono text-[10.5px] text-text-muted">{kda(m)} KDA</p>
            </div>
            <span
              className={`w-[52px] shrink-0 text-right font-mono text-[10px] uppercase tracking-label ${
                m.win ? "text-accent" : "text-danger"
              }`}
            >
              {m.win ? "Win" : "Loss"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
