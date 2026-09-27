import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { tierChipClass, tierLetter } from "@/domains/meta/tierLetter";
import type { MetaMover } from "@/domains/meta";

interface MoverListProps {
  title: string;
  movers: MetaMover[];
  direction: "up" | "down";
}

function formatGames(games: number): string {
  return games >= 1000 ? `${(games / 1000).toFixed(0)}k` : String(games);
}

export function MoverList({ title, movers, direction }: MoverListProps) {
  const up = direction === "up";
  const tone = up ? "text-accent" : "text-danger";
  return (
    // min-w-0: as a grid child this defaults to min-width:auto, which refuses to
    // shrink below the widest stat row and pushes the page 7px wide at 390px.
    <section className="notch min-w-0 border border-border bg-surface p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-[17px] font-black uppercase tracking-[0.03em] text-text">
        <span className={tone} aria-hidden>
          {up ? "▲" : "▼"}
        </span>
        {title}
      </h2>
      {movers.length === 0 ? (
        <p className="border border-border bg-surface-dark px-3 py-6 text-center text-xs text-text-muted">
          No significant {up ? "risers" : "fallers"} this patch.
        </p>
      ) : (
        <ol className="grid gap-1">
          {movers.map((m) => {
            const letter = tierLetter(m.tier);
            return (
              // Two rows, not one: name + delta + WR/PR/BR + games + a counters link never fit
              // across ~420px, so the delta badge used to land on top of longer champion names.
              <li
                key={m.championKey}
                className={`min-w-0 border border-l-2 border-border bg-surface-dark px-3 py-2 ${up ? "border-l-accent" : "border-l-danger"}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`tag-cut inline-grid h-[22px] w-[22px] shrink-0 place-items-center border font-mono text-[11px] font-bold ${tierChipClass(letter)}`}
                  >
                    {letter}
                  </span>
                  <Link
                    href={`/builds/${m.championKey}`}
                    className="group flex min-w-0 flex-1 items-center gap-2"
                  >
                    <ChampionIcon name={m.championKey} size={30} className="shrink-0" />
                    <span className="truncate text-sm font-semibold text-text group-hover:text-accent">
                      {m.name}
                    </span>
                  </Link>
                  <span className="shrink-0 text-right">
                    <span className={`block font-mono text-[15px] font-bold tabular-nums ${tone}`}>
                      {up ? "▲" : "▼"}
                      {Math.abs(m.delta)}
                    </span>
                    <span className="block font-mono text-[9.5px] tabular-nums text-text-muted">
                      #{m.prevPatchRank} → #{m.rank}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 pl-[32px] font-mono text-[10.5px] tabular-nums text-text-muted">
                  <span className="min-w-0 truncate">
                    <span className={m.winRate >= 50 ? "text-accent" : "text-text-body"}>
                      {m.winRate.toFixed(1)}%
                    </span>{" "}
                    WR · {m.pickRate.toFixed(1)}% PR · {m.banRate.toFixed(1)}% BR
                    {m.games > 0 && (
                      <span className="text-text-muted/60"> · {formatGames(m.games)}</span>
                    )}
                  </span>
                  <Link
                    href={`/counters/${m.championKey}`}
                    className="shrink-0 uppercase tracking-[0.1em] hover:text-accent"
                  >
                    Counters →
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
