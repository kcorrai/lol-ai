import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { POSITION_LABELS } from "@/lib/riot/rankDisplay";
import type { ChampionPair, RolePair } from "@/domains/analysis/services/duoSynergy";

interface Props {
  championPairs: ChampionPair[];
  rolePairs: RolePair[];
}

/** What the two of them should actually pick, and what they actually queue. */
export function DuoPairs({ championPairs, rolePairs }: Props): React.ReactElement | null {
  if (championPairs.length === 0 && rolePairs.length === 0) return null;

  return (
    <div className="border-b border-border p-5">
      {championPairs.length > 0 && (
        <>
          <p className="hud-label mb-3">{"// Best together"}</p>
          <ul className="space-y-2.5">
            {championPairs.map((p) => (
              <li
                key={`${p.ownChampion}-${p.partnerChampion}`}
                className="flex items-center gap-2.5"
              >
                <span className="flex shrink-0 items-center -space-x-1.5">
                  <ChampionIcon name={p.ownChampion} size={26} />
                  <ChampionIcon name={p.partnerChampion} size={26} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-body">
                  {p.ownChampion} <span className="text-text-muted">+</span> {p.partnerChampion}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] text-text-muted">
                  {p.games}g
                </span>
                <span
                  className={`w-9 shrink-0 text-right font-mono text-[12px] font-bold ${
                    p.winRate >= 50 ? "text-accent" : "text-danger"
                  }`}
                >
                  {p.winRate}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {rolePairs.length > 0 && (
        <div className={championPairs.length > 0 ? "mt-4 border-t border-border pt-3.5" : ""}>
          <p className="hud-label mb-2.5">{"// How you queue"}</p>
          <ul className="space-y-1.5">
            {rolePairs.map((r) => (
              <li
                key={`${r.ownPosition}-${r.partnerPosition}`}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="text-[12.5px] text-text-body">
                  {POSITION_LABELS[r.ownPosition] ?? r.ownPosition}
                  <span className="text-text-muted"> + </span>
                  {POSITION_LABELS[r.partnerPosition] ?? r.partnerPosition}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-text-muted">
                  {r.games}g ·{" "}
                  <span className={r.winRate >= 50 ? "text-accent" : "text-danger"}>
                    {r.winRate}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
