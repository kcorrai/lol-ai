import { HudPanel } from "@/components/layout/HudPanel";
import { CodeEntry } from "@/components/pairing/CodeEntry";
import { PairedDevice } from "@/components/pairing/PairedDevice";
import { usePairing } from "@/lib/usePairing";

export function PairingScreen(): React.ReactElement {
  const { state, pair, forget, retry } = usePairing();

  // The form is offered only when pairing is the thing to do. An app that already holds a
  // token and merely cannot reach the website is not asked to pair again.
  const canPair = state.status === "unpaired" || state.status === "pairing";

  return (
    <div className="grid gap-4">
      <HudPanel title="This device">
        {state.status === "loading" ? (
          <p className="text-sm text-text-muted">Asking your credential store…</p>
        ) : state.status === "unavailable" ? (
          // Three states, not two. Saying "not paired" where nothing could be asked would
          // be a guess dressed as a fact.
          <p className="text-sm text-text-body">
            This preview has no credential store to ask. Run the desktop app to see whether
            this machine is paired.
          </p>
        ) : state.status === "paired" ? (
          <PairedDevice pairing={state.pairing} onForget={forget} />
        ) : state.status === "offline" ? (
          <div className="grid gap-3">
            <p className="text-sm text-text-body">
              This machine holds a token, but LoL AI Coach could not be reached to confirm
              it. Nothing is wrong with the pairing — the website is out of reach.
            </p>
            <p className="text-xs text-text-muted">{state.error}</p>
            <button
              type="button"
              onClick={() => void retry()}
              className="tag-cut w-fit border border-line-2 bg-surface-dark px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-label text-text-muted transition-colors hover:border-accent/60 hover:text-accent"
            >
              Try again
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-body">
            Not paired. Nothing is stored in your keychain for this app.
          </p>
        )}
      </HudPanel>

      {canPair && (
        <HudPanel title="Pair this device">
          <CodeEntry
            onSubmit={pair}
            busy={state.status === "pairing"}
            disabled={false}
            error={state.status === "unpaired" ? state.error : null}
          />
        </HudPanel>
      )}

      <HudPanel title="How it works">
        <ol className="grid gap-2 text-sm text-text-body">
          {[
            "Sign in on the website and open Settings → Desktop app.",
            "Generate a pairing code. It is good once, and for ten minutes.",
            "Type it here. This device swaps it for its own token.",
            "The token goes to your operating system's keychain, not to a file.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="hud-label shrink-0 pt-0.5 text-accent">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-line-1 pt-3 text-xs text-text-muted">
          Your password is never stored on this machine, and revoking the device on the
          website is enough to cut it off.
        </p>
      </HudPanel>
    </div>
  );
}
