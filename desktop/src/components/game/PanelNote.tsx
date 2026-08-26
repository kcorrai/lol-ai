import type { LiveContextState } from "@/lib/useLiveContext";

/**
 * The one line a panel shows instead of a reading.
 *
 * Both live panels are empty for the same handful of reasons, and each of those reasons
 * has a different thing the player can do about it — so each says which. An empty panel
 * with no explanation reads as a broken app.
 */
export function PanelNote({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p className="px-1 py-6 text-center text-sm text-text-muted">{children}</p>;
}

/**
 * Renders the states that are not a reading, or `null` when there is one.
 *
 * Returned rather than thrown around: the caller decides what a *ready* context with
 * nothing in it should say, because that answer differs between the two panels.
 */
export function noteFor(state: LiveContextState): React.ReactElement | null {
  switch (state.status) {
    // Not "start a match" any more. `GameScreen` stopped rendering these panels when
    // there is no game — the wait is said once, for the whole screen — so the only way
    // to be idle *and* on screen is a game this window cannot find the player in:
    // spectating, or a mode where the active player is not one of the ten.
    case "idle":
      return <PanelNote>This window cannot find you among the players in this game.</PanelNote>;
    case "unavailable":
      return (
        <PanelNote>
          This preview cannot read your account. Run the desktop app, which has the credential
          store.
        </PanelNote>
      );
    case "loading":
      return <PanelNote>Reading your account…</PanelNote>;
    case "unpaired":
      return <PanelNote>Pair this machine on the Pairing screen.</PanelNote>;
    case "error":
      return <PanelNote>{state.message}</PanelNote>;
    case "ready":
      return null;
  }
}

/** Shown in place of everything personal when the account has no Riot account linked. */
export function NoRiotAccount(): React.ReactElement {
  return (
    <PanelNote>
      Link a Riot account on the website and your own record in this lane appears here.
    </PanelNote>
  );
}
