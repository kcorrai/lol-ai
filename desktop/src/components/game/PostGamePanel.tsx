import { ExternalLink } from "lucide-react";
import { HudPanel } from "@/components/layout/HudPanel";
import { PanelNote } from "@/components/game/PanelNote";
import type { PostGameState } from "@/lib/usePostGame";

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
  open,
  openError,
}: {
  state: PostGameState;
  open: () => Promise<void>;
  openError: string | null;
}): React.ReactElement | null {
  if (state.status === "idle") return null;

  return (
    <HudPanel title="Game over" action={state.status === "reported" ? <OpenButton open={open} /> : null}>
      <Body state={state} />
      {openError ? <p className="mt-3 text-sm text-danger">{openError}</p> : null}
    </HudPanel>
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
          This preview cannot report the game. Run the desktop app, which has the credential
          store.
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
        Normally this waits until you next open the site. It is happening now because this
        machine saw the game end.
      </p>
    </div>
  );
}
