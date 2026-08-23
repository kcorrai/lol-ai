import Image from "next/image";
import Link from "next/link";
import type { MatchDetail } from "@/domains/esports";

/** The series' own team shape — `MatchDetail` declares it inline. */
type SeriesTeam = MatchDetail["teams"][number];

interface SeriesHeaderProps {
  match: MatchDetail;
  teamSlugs: Map<string, string>;
  /** Kickoff, when the schedule window still covers this series. */
  startTime: string | null;
}

function TeamSide({
  team,
  slug,
  align,
}: {
  team: SeriesTeam | undefined;
  slug: string | undefined;
  align: "left" | "right";
}): React.JSX.Element {
  if (!team) {
    return <span className={`hud-label ${align === "right" ? "text-right" : ""}`}>TBD</span>;
  }

  const name = slug ? (
    <Link href={`/esports/teams/${slug}`} className="hover:text-acid-500">
      {team.name}
    </Link>
  ) : (
    team.name
  );

  return (
    <div
      className={`flex min-w-0 items-center gap-3.5 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {team.image && (
        <Image
          src={team.image}
          alt=""
          width={44}
          height={44}
          className="tag-cut h-11 w-11 shrink-0 border border-line-2 bg-surface-dark object-contain p-1"
          aria-hidden
          unoptimized
        />
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-xl font-black uppercase tracking-wide text-fg-1 md:text-2xl">
          {name}
        </span>
        {team.code && (
          <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
            {team.code}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * The series, stated once.
 *
 * The old header gave each team its own `<h1>`, so every match page shipped two
 * top-level headings and neither named the thing the page is about. There is
 * one heading now — the fixture — and the teams sit either side of the score.
 */
export function SeriesHeader({
  match,
  teamSlugs,
  startTime,
}: SeriesHeaderProps): React.JSX.Element {
  const [home, away] = match.teams;
  const decided = (home?.gameWins ?? 0) + (away?.gameWins ?? 0) > 0;

  const context = [
    match.league.name,
    match.bestOf ? `Bo${match.bestOf}` : null,
    startTime
      ? new Date(startTime).toLocaleDateString("en-US", { day: "numeric", month: "short" })
      : null,
  ].filter(Boolean);

  return (
    <header className="notch bg-hero-fade relative overflow-hidden border border-border bg-surface px-5 py-6 md:px-7">
      <p className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
        {"// "}
        {match.league.slug ? (
          <Link href={`/esports/leagues/${match.league.slug}`} className="hover:text-acid-400">
            {context[0]}
          </Link>
        ) : (
          context[0]
        )}
        {context.length > 1 ? ` · ${context.slice(1).join(" · ")}` : ""}
      </p>

      <h1 className="sr-only">
        {home?.name ?? "TBD"} vs {away?.name ?? "TBD"} — {match.league.name}
      </h1>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
        <TeamSide team={home} slug={home ? teamSlugs.get(home.id) : undefined} align="left" />

        <div className="text-center">
          <div className="font-mono text-3xl font-bold tabular-nums leading-none text-fg-1 md:text-4xl">
            {home?.gameWins ?? 0}
            <span className="mx-2 text-fg-4">–</span>
            {away?.gameWins ?? 0}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-label text-fg-4">
            {decided ? "Result" : "Not started"}
          </div>
        </div>

        <TeamSide team={away} slug={away ? teamSlugs.get(away.id) : undefined} align="right" />
      </div>
    </header>
  );
}
