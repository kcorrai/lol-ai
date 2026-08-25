import Link from "next/link";
import { DraftResults } from "@/domains/meta/components/DraftResults";
import { gameModeLabel } from "@/lib/riot/gameModes";
import { POSITION_LABELS } from "@/lib/riot/rankDisplay";
import type { LiveScout } from "@/domains/riot";
import { LiveTeamColumn } from "./LiveTeamColumn";
import { formatCount } from "@/lib/uiLocale";

interface Props {
  scout: LiveScout;
  riotId: string;
  region: string;
}

/**
 * The clock, which is the first thing you check on a live game.
 *
 * Riot counts *down* through the loading screen — a real payload read `gameLength: -22` — so a
 * negative is not a bug to clamp away but the most useful thing the page can say: the draft is
 * already known and the game has not started.
 */
function elapsed(seconds: number): string {
  if (seconds <= 0) return "starting now";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")} in`;
}

export function LiveScoutView({ scout, riotId, region }: Props): React.ReactElement {
  const blue = scout.players.filter((p) => p.teamId === 100);
  const red = scout.players.filter((p) => p.teamId === 200);
  const [gameName, tagLine] = riotId.split("#");
  const matchup = scout.yourMatchup;

  return (
    <div className="mx-auto max-w-[1240px] space-y-4 px-4 py-7">
      <header className="notch border border-l-[3px] border-border border-l-accent bg-surface p-5">
        <p className="hud-label">{"// In game now"}</p>
        <h1 className="mt-1.5 font-display text-xl font-extrabold uppercase text-text">{riotId}</h1>
        <p className="mt-1 font-mono text-[12px] text-text-muted">
          {gameModeLabel(scout.gameMode)} · {elapsed(scout.gameLength)} ·{" "}
          {scout.yourSide === "blue" ? "Blue" : "Red"} side
        </p>
        {gameName && tagLine && (
          <Link
            href={`/s/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`}
            className="mt-3 inline-block font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:text-accent"
          >
            ← Back to profile
          </Link>
        )}
      </header>

      {/* Lanes are inferred from Smite and this patch's lane frequencies — Riot reports none — so
          the page says so once, here, rather than hedging on every row. */}
      <p className="font-mono text-[11px] text-text-muted">
        Lanes are inferred from summoner spells and how each champion is actually played this patch.
        Riot does not report them, so treat a surprising one as a guess.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <LiveTeamColumn
          players={blue}
          label="Blue team"
          yours={scout.yourSide === "blue"}
          region={region}
        />
        <LiveTeamColumn
          players={red}
          label="Red team"
          yours={scout.yourSide === "red"}
          region={region}
        />
      </div>

      {matchup && (
        <section className="notch border border-border bg-surface p-5">
          <p className="hud-label mb-2">{"// Your lane"}</p>
          <p className="text-[15px] text-text">
            {matchup.championA.name} vs {matchup.championB.name} ·{" "}
            {POSITION_LABELS[matchup.position] ?? matchup.position}
          </p>
          <p className="mt-1 font-mono text-[12px] text-text-muted">
            {matchup.games > 0
              ? `${matchup.aWinRateVsB}% win rate over ${formatCount(matchup.games)} games on patch ${matchup.patch}`
              : "Not enough games on this patch to call the matchup."}
          </p>
          {matchup.hints.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {matchup.hints.map((hint) => (
                <li key={hint} className="text-[13px] leading-relaxed text-text-body">
                  {hint}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {scout.evaluation && <DraftResults evaluation={scout.evaluation} />}
    </div>
  );
}
