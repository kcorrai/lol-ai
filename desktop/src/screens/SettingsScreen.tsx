import { HudPanel } from "@/components/layout/HudPanel";
import { cn } from "@/lib/cn";
import { useAutostart } from "@/lib/useAutostart";

/**
 * The compliance note is not boilerplate. Riot requires the disclaimer on every product,
 * and the second paragraph is the honest answer to the question a companion app should
 * expect: what is it reading, and is that allowed.
 */
export function SettingsScreen(): React.ReactElement {
  return (
    <div className="grid gap-4">
      <HudPanel title="Preferences">
        <Autostart />
        <p className="mt-4 border-t border-line-1 pt-3 text-xs text-text-muted">
          Closing the window leaves this running in the tray, so it is still watching when a
          game starts. Quit from the tray icon to stop it.
        </p>
      </HudPanel>

      <HudPanel title="Overlay">
        <p className="text-sm text-text-body">
          Press{" "}
          <kbd className="notch-sm border border-line-2 bg-surface-dark px-1.5 py-0.5 font-mono text-xs text-text">
            Ctrl+Alt+L
          </kbd>{" "}
          to show this game&apos;s reading over the top of the game, and again to hide it. The
          tray menu does the same thing.
        </p>
        <ul className="mt-3 grid gap-2 text-xs text-text-muted">
          <li>
            {/* Not detected — claimed detection this app cannot actually perform would be
                worse than a plain instruction the player can follow. */}
            Set League to <span className="text-text">Borderless</span> in its video settings.
            Windows does not draw anything over a game in exclusive full screen, and no
            application can change that.
          </li>
          <li>It never takes focus, so your keyboard and mouse stay with the game.</li>
          <li>It shows the same reading as the main window, and nothing the game has hidden.</li>
        </ul>
      </HudPanel>

      <HudPanel title="What this app reads">
        <ul className="grid gap-2 text-sm text-text-body">
          <li>
            <span className="text-text">The Live Client Data API</span> on your own machine, which
            Riot documents and permits for local applications. This is the only game data it reads.
          </li>
          <li>It sends no input to the game, reads no game memory, and modifies no game file.</li>
          <li>It does not track enemy ability cooldowns, which Riot prohibits.</li>
        </ul>
        <p className="mt-4 border-t border-line-1 pt-3 text-xs text-text-muted">
          LoL AI Coach isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
          opinions of Riot Games or anyone officially involved in producing or managing Riot Games
          properties.
        </p>
      </HudPanel>
    </div>
  );
}

/**
 * Launch on start-up, off until asked for.
 *
 * The switch shows what the operating system actually reports, not what was last clicked:
 * a write can be refused, and a control that claims a setting it did not get is worse than
 * one that says it failed.
 */
function Autostart(): React.ReactElement {
  const { state, toggle } = useAutostart();

  const enabled = state.status === "ready" || state.status === "error" ? state.enabled : false;
  const busy = state.status === "loading" || state.status === "unavailable";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text">Launch when this machine starts</p>
          <p className="mt-1 text-xs text-text-muted">
            {state.status === "unavailable"
              ? "This preview has no start-up list. Run the desktop app."
              : "Off unless you turn it on. It opens straight to the tray, not to a window."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Launch when this machine starts"
          disabled={busy}
          onClick={() => void toggle()}
          className={cn(
            "notch-sm mt-0.5 h-6 w-11 shrink-0 border transition-colors",
            busy ? "cursor-not-allowed border-line-1 bg-surface opacity-50" : "border-line-2",
            enabled ? "bg-accent" : "bg-surface"
          )}
        >
          <span
            className={cn(
              "block h-4 w-4 bg-text transition-transform",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>
      {state.status === "error" ? (
        <p className="mt-2 text-xs text-danger">{state.message}</p>
      ) : null}
    </div>
  );
}
