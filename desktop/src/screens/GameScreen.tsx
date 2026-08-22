import { HudPanel } from "@/components/layout/HudPanel";
import { NotImplemented } from "@/components/NotImplemented";
import { displayNameOf, type AllGameData, type LivePlayer } from "@/lib/liveClient/schema";
import type { LiveRead } from "@/lib/liveClient/client";

export function GameScreen({ read }: { read: LiveRead<AllGameData> }): React.ReactElement {
  return (
    <div className="grid gap-4">
      <HudPanel title="Current game">
        {read.status === "ok" ? <GameSummary data={read.data} /> : <NoGame read={read} />}
      </HudPanel>

      <HudPanel title="Game plan">
        <NotImplemented
          what="Matchup reads, your recurring weakness in this lane and a plan for it come from your account on the web — which needs the desktop to be paired first."
          phase="Phase 3 · pairing, then phase 4 · live dashboard"
        />
      </HudPanel>
    </div>
  );
}

/** Only ever rendered for the non-`ok` branches, so the prop excludes the one that carries data. */
function NoGame({ read }: { read: Exclude<LiveRead<AllGameData>, { status: "ok" }> }): React.ReactElement {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text-muted">
        {read.status === "no-game" ? "Waiting for a game" : "Cannot read the client"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-body">
        {read.status === "no-game"
          ? "Start a match and this panel fills in on its own."
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
        <Stat label="Gold" value={Math.round(data.activePlayer.currentGold).toLocaleString()} />
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
