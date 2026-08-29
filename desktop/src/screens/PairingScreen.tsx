import { ExternalLink, Loader2 } from "lucide-react";
import { HudPanel } from "@/components/layout/HudPanel";
import { CodeFallback } from "@/components/pairing/CodeFallback";
import { PairedDevice } from "@/components/pairing/PairedDevice";
import type { PairingHandle } from "@/lib/usePairing";

/** The handle comes from `App` rather than from a second `usePairing` here — see its doc. */
export function PairingScreen({ pairing }: { pairing: PairingHandle }): React.ReactElement {
  const { state, begin, cancel, pair, forget, retry } = pairing;

  // Offered only when pairing is the thing to do. An app that already holds a token and
  // merely cannot reach the website is not asked to pair again.
  const canPair =
    state.status === "unpaired" || state.status === "pairing" || state.status === "opening";

  return (
    <div className="grid gap-4">
      <HudPanel title="This device">
        {state.status === "loading" ? (
          <p className="text-sm text-text-muted">Asking your credential store…</p>
        ) : state.status === "unavailable" ? (
          // Three states, not two. Saying "not paired" where nothing could be asked would
          // be a guess dressed as a fact.
          <p className="text-sm text-text-body">
            This preview has no credential store to ask. Run the desktop app to see whether this
            machine is paired.
          </p>
        ) : state.status === "paired" ? (
          <PairedDevice pairing={state.pairing} onForget={forget} />
        ) : state.status === "offline" ? (
          <Retryable
            onRetry={retry}
            reason={state.error}
            what="This machine holds a token, but LoL AI Coach could not be reached to confirm it.
              Nothing is wrong with the pairing — the website is out of reach."
          />
        ) : state.status === "unknown" ? (
          // The fourth non-answer, and the one that used to fall through to the sentence
          // below it. An app whose credential store will not open does not know whether it
          // holds a token, and telling the player nothing is stored for it was a guess.
          <Retryable
            onRetry={retry}
            reason={state.error}
            what="Your credential store could not be opened, so whether this machine is paired is
              not something this app can tell you right now. The token, if there is one, has not
              been touched."
          />
        ) : (
          <p className="text-sm text-text-body">
            Not paired. Nothing is stored in your keychain for this app.
          </p>
        )}
      </HudPanel>

      {state.status === "approving" && <Approving onCancel={cancel} />}

      {canPair && (
        <HudPanel title="Pair this device">
          <div className="grid gap-4">
            <p className="text-sm text-text-body">
              This opens LoL AI Coach in your browser and asks you to approve this machine. Nothing
              to type.
            </p>

            {state.status === "unpaired" && state.error && (
              <p className="text-sm text-danger">{state.error}</p>
            )}

            <button
              type="button"
              onClick={() => void begin()}
              disabled={state.status !== "unpaired"}
              className="tag-cut flex h-11 w-full items-center justify-center gap-2 bg-accent font-display text-xs font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 disabled:opacity-60"
            >
              {state.status === "opening" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ExternalLink className="h-4 w-4" aria-hidden />
              )}
              {state.status === "opening" ? "Opening your browser…" : "Pair this machine"}
            </button>

            <CodeFallback
              onSubmit={pair}
              busy={state.status === "pairing"}
              error={state.status === "unpaired" ? state.error : null}
            />
          </div>
        </HudPanel>
      )}

      <HudPanel title="How it works">
        <ol className="grid gap-2 text-sm text-text-body">
          {[
            "This app asks LoL AI Coach to pair, and opens the page where you say yes.",
            "You sign in there if you are not already, and press Approve.",
            "This window notices within a couple of seconds and finishes on its own.",
            "The token goes to your operating system's keychain, not to a file.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="hud-label shrink-0 pt-0.5 text-accent">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-line-1 pt-3 text-xs text-text-muted">
          Your password is never stored on this machine, and revoking the device on the website is
          enough to cut it off.
        </p>
      </HudPanel>
    </div>
  );
}

/**
 * The wait between opening the browser and the player pressing Approve.
 *
 * It offers a way out rather than only a spinner. The browser may have opened behind the
 * game, or on a profile that is not signed in, and a window that can only be watched is
 * one the player has to kill the app to leave.
 */
function Approving({ onCancel }: { onCancel: () => Promise<void> }): React.ReactElement {
  return (
    <HudPanel title="Waiting for you">
      <div className="grid gap-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden />
          <p className="text-sm text-text-body">
            Your browser should be showing “Approve this machine?”. Press Approve there and this
            window will finish on its own.
          </p>
        </div>
        <p className="text-xs text-text-muted">
          No browser? It may have opened behind the game, or on a profile you are not signed in on.
        </p>
        <button
          type="button"
          onClick={() => void onCancel()}
          className="tag-cut w-fit border border-line-2 bg-surface-dark px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-label text-text-muted transition-colors hover:border-accent/60 hover:text-accent"
        >
          Start over
        </button>
      </div>
    </HudPanel>
  );
}

/**
 * The two states that are neither paired nor unpaired: the website is out of reach, or the
 * credential store is. Each says what happened, then what the app could not learn from it,
 * and offers the only thing there is to do about either — ask again.
 *
 * One component because the shape is the same and the difference is a sentence. Neither
 * offers the pairing form: an app that already holds a token, or that cannot tell whether
 * it does, must not be told to pair again.
 */
function Retryable({
  what,
  reason,
  onRetry,
}: {
  what: string;
  reason: string;
  onRetry: () => Promise<void>;
}): React.ReactElement {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-text-body">{what}</p>
      <p className="text-xs text-text-muted">{reason}</p>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="tag-cut w-fit border border-line-2 bg-surface-dark px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-label text-text-muted transition-colors hover:border-accent/60 hover:text-accent"
      >
        Try again
      </button>
    </div>
  );
}
