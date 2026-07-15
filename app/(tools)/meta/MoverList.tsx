import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { MetaMover } from "@/domains/meta";

interface MoverListProps {
  title: string;
  movers: MetaMover[];
  direction: "up" | "down";
}

export function MoverList({ title, movers, direction }: MoverListProps) {
  const up = direction === "up";
  return (
    <section className="rounded-2xl border border-border bg-surface/60 p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-text">
        <span className={up ? "text-success" : "text-danger"}>{up ? "▲" : "▼"}</span>
        {title}
      </h2>
      <ol className="space-y-1.5">
        {movers.map((m) => (
          <li
            key={m.championKey}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2"
          >
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
              WR · {m.pickRate.toFixed(1)}% PR
            </span>
            <Link
              href={`/counters/${m.championKey}`}
              className="text-xs text-text-muted underline-offset-2 hover:text-accent hover:underline"
            >
              counters
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
