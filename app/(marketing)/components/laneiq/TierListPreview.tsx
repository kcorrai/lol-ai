import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { getMetaSnapshot, formatGamePatch, ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta";
import type { CanonicalPosition } from "@/domains/meta";
import { SectionHead } from "./SectionHead";

interface Row {
  championKey: string;
  name: string;
  position: CanonicalPosition;
  winRate: number;
  pickRate: number;
  delta: number;
}

const COLS = "grid-cols-[38px_1fr_88px_74px_74px_72px] md:grid-cols-[48px_1fr_100px_90px_90px_96px]";

// Server component — the top of the live tier list, one champion per lane so the
// preview reads as a meta summary rather than five bot-lane picks.
export async function TierListPreview(): Promise<React.ReactElement | null> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  // One champion per lane, and never the same champion twice — a flex pick that
  // tops two lanes would otherwise fill half the preview with one portrait.
  const claimed = new Set<string>();
  const rows: Row[] = [];
  for (const position of ALL_POSITIONS) {
    let best: Row | null = null;
    for (const champ of snapshot.champions) {
      if (claimed.has(champ.championKey)) continue;
      const p = champ.positions.find((x) => x.position === position);
      if (!p || p.pickRate < 1 || p.rank <= 0) continue;
      if (!best || p.winRate > best.winRate) {
        best = {
          championKey: champ.championKey,
          name: champ.name,
          position,
          winRate: p.winRate,
          pickRate: p.pickRate,
          delta: p.prevPatchRank > 0 ? p.prevPatchRank - p.rank : 0,
        };
      }
    }
    if (best) {
      claimed.add(best.championKey);
      rows.push(best);
    }
  }

  rows.sort((a, b) => b.winRate - a.winRate);
  if (rows.length === 0) return null;

  return (
    <section id="tier" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title={`Tier list · patch ${formatGamePatch(snapshot.patch)}`}
          aside={
            snapshot.matchCount
              ? `${(snapshot.matchCount / 1_000_000).toFixed(1)}M games`
              : "Live ranked data"
          }
        />
        <div className="notch overflow-x-auto border border-border bg-surface">
          <div className="min-w-[560px]">
            <div
              className={`grid ${COLS} gap-3.5 border-b border-border px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-label text-text-muted md:px-[22px]`}
            >
              <span>#</span>
              <span>Champion</span>
              <span>Role</span>
              <span className="text-right">Win</span>
              <span className="text-right">Pick</span>
              <span className="text-right">&Delta;</span>
            </div>
            {rows.map((r, i) => (
              <Link
                key={r.position}
                href={`/counters/${r.championKey}`}
                className={`grid ${COLS} items-center gap-3.5 border-b border-border px-5 py-2.5 transition-colors last:border-0 hover:bg-surface-2 md:px-[22px]`}
              >
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-3">
                  <ChampionIcon name={r.championKey} size={34} />
                  <span className="text-sm text-text">{r.name}</span>
                </span>
                <span className="hud-label">{POSITION_LABELS[r.position]}</span>
                <span className="text-right font-mono text-[13.5px] text-text">
                  {r.winRate.toFixed(1)}%
                </span>
                <span className="text-right font-mono text-[13.5px] text-text-body">
                  {r.pickRate.toFixed(1)}%
                </span>
                <span
                  className={`text-right font-mono text-[12.5px] ${r.delta > 0 ? "text-accent" : r.delta < 0 ? "text-danger" : "text-text-muted"}`}
                >
                  {r.delta > 0 ? "+" : r.delta < 0 ? "−" : ""}
                  {r.delta === 0 ? "—" : Math.abs(r.delta)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
