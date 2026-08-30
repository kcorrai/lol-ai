import { ArrowRight, Link2Off } from "lucide-react";
import { ChampionTile } from "@/components/hud/ChampionTile";
import { Button } from "@/components/hud/Button";
import { ChampionSplash } from "@/components/hud/Splash";
import { Spinner } from "@/components/hud/Spinner";
import { StatBlock } from "@/components/hud/StatBlock";
import { HudPanel } from "@/components/layout/HudPanel";
import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import { matchLength, scoreline, type ArchiveRow } from "@/lib/lastMatch";
import { formatCount } from "@/lib/uiLocale";
import type { LastMatchState, PostGameState } from "@/lib/usePostGame";

/**
 * What the app says once a game is over.
 *
 * It appears only after a game this window actually watched has ended, and then stays — the
 * player alt-tabbing out of a finished match is exactly who it is for. It is the one panel on
 * the screen allowed to glow, because it is the one thing that has just changed.
 *
 * The wording never claims more than happened. "Pulling" means the request was accepted, not
 * that the match is in the database: the sync is asynchronous and this window is not told when
 * it lands. Telling a player their game is ready and handing them a list that does not have it
 * yet is worse than telling them it is on its way.
 */
export function PostGamePanel({
  state,
  lastMatch,
  open,
}: {
  state: PostGameState;
  lastMatch: LastMatchState;
  open: () => void;
}): React.ReactElement | null {
  if (state.status === "idle") return null;

  return (
    <HudPanel
      tone="accent"
      title="Game over"
      action={
        state.status === "reported" ? (
          <Button size="sm" iconRight={ArrowRight} onClick={open}>
            Open your report
          </Button>
        ) : null
      }
      bare
      className="relative overflow-hidden"
    >
      {/* One highlight crossing the banner, and only this banner. It is the screen saying
          something has changed, on a screen where nothing else moves. */}
      <span
        aria-hidden
        className="hud-sweep pointer-events-none absolute inset-y-0 left-0 w-[16%] bg-gradient-to-r from-transparent via-accent/10 to-transparent"
      />
      {/* The match itself once it has landed, and the sentence about it being on its way
          until then. The panel never claims the first while it only has the second. */}
      {lastMatch.status === "ready" ? <Match row={lastMatch.row} /> : <Body state={state} />}
    </HudPanel>
  );
}

/**
 * The game that just finished.
 *
 * The competitors all put this on screen the moment a match ends; what took this app so long
 * is that it would not say a game was ready before it was. The pull is asynchronous and the
 * window is never told it finished, so the archive is watched until the match is actually in
 * it — and this is drawn only then.
 *
 * The player's own line, and nothing about anybody else: this is a record of what they did,
 * and the rest of the scoreboard is a click away in the report.
 */
function Match({ row }: { row: ArchiveRow }): React.ReactElement {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <ChampionSplash champion={row.championName} opacity={0.24} position="58% 24%" />
        <span className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/40" />
      </span>

      <div className="relative flex flex-wrap items-center gap-5 p-5">
        <ChampionTile champion={row.championName} size={64} selected={row.won} />
        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-[26px] font-black uppercase leading-none tracking-[0.05em]",
              row.won ? "text-accent" : "text-danger"
            )}
          >
            {row.won ? "Win" : "Loss"}
          </p>
          <p className="mt-2 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            {row.championName} · {row.position || "—"} · {matchLength(row.gameDurationSeconds)}
          </p>
        </div>

        <dl className="ml-auto flex flex-wrap gap-8">
          <StatBlock label="KDA" value={scoreline(row)} size="sm" />
          <StatBlock label="CS" value={formatCount(row.cs)} size="sm" />
          <StatBlock label="CS/min" value={row.csPerMinute.toFixed(1)} size="sm" />
          <StatBlock label="Vision" value={formatCount(row.visionScore)} size="sm" />
        </dl>
      </div>
    </div>
  );
}

function Body({ state }: { state: PostGameState }): React.ReactElement {
  switch (state.status) {
    case "idle":
      // Unreachable — the panel returns null above. Kept so the switch is total and a new
      // state cannot be added without deciding what it says.
      return <PanelNote>—</PanelNote>;
    case "unavailable":
      return (
        <PanelNote>
          This preview cannot report the game. Run the desktop app, which has the credential store.
        </PanelNote>
      );
    case "reporting":
      return <PanelNote busy>Telling LoL AI Coach your game just ended…</PanelNote>;
    case "unpaired":
      return <PanelNote>Pair this machine on the Pairing screen.</PanelNote>;
    case "error":
      return <PanelNote>{state.message}</PanelNote>;
    case "reported":
      return <Reported status={state.sync.status} />;
  }
}

function Reported({ status }: { status: string }): React.ReactElement {
  if (status === "no_riot_account") {
    return (
      <div className="flex flex-wrap items-center gap-4 p-5">
        <Link2Off aria-hidden className="h-[22px] w-[22px] shrink-0 text-warning" />
        <p className="min-w-0 text-[14.5px] text-text-body">
          Link a Riot account on the website and your games will be pulled in as they finish.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 p-6">
      <Spinner />
      <div className="min-w-0">
        <p className="font-display text-[17px] font-bold uppercase tracking-[0.05em] text-text">
          {status === "already_running" ? "Already pulling your games" : "Pulling your last game"}
        </p>
        <p className="mt-2 max-w-[62ch] text-[13.5px] text-text-body">
          {/* Said plainly, because it is the reason this app is worth having open: without it
              the match waits until someone next opens the dashboard. */}
          Normally this waits until you next open the site. It is happening now because this machine
          saw the game end.
        </p>
      </div>
    </div>
  );
}
