import { HudPanel } from "@/components/layout/HudPanel";
import { OverlaySettingsPanel } from "@/components/settings/OverlaySettingsPanel";
import { SettingRow, Switch } from "@/components/settings/Switch";
import { useAutostart } from "@/lib/useAutostart";

export function SettingsScreen(): React.ReactElement {
  return (
    <div className="grid gap-4">
      <HudPanel title="Preferences">
        <Autostart />
        <p className="mt-4 border-t border-line-1 pt-3 text-xs text-text-muted">
          Closing the window leaves this running in the tray, so it is still watching when a game
          starts. Quit from the tray icon to stop it.
        </p>
      </HudPanel>

      <OverlaySettingsPanel />

      <HudPanel title="What this app reads">
        <ul className="grid gap-2 text-sm text-text-body">
          <li>
            <span className="text-text">The Live Client Data API</span> on your own machine, which
            Riot documents and permits for local applications. This is the only game data it reads.
          </li>
          <li>
            It sends no input to the game, reads no game memory, and modifies no game file. It
            automates nothing — it never accepts a queue, picks a champion or bans one for you.
          </li>
          <li>
            It does not track enemy ability or summoner spell cooldowns, both of which Riot
            prohibits.
          </li>
          <li>
            {/* The line every live panel is built on, said to the player in the same words the
                policy uses. Riot's own example of the banned form is "go gank top lane". */}
            It tells you what you are doing, never what to do next. Riot prohibits apps that dictate
            your play from the state of a running game, and so does this one.
          </li>
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
    <SettingRow
      label="Launch when this machine starts"
      description={
        state.status === "unavailable"
          ? "This preview has no start-up list. Run the desktop app."
          : "Off unless you turn it on. It opens straight to the tray, not to a window."
      }
      error={state.status === "error" ? state.message : null}
      control={
        <Switch
          label="Launch when this machine starts"
          checked={enabled}
          disabled={busy}
          onChange={() => void toggle()}
        />
      }
    />
  );
}
