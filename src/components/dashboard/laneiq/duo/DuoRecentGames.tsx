import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { SharedMatch } from "@/domains/analysis/services/duoSynergy";

interface Props {
  matches: SharedMatch[];
}

export function DuoRecentGames({ matches }: Props): React.ReactElement | null {
  if (matches.length === 0) return null;

  return (
    <div className="p-5">
      <p className="hud-label mb-3">{"// Last games together"}</p>

      <ul className="space-y-1.5">
        {matches.map((m) => (
          <li
            key={m.matchId}
            className={`flex items-center gap-2.5 border-l-2 bg-surface-dark px-2.5 py-1.5 ${
              m.won ? "border-accent" : "border-danger"
            }`}
          >
            <span className="flex shrink-0 items-center -space-x-1.5">
              <ChampionIcon name={m.ownChampion} size={22} />
              <ChampionIcon name={m.partnerChampion} size={22} />
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-muted">
              {m.kills}/{m.deaths}/{m.assists}
            </span>
            <span
              className={`shrink-0 font-mono text-[10px] uppercase tracking-label ${
                m.won ? "text-accent" : "text-danger"
              }`}
            >
              {m.won ? "Win" : "Loss"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
