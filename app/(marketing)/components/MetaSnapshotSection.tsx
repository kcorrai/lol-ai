import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { CountUp } from "@/components/ui/CountUp";
import { getMetaSnapshot, POSITION_LABELS } from "@/domains/meta";
import type { CanonicalPosition } from "@/domains/meta";

interface TopPick {
  championKey: string;
  name: string;
  position: CanonicalPosition;
  winRate: number;
}

// Server component — shows the current patch's strongest picks straight from the
// cached meta snapshot, proving the site is live and up to date.
export async function MetaSnapshotSection() {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  const picks: TopPick[] = [];
  for (const champ of snapshot.champions) {
    // Take each champion's best-performing lane with a meaningful pick rate.
    const best = champ.positions
      .filter((p) => p.pickRate >= 2 && p.tier > 0)
      .sort((a, b) => b.winRate - a.winRate)[0];
    if (best) {
      picks.push({ championKey: champ.championKey, name: champ.name, position: best.position, winRate: best.winRate });
    }
  }
  const top = picks.sort((a, b) => b.winRate - a.winRate).slice(0, 5);
  if (top.length === 0) return null;

  return (
    <section className="relative bg-background py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Patch {snapshot.patch} Meta · Updated Daily
          </div>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">
            This Patch&apos;s Strongest Picks
          </h2>
          <p className="mt-3 text-sm text-text-muted md:text-base">
            Live win rates from real ranked games — the same data that powers our free tools.
          </p>
          {snapshot.matchCount ? (
            <p className="mt-4 text-sm text-text-muted">
              Analyzing{" "}
              <CountUp value={snapshot.matchCount} className="font-bold text-accent" />
              {" "}ranked games this patch
            </p>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface/60">
          {top.map((pick, i) => (
            <Link
              key={pick.championKey}
              href={`/counters/${pick.championKey}`}
              className="flex items-center gap-4 border-b border-border/60 px-5 py-3 transition-colors last:border-0 hover:bg-surface-2"
            >
              <span className="w-5 text-sm font-bold text-text-muted">{i + 1}</span>
              <ChampionIcon name={pick.championKey} size={40} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{pick.name}</p>
                <p className="text-xs text-text-muted">{POSITION_LABELS[pick.position]}</p>
              </div>
              <span className="text-right">
                <span className="block text-sm font-bold text-success">{pick.winRate.toFixed(1)}%</span>
                <span className="block text-[10px] text-text-muted">win rate</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/tools/tier-list"
            className="inline-block rounded-md border border-border px-6 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-accent/50 hover:text-text"
          >
            View the full tier list →
          </Link>
        </div>
      </div>
    </section>
  );
}
