import { HudPanel } from "@/components/layout/HudPanel";
import { NotImplemented } from "@/components/NotImplemented";

/**
 * The compliance note is not boilerplate. Riot requires the disclaimer on every product,
 * and the second paragraph is the honest answer to the question a companion app should
 * expect: what is it reading, and is that allowed.
 */
export function SettingsScreen(): React.ReactElement {
  return (
    <div className="grid gap-4">
      <HudPanel title="Preferences">
        <NotImplemented
          what="Launch on start-up, window behaviour while a game is running, and which linked account this device reports on."
          phase="Phase 5"
        />
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
