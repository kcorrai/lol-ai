import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { tierLetter, type TierListEntry } from "@/domains/meta";

// Compact sample-size label: 1234 → "1.2k", 28 → "28".
function formatGames(games: number): string {
  return games >= 1000 ? `${(games / 1000).toFixed(1)}k` : String(games);
}

const TIER_COLORS: Record<string, string> = {
  S: "bg-amber-400/20 text-amber-300 border-amber-400/40",
  A: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  B: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  C: "bg-slate-400/15 text-slate-300 border-slate-400/30",
  D: "bg-rose-400/10 text-rose-300 border-rose-400/30",
};

interface TierRowProps {
  entry: TierListEntry;
  index: number;
  // Where the champion name links (defaults to the counter page). ARAM points at the build.
  hrefBase?: string;
  // ARAM has no bans — hide that column.
  showBan?: boolean;
  // Show the patch-movement (▲/▼) column from rank_prev_patch vs rank.
  showMovement?: boolean;
}

export function TierRow({
  entry,
  index,
  hrefBase = "/counters",
  showBan = true,
  showMovement = false,
}: TierRowProps) {
  const letter = tierLetter(entry.tier);
  // A tiny sample makes op.gg's S/A grade meaningless — show the letter greyed
  // rather than in a confident tier colour.
  const tierClass = entry.lowConfidence
    ? "border-border text-text-muted/50"
    : (TIER_COLORS[letter] ?? "border-border text-text-muted");
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-2.5 pl-3 pr-2 text-sm text-text-muted">{index + 1}</td>
      <td className="px-2">
        <span
          title={entry.lowConfidence ? `Low sample — ${formatGames(entry.games)} games` : undefined}
          className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold ${tierClass}`}
        >
          {letter}
        </span>
      </td>
      <td className="px-2">
        <Link
          href={`${hrefBase}/${entry.championKey}`}
          className="flex items-center gap-2 hover:text-accent"
        >
          <ChampionIcon name={entry.championKey} size={30} />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-text">{entry.name}</span>
            {entry.games > 0 && (
              <span className={`text-[10px] ${entry.lowConfidence ? "text-amber-400/70" : "text-text-muted/60"}`}>
                {formatGames(entry.games)} games{entry.lowConfidence ? " · low confidence" : ""}
              </span>
            )}
          </span>
        </Link>
      </td>
      {showMovement && (
        <td className="px-2 text-center">
          <Movement rank={entry.rank} prev={entry.prevPatchRank} />
        </td>
      )}
      <td className="px-2 text-right text-sm font-semibold text-text">{entry.winRate.toFixed(1)}%</td>
      <td className={`${showBan ? "px-2" : "py-2.5 pl-2 pr-3"} text-right text-sm text-text-muted`}>
        {entry.pickRate.toFixed(1)}%
      </td>
      {showBan && (
        <td className="py-2.5 pl-2 pr-3 text-right text-sm text-text-muted">{entry.banRate.toFixed(1)}%</td>
      )}
    </tr>
  );
}

// Patch movement: lower rank number is better, so a drop in rank number is a climb.
function Movement({ rank, prev }: { rank: number; prev: number }) {
  if (!rank || !prev) return <span className="text-xs text-text-muted">—</span>;
  const delta = prev - rank;
  if (delta === 0) return <span className="text-xs text-text-muted">–</span>;
  const up = delta > 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-success" : "text-danger"}`}>
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}
