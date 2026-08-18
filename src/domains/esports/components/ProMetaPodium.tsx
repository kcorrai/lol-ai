import Image from "next/image";
import Link from "next/link";
import { championSplashUrl } from "@/lib/ddragon";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ROLE_SHORT } from "@/domains/esports/roles";
import type { ProChampionStat } from "@/domains/esports/types";

/** How many champions get a card. Four fills the row and stops well short of a wall. */
const PODIUM_SIZE = 4;

function winRateTone(winRate: number | null): string {
  if (winRate === null) return "text-text";
  if (winRate >= 60) return "text-accent";
  if (winRate < 40) return "text-danger";
  return "text-text";
}

function Card({ champion, rank }: { champion: ProChampionStat; rank: number }): React.ReactElement {
  const lead = rank === 1;
  const losses = champion.decidedGames - champion.wins;

  return (
    <Link
      href={`/esports/champions/${champion.championId}`}
      className={`notch group relative block min-h-[196px] overflow-hidden border transition-colors ${
        lead ? "glow-accent-soft border-accent" : "border-border hover:border-line-3"
      }`}
    >
      <Image
        src={championSplashUrl(champion.championId)}
        alt=""
        fill
        sizes="(min-width: 1024px) 300px, 50vw"
        className="object-cover object-[52%_14%] opacity-30 transition-opacity group-hover:opacity-40"
        aria-hidden
        unoptimized
      />
      {/* The ink floor: splash art is bright and the figures on top of it are the
          point of the card, not the illustration. */}
      <span
        className="absolute inset-0 bg-gradient-to-t from-surface-dark from-[16%] to-transparent to-[78%]"
        aria-hidden
      />

      <span className="relative flex h-full min-h-[196px] flex-col justify-between gap-5 p-4">
        <span className="flex items-start justify-between gap-2.5">
          <span className="font-mono text-[9.5px] uppercase tracking-label text-text-muted">
            #{rank}
            {champion.topRole ? ` · ${ROLE_SHORT[champion.topRole]}` : ""}
          </span>
          <span className="tag-cut border border-accent bg-[var(--surface-accent)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-label text-accent">
            {champion.pickRate.toFixed(0)}% pick
          </span>
        </span>

        <span className="block">
          <span className="flex items-center gap-3">
            <ChampionIcon name={champion.championId} size={36} />
            <span className="truncate font-display text-[17px] font-extrabold uppercase tracking-[0.04em] text-text">
              {champion.championId}
            </span>
          </span>
          <span className="mt-3 flex items-baseline gap-2.5">
            <span
              className={`font-mono text-[22px] font-bold leading-none ${winRateTone(champion.winRate)}`}
            >
              {champion.winRate === null ? "—" : `${champion.winRate.toFixed(0)}%`}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-label text-text-muted">
              win · {champion.wins}–{losses}
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * The champions pro teams reach for first, above the table that lists them all.
 *
 * The table answers "how does the whole field look"; this answers "what is the
 * meta", which is the question most readers actually arrive with — and it is the
 * one place on the page where a champion is worth showing at the size of its own
 * splash rather than as a 24px icon in a row.
 */
export function ProMetaPodium({
  champions,
}: {
  champions: ProChampionStat[];
}): React.ReactElement | null {
  const top = champions.slice(0, PODIUM_SIZE);
  if (top.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {top.map((champion, index) => (
        <Card key={champion.championId} champion={champion} rank={index + 1} />
      ))}
    </div>
  );
}
