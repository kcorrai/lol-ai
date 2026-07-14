import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { tierLetter, type TierListEntry } from "@/domains/meta";

const TIER_COLORS: Record<string, string> = {
  S: "bg-amber-400/20 text-amber-300 border-amber-400/40",
  A: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  B: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  C: "bg-slate-400/15 text-slate-300 border-slate-400/30",
  D: "bg-rose-400/10 text-rose-300 border-rose-400/30",
};

export function TierRow({ entry, index }: { entry: TierListEntry; index: number }) {
  const letter = tierLetter(entry.tier);
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-2.5 pl-3 pr-2 text-sm text-text-muted">{index + 1}</td>
      <td className="px-2">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold ${
            TIER_COLORS[letter] ?? "border-border text-text-muted"
          }`}
        >
          {letter}
        </span>
      </td>
      <td className="px-2">
        <Link
          href={`/counters/${entry.championKey}`}
          className="flex items-center gap-2 hover:text-accent"
        >
          <ChampionIcon name={entry.championKey} size={30} />
          <span className="text-sm font-medium text-text">{entry.name}</span>
        </Link>
      </td>
      <td className="px-2 text-right text-sm font-semibold text-text">{entry.winRate.toFixed(1)}%</td>
      <td className="px-2 text-right text-sm text-text-muted">{entry.pickRate.toFixed(1)}%</td>
      <td className="py-2.5 pl-2 pr-3 text-right text-sm text-text-muted">{entry.banRate.toFixed(1)}%</td>
    </tr>
  );
}
