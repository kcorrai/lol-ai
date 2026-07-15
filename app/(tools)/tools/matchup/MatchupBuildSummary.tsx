import Image from "next/image";
import { MatchupCurveCompare } from "@/domains/meta/components/MatchupCurveCompare";
import type { MatchupExtras, MatchupSideBuild } from "./loadMatchupExtras";

function SideBuild({ name, side, accent }: { name: string; side: MatchupSideBuild; accent: string }) {
  if (side.coreItems.length === 0 && !side.keystone) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <h3 className={`mb-3 font-display text-sm font-bold ${accent}`}>{name} core build</h3>
      <div className="flex items-center gap-3">
        {side.keystone && (
          <Image
            src={side.keystone.iconUrl}
            alt={side.keystone.name}
            title={side.keystone.name}
            width={34}
            height={34}
            unoptimized
            className="rounded-md ring-1 ring-border"
          />
        )}
        {side.keystone && side.coreItems.length > 0 && (
          <span className="text-text-muted">·</span>
        )}
        <div className="flex flex-wrap gap-1.5">
          {side.coreItems.map((item) => (
            <Image
              key={item.id}
              src={item.iconUrl}
              alt={item.name}
              title={item.name}
              width={34}
              height={34}
              unoptimized
              className="rounded-md ring-1 ring-border"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Condensed build comparison for the matchup tool: each side's keystone + core
// items and an overlaid game-length curve. Reuses the build page's curve compare.
export function MatchupBuildSummary({
  nameA,
  nameB,
  extras,
}: {
  nameA: string;
  nameB: string;
  extras: MatchupExtras;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SideBuild name={nameA} side={extras.a} accent="text-sky-400" />
        <SideBuild name={nameB} side={extras.b} accent="text-rose-400" />
      </div>
      <MatchupCurveCompare nameA={nameA} nameB={nameB} curveA={extras.a.curve} curveB={extras.b.curve} />
    </div>
  );
}
