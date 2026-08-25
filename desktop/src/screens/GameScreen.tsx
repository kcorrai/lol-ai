import { BuildPanel } from "@/components/game/BuildPanel";
import { GamePlanPanel } from "@/components/game/GamePlanPanel";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { PostGamePanel } from "@/components/game/PostGamePanel";
import { ThisGamePanel } from "@/components/game/ThisGamePanel";
import { HudPanel } from "@/components/layout/HudPanel";
import { displayNameOf, type AllGameData, type LivePlayer } from "@/lib/liveClient/schema";
import type { LiveRead } from "@/lib/liveClient/client";
import { formatCount } from "@/lib/uiLocale";
import { useLiveContext } from "@/lib/useLiveContext";
import { usePostGame } from "@/lib/usePostGame";

/**
 * The two halves of this app, on one screen.
 *
 * The top panel is what this machine can see and the website cannot — the game itself. The
 * two below are what the website knows and this machine cannot work out — the account
 * playing it. Neither half is worth much alone, which is the whole argument for a desktop
 * companion existing at all (ADR-038).
 */
export function GameScreen({ read }: { read: LiveRead<AllGameData> }): React.ReactElement {
  const context = useLiveContext(read);
  const postGame = usePostGame(read);

  return (
    <div className="grid gap-4">
      {/* Above the rest once a game has ended: it is the only thing on this screen with
          something for the player to do. */}
      <PostGamePanel state={postGame.state} open={postGame.open} openError={postGame.openError} />

      {/* One empty state for the screen, not one per panel.

          Every panel below is a reading of a game, so with no game they were five boxes
          in a column, four of them printing the same sentence — which reads as an app
          that has broken in four places rather than one that is waiting. They are not
          rendered at all now, and the wait is said once, with what it is waiting to
          fill. */}
      {read.status === "ok" ? (
        <>
          <HudPanel title="Current game">
            <GameSummary data={read.data} />
          </HudPanel>

          <ThisGamePanel read={read} state={context} />
          <MatchupPanel state={context} />
          <BuildPanel state={context} />
          <GamePlanPanel state={context} />
        </>
      ) : (
        <HudPanel title="Current game">
          <NoGame read={read} />
        </HudPanel>
      )}
    </div>
  );
}

/** Only ever rendered for the non-`ok` branches, so the prop excludes the one that carries data. */
function NoGame({
  read,
}: {
  read: Exclude<LiveRead<AllGameData>, { status: "ok" }>;
}): React.ReactElement {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text-muted">
        {read.status === "no-game" ? "Waiting for a game" : "Cannot read the client"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-body">
        {read.status === "no-game"
          ? "Start a match and this screen fills in on its own — the scoreboard, your numbers against your own average, the lane, the build and the plan."
          : read.reason}
      </p>
    </div>
  );
}

function GameSummary({ data }: { data: AllGameData }): React.ReactElement {
  const order = data.allPlayers.filter((p) => p.team === "ORDER");
  const chaos = data.allPlayers.filter((p) => p.team === "CHAOS");

  return (
    <div className="grid gap-4">
      <dl className="grid grid-cols-3 gap-px bg-line-1">
        <Stat label="Mode" value={data.gameData.gameMode} />
        <Stat label="Clock" value={formatClock(data.gameData.gameTime)} />
        <Stat label="Gold" value={formatCount(Math.round(data.activePlayer.currentGold))} />
      </dl>
      <div className="grid gap-4 md:grid-cols-2">
        <Side label="Order" players={order} />
        <Side label="Chaos" players={chaos} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="hud-label">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-bold text-text">{value}</dd>
    </div>
  );
}

function Side({ label, players }: { label: string; players: LivePlayer[] }): React.ReactElement {
  return (
    <div>
      <p className="hud-label mb-2">{label}</p>
      <ul className="grid gap-px bg-line-1">
        {players.map((p) => (
          <li
            key={`${p.championName}-${displayNameOf(p)}`}
            className="flex items-baseline justify-between gap-3 bg-surface px-3 py-2"
          >
            <span className="truncate text-sm text-text">{p.championName}</span>
            <span className="shrink-0 font-mono text-xs text-text-muted">
              {p.scores.kills}/{p.scores.deaths}/{p.scores.assists}
              <span className="ml-2 text-text-faint">{p.scores.creepScore} cs</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** `gameTime` is seconds as a float; the scoreboard the player is used to reads mm:ss. */
function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}
