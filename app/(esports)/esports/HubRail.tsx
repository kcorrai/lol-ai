import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { roleLabel } from "@/domains/esports";
import type { ProMeta, StandingsRow } from "@/domains/esports";
import { HubFollowedTeams } from "./HubFollowedTeams";

interface HubRailProps {
  standings: { leagueName: string; leagueSlug: string; rows: StandingsRow[] } | null;
  proMeta: ProMeta | null;
}

const PANEL = "notch border border-border bg-surface";
const PANEL_HEAD =
  "border-b border-line-1 px-4 py-3 font-mono text-[10.5px] uppercase tracking-label text-text-muted";

const STANDINGS_SHOWN = 6;
const PICKS_SHOWN = 5;

/** Win rate decides the colour: a losing record should not read as a good one. */
function recordTone(row: StandingsRow): string {
  if (row.winRate === null) return "text-text-body";
  if (row.winRate >= 60) return "text-accent";
  if (row.winRate < 40) return "text-danger";
  return "text-text";
}

/** The side rail: who is winning, what the pros are picking, and one way in. */
export function HubRail({ standings, proMeta }: HubRailProps): React.ReactElement {
  return (
    <div className="grid gap-4 lg:sticky lg:top-6">
      {/* Renders nothing for a reader who follows nobody, which is most of them. */}
      <HubFollowedTeams />
      {standings && standings.rows.length > 0 && (
        <section className={PANEL}>
          <div className={PANEL_HEAD}>{`// ${standings.leagueName} standings`}</div>
          {standings.rows.slice(0, STANDINGS_SHOWN).map((row) => (
            <div
              key={row.team.id}
              className="grid grid-cols-[20px_22px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line-1 px-4 py-2.5 last:border-b-0"
            >
              <span className="font-mono text-[11px] text-text-faint">{row.rank}</span>
              {row.team.image ? (
                <Image
                  src={row.team.image}
                  alt=""
                  aria-hidden
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] object-contain"
                  unoptimized
                />
              ) : (
                <span aria-hidden className="h-[22px] w-[22px]" />
              )}
              <span className="truncate font-display text-[13.5px] font-bold uppercase tracking-[0.05em] text-text">
                {row.team.code || row.team.name}
              </span>
              <span className={`font-mono text-[12.5px] tabular-nums ${recordTone(row)}`}>
                {row.wins}–{row.losses}
              </span>
            </div>
          ))}
          <div className="px-4 py-2.5">
            <Link
              href={`/esports/leagues/${standings.leagueSlug}`}
              className="font-mono text-[10px] uppercase tracking-label text-accent hover:underline"
            >
              Full table →
            </Link>
          </div>
        </section>
      )}

      {proMeta && proMeta.champions.length > 0 && (
        <section className={PANEL}>
          <div className={PANEL_HEAD}>
            {`// Pro meta${proMeta.patches.length > 0 ? ` · patch ${proMeta.patches[proMeta.patches.length - 1]}` : ""}`}
          </div>
          {proMeta.champions.slice(0, PICKS_SHOWN).map((champion) => (
            <div
              key={champion.championId}
              className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-1 px-4 py-2.5"
            >
              <ChampionIcon name={champion.championId} size={28} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-text">{champion.championId}</span>
                <span className="block font-mono text-[9.5px] uppercase tracking-label text-text-faint">
                  {champion.topRole ? `${roleLabel(champion.topRole)} · ` : ""}
                  {champion.picks} games
                </span>
              </span>
              <span className="font-mono text-[12.5px] tabular-nums text-accent">
                {champion.pickRate.toFixed(0)}%
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
              Pick rate over {proMeta.games} games
            </span>
            <Link
              href="/esports/champions"
              className="shrink-0 font-mono text-[10px] uppercase tracking-label text-accent hover:underline"
            >
              All →
            </Link>
          </div>
        </section>
      )}

      <section className="notch glow-accent-soft bg-hero-fade border border-accent bg-surface px-4 py-5">
        <p className="font-display text-base font-extrabold uppercase leading-tight tracking-[0.03em] text-text">
          Pros ban on information. You ban on vibes.
        </p>
        <p className="mt-2.5 text-[13px] text-text-body">
          Your solo queue bans ignore the champions with the highest presence in your rank. Your
          coach can fix that in one pass.
        </p>
        <Link
          href="/register"
          className="notch-sm mt-3.5 flex h-[34px] items-center justify-center gap-1.5 bg-accent font-mono text-[11px] font-bold uppercase tracking-label text-background transition-opacity hover:opacity-90"
        >
          Analyze my games
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
