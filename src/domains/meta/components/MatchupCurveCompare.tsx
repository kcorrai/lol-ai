import type { GameLengthPoint } from "@/domains/meta";
import { ScalingChart } from "@/domains/meta/components/ScalingChart";

// Overlays two champions' win rates by game length so readers can see who scales
// better as the game goes on.
export function MatchupCurveCompare({
  nameA,
  nameB,
  curveA,
  curveB,
}: {
  nameA: string;
  nameB: string;
  curveA: GameLengthPoint[];
  curveB: GameLengthPoint[];
}) {
  // Nothing to compare if neither champion has curve data.
  if (curveA.length === 0 && curveB.length === 0) return null;
  const oneSided = curveA.length === 0 || curveB.length === 0;

  return (
    <section className="notch border border-border bg-surface p-5">
      <h2 className="hud-label text-[10.5px]">Scaling comparison</h2>
      {/* These are each champion's own curves across all its games in the lane, not games of this
          matchup — the feed has no per-matchup game-length split, and the caption says so. */}
      <p className="mb-4 mt-1 text-xs text-text-muted">
        Each champion&apos;s own win rate by game length this patch, across all its games in the
        lane.
        {oneSided && " Scaling data is only available for one champion in this lane."}
      </p>
      <ScalingChart
        series={[
          { label: nameA, points: curveA, tone: "info" },
          { label: nameB, points: curveB, tone: "danger" },
        ]}
      />
    </section>
  );
}
