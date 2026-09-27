import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { POSITION_LABELS } from "@/domains/meta/positions";
import { matchupSlug } from "@/domains/meta/services/matchupPairsService";
import type { LaneEdge } from "@/domains/meta/services/draftEval.types";

/**
 * Every lane where both sides have a pick, as blue · win rate · red. The number is blue's win rate
 * in that head-to-head, so the colour of the edge and the number always agree.
 */
export function DraftLaneTable({
  edges,
  names,
}: {
  edges: LaneEdge[];
  /** Display name by Data Dragon id — edges carry ids only. */
  names: Map<string, string>;
}): React.ReactElement | null {
  if (edges.length === 0) return null;
  return (
    <section>
      <h2 className="hud-label mb-3 flex items-center gap-3.5 text-[11px]">
        Lane matchups
        <span className="h-px flex-1 bg-line-1" aria-hidden />
      </h2>
      <ul className="notch grid gap-1">
        {edges.map((e) => {
          const tone =
            e.favored === "blue"
              ? "border-l-info"
              : e.favored === "red"
                ? "border-l-danger"
                : "border-l-line-2";
          const number =
            e.favored === "blue" ? "text-info" : e.favored === "red" ? "text-danger" : "text-text";
          return (
            <li key={e.position}>
              <Link
                href={`/matchups/${matchupSlug(e.blueKey, e.redKey)}`}
                className={`grid grid-cols-[56px_1fr_auto_1fr] items-center gap-3 border border-l-2 border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40 hover:bg-surface-2 ${tone}`}
                title={e.note}
              >
                <span className="hud-label text-[10px]">{POSITION_LABELS[e.position]}</span>
                <span className="flex items-center gap-2">
                  <ChampionIcon name={e.blueKey} size={30} />
                  <span className="hidden truncate text-sm font-semibold text-text sm:inline">
                    {names.get(e.blueKey) ?? e.blueKey}
                  </span>
                </span>
                <span className="text-center">
                  <span className={`block font-mono text-sm font-bold tabular-nums ${number}`}>
                    {e.blueWinRate.toFixed(1)}%
                  </span>
                  <span className="hud-label block text-[9px]">
                    {e.favored === "even" ? "even" : `${e.favored} side`}
                  </span>
                </span>
                <span className="flex items-center justify-end gap-2">
                  <span className="hidden truncate text-sm font-semibold text-text sm:inline">
                    {names.get(e.redKey) ?? e.redKey}
                  </span>
                  <ChampionIcon name={e.redKey} size={30} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
