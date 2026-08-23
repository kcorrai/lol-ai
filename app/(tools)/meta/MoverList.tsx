import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { tierLetter } from "@/domains/meta/tierLetter";
import type { MetaMover } from "@/domains/meta";

interface MoverListProps {
  title: string;
  movers: MetaMover[];
  direction: "up" | "down";
}

const TIER_COLORS: Record<string, string> = {
  S: "bg-warning/20 text-warning border-warning/40",
  A: "bg-accent/15 text-accent border-accent/30",
  B: "bg-info/15 text-info border-info/30",
  C: "bg-surface/15 text-text border-line-2/30",
  D: "bg-danger/10 text-danger border-danger/30",
};

function formatGames(games: number): string {
  return games >= 1000 ? `${(games / 1000).toFixed(0)}k` : String(games);
}

export function MoverList({ title, movers, direction }: MoverListProps) {
  const up = direction === "up";
  return (
    // min-w-0: as a grid child this defaults to min-width:auto, which refuses to
    // shrink below the widest stat row and pushes the page 7px wide at 390px.
    <section className="min-w-0 rounded-2xl border border-border bg-surface/60 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-text">
        <span className={up ? "text-success" : "text-danger"}>{up ? "▲" : "▼"}</span>
        {title}
      </h2>
      {movers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-text-muted">
          No significant {up ? "risers" : "fallers"} this patch.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {movers.map((m) => {
            const letter = tierLetter(m.tier);
            return (
              // Two rows, not one: name + delta + WR/PR/BR + games + a counters link never fit
              // across ~420px, so the delta badge used to land on top of longer champion names.
              <li
                key={m.championKey}
                className="rounded-lg border border-border/60 bg-surface px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      TIER_COLORS[letter] ?? "border-border text-text-muted"
                    }`}
                  >
                    {letter}
                  </span>
                  <Link
                    href={`/builds/${m.championKey}`}
                    className="flex min-w-0 flex-1 items-center gap-2 hover:text-accent"
                  >
                    <ChampionIcon name={m.championKey} size={30} className="shrink-0" />
                    <span className="truncate text-sm font-medium text-text">{m.name}</span>
                  </Link>
                  <span
                    className={`shrink-0 text-sm font-bold ${up ? "text-success" : "text-danger"}`}
                  >
                    {up ? "▲" : "▼"}
                    {Math.abs(m.delta)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 pl-[30px] text-xs text-text-muted">
                  <span className="min-w-0 truncate">
                    <span
                      className={`font-semibold ${m.winRate >= 50 ? "text-success" : "text-text"}`}
                    >
                      {m.winRate.toFixed(1)}%
                    </span>{" "}
                    WR · {m.pickRate.toFixed(1)}% PR · {m.banRate.toFixed(1)}% BR
                    {m.games > 0 && (
                      <span className="text-text-muted/60"> · {formatGames(m.games)} games</span>
                    )}
                  </span>
                  <Link
                    href={`/counters/${m.championKey}`}
                    className="shrink-0 underline-offset-2 hover:text-accent hover:underline"
                  >
                    counters
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
