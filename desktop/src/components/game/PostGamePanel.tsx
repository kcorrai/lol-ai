import { ExternalLink } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { HudPanel } from "@/components/layout/HudPanel";
import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import { matchLength, scoreline, type ArchiveRow } from "@/lib/lastMatch";
import { formatCount } from "@/lib/uiLocale";
import type { LastMatchState, PostGameState } from "@/lib/usePostGame";

/**
 * What the app says once a game is over.
 *
 * It appears only after a game this window actually watched has ended, and then stays —
 * the player alt-tabbing out of a finished match is exactly who it is for.
 *
 * The wording never claims more than happened. "Pulling" means the request was accepted,
 * not that the match is in the database: the sync is asynchronous and this window is not
 * told when it lands. Telling a player their game is ready and handing them a list that
 * does not have it yet is worse than telling them it is on its way.
 */
export function PostGamePanel({
  state,
  lastMatch,
  open,
  openError,
}: {
  state: PostGameState;
  lastMatch: LastMatchState;
  open: () => Promise<void>;
  openError: string | null;
}): React.ReactElement | null {
  if (state.status === "idle") return null;

  return (
    <HudPanel
      title="Game over"
      action={state.status === "reported" ? <OpenButton open={open} /> : null}
    >
      {/* The match itself once it has landed, and the sentence about it being on its way
          until then. The panel never claims the first while it only has the second. */}
      {lastMatch.status === "ready" ? <Match row={lastMatch.row} /> : <Body state={state} />}
      {openError ? <p className="mt-3 text-sm text-danger">{openError}</p> : null}
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
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <ChampionIcon name={row.championName} size={40} className="shrink-0" />
        <div className="min-w-0">
          <p
            className={cn(
              "font-display text-sm font-bold uppercase tracking-[0.08em]",
              row.won ? "text-accent" : "text-danger"
            )}
          >
            {row.won ? "Win" : "Loss"}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {row.championName} · {row.position || "—"} · {matchLength(row.gameDurationSeconds)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-4 gap-px bg-line-1">
        <Figure label="KDA" value={scoreline(row)} />
        <Figure label="CS" value={`${formatCount(row.cs)}`} />
        <Figure label="CS/min" value={row.csPerMinute.toFixed(1)} />
        <Figure label="Vision" value={formatCount(row.visionScore)} />
      </dl>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="bg-surface px-3 py-2">
      <dt className="hud-label">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-bold tabular-nums text-text">{value}</dd>
    </div>
  );
}

function OpenButton({ open }: { open: () => Promise<void> }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => void open()}
      className="notch flex items-center gap-2 border border-accent bg-transparent px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.08em] text-accent transition-colors hover:bg-surface-2"
    >
      Open your report
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </button>
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
      return <PanelNote>Telling LoL AI Coach your game just ended…</PanelNote>;
    case "unpaired":
      return <PanelNote>Pair this machine with your account in Settings.</PanelNote>;
    case "error":
      return <PanelNote>{state.message}</PanelNote>;
    case "reported":
      return <Reported status={state.sync.status} />;
  }
}

function Reported({ status }: { status: string }): React.ReactElement {
  if (status === "no_riot_account") {
    return (
      <PanelNote>
        Link a Riot account on the website and your games will be pulled in as they finish.
      </PanelNote>
    );
  }

  return (
    <div className="px-1 py-4 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text">
        {status === "already_running" ? "Already pulling your games" : "Pulling your last game"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-text-body">
        {/* Said plainly, because it is the reason this app is worth having open: without
            it the match waits until someone next opens the dashboard. */}
        Normally this waits until you next open the site. It is happening now because this machine
        saw the game end.
      </p>
    </div>
  );
}
