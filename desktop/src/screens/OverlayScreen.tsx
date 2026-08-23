import { ThisGamePanel } from "@/components/game/ThisGamePanel";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { BuildPanel } from "@/components/game/BuildPanel";
import { useLiveContext } from "@/lib/useLiveContext";
import { useLiveGame } from "@/lib/useLiveGame";

/**
 * The window that sits over the game.
 *
 * Three panels, no navigation and no chrome. The main window is where a player reads; this
 * is where they glance, and everything that would take a second look belongs in the other
 * one. The build is here because "what do I buy next" is exactly a glance question.
 *
 * It never takes focus and it is toggled rather than pinned. Both competitors' overlays
 * draw all the time with no way to hide them, which is the complaint their reviews open
 * with — an overlay a player cannot dismiss is one they turn off at the installer.
 *
 * Same panels as the main window, deliberately: two renderings of the same reading are two
 * things that can disagree, and the one on top of the game is the one that must not.
 */
export function OverlayScreen(): React.ReactElement {
  const read = useLiveGame();
  const context = useLiveContext(read);

  return (
    // Transparent to the game underneath rather than painted: the window itself carries no
    // ground, so only the panels are opaque and the rest of the rectangle is the match.
    // `select-none` because a stray drag across an overlay should not highlight text.
    <div className="grid select-none gap-3 p-3">
      <ThisGamePanel read={read} state={context} />
      <MatchupPanel state={context} />
      <BuildPanel state={context} />
    </div>
  );
}
