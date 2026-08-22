import { HudPanel } from "@/components/layout/HudPanel";
import { NotImplemented } from "@/components/NotImplemented";
import { useDeviceStatus } from "@/lib/useDeviceStatus";

export function PairingScreen(): React.ReactElement {
  const { status, forget } = useDeviceStatus();

  return (
    <div className="grid gap-4">
      <HudPanel title="This device">
        <DeviceState status={status} onForget={forget} />
      </HudPanel>

      <HudPanel title="Pair this device">
        <NotImplemented
          what="Entering a code and exchanging it for a token needs the endpoints on the website, which land next."
          phase="Phase 3"
        />
      </HudPanel>

      <HudPanel title="How it will work">
        <ol className="grid gap-2 text-sm text-text-body">
          {[
            "Sign in on the website and open Settings.",
            "Generate a pairing code. It is good once, and briefly.",
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

/**
 * Three states, not two. `null` means the credential store could not be asked at all —
 * the browser preview has none — and saying "not paired" there would be a guess dressed
 * as a fact.
 */
function DeviceState({
  status,
  onForget,
}: {
  status: { paired: boolean } | null;
  onForget: () => Promise<void>;
}): React.ReactElement {
  if (status === null) {
    return (
      <p className="text-sm text-text-body">
        This preview has no credential store to ask. Run the desktop app to see whether this
        machine is paired.
      </p>
    );
  }

  if (!status.paired) {
    return (
      <p className="text-sm text-text-body">
        Not paired. Nothing is stored in your keychain for this app.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-body">
        Paired. A token for this device is held in your operating system&apos;s keychain.
      </p>
      <button
        type="button"
        onClick={() => void onForget()}
        className="tag-cut border border-line-2 bg-surface-dark px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-label text-text-muted transition-colors hover:border-danger/60 hover:text-danger"
      >
        Forget this device
      </button>
    </div>
  );
}
