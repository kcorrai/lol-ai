import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { tierLetter, type MetaMover } from "@/domains/meta";

interface MoverListProps {
  title: string;
  movers: MetaMover[];
  direction: "up" | "down";
}

const TIER_COLORS: Record<string, string> = {
  S: "bg-amber-400/20 text-amber-300 border-amber-400/40",
  A: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  B: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  C: "bg-slate-400/15 text-slate-300 border-slate-400/30",
  D: "bg-rose-400/10 text-rose-300 border-rose-400/30",
};

function formatGames(games: number): string {
  return games >= 1000 ? `${(games / 1000).toFixed(0)}k` : String(games);
}

export function MoverList({ title, movers, direction }: MoverListProps) {
  const up = direction === "up";
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-4">
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
              <li
                key={m.championKey}
                className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-surface px-3 py-2"
              >
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                    TIER_COLORS[letter] ?? "border-border text-text-muted"
                  }`}
                >
                  {letter}
                </span>
                <Link href={`/builds/${m.championKey}`} className="flex items-center gap-2 hover:text-accent">
                  <ChampionIcon name={m.championKey} size={30} />
                  <span className="text-sm font-medium text-text">{m.name}</span>
                </Link>
                <span className={`text-xs font-semibold ${up ? "text-success" : "text-danger"}`}>
                  {up ? "▲" : "▼"}
                  {Math.abs(m.delta)}
                </span>
                <span className="ml-auto text-right text-xs text-text-muted">
                  <span className={`font-semibold ${m.winRate >= 50 ? "text-success" : "text-text"}`}>
                    {m.winRate.toFixed(1)}%
                  </span>{" "}
                  WR · {m.pickRate.toFixed(1)}% PR · {m.banRate.toFixed(1)}% BR
                  {m.games > 0 && <span className="text-text-muted/60"> · {formatGames(m.games)} games</span>}
                </span>
                <Link
                  href={`/counters/${m.championKey}`}
                  className="text-xs text-text-muted underline-offset-2 hover:text-accent hover:underline"
                >
                  counters
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
