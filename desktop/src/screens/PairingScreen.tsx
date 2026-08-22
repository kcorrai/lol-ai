import { HudPanel } from "@/components/layout/HudPanel";
import { NotImplemented } from "@/components/NotImplemented";

export function PairingScreen(): React.ReactElement {
  return (
    <div className="grid gap-4">
      <HudPanel title="Pair this device">
        <NotImplemented
          what="You will sign in on the website, generate a one-time code, and type it here once. This device then holds its own token — never your password."
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
