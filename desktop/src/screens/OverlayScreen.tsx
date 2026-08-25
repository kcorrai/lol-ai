import { useRef } from "react";
import { ThisGamePanel } from "@/components/game/ThisGamePanel";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { BuildPanel } from "@/components/game/BuildPanel";
import { useLiveContext } from "@/lib/useLiveContext";
import { useLiveGame } from "@/lib/useLiveGame";
import { useOverlayFit } from "@/lib/useOverlayFit";

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
  // The window takes its height from this element. Three full panels came to 1010 px in a
  // 620 px window, and the third of the build panel that fell outside it could not be
  // scrolled to either — the overlay never takes focus.
  const content = useRef<HTMLDivElement>(null);
  useOverlayFit(content);

  return (
    // Transparent to the game underneath rather than painted: the window itself carries no
    // ground, so only the panels are opaque and the rest of the rectangle is the match.
    // `select-none` because a stray drag across an overlay should not highlight text.
    <div ref={content} className="grid select-none gap-3 p-3">
      {read.status === "ok" ? (
        <>
          <ThisGamePanel read={read} state={context} />
          <MatchupPanel state={context} />
          <BuildPanel state={context} />
        </>
      ) : (
        <NoGame />
      )}
    </div>
  );
}

/**
 * What sits over nothing.
 *
 * The main window stopped drawing these panels with no game for one reason — four boxes
 * repeating one sentence read as an app broken in four places — and this window has the
 * same three and had not been given the same treatment. It showed them saying "this window
 * cannot find you among the players in this game" with no game to be found in.
 *
 * One line, and the window shrinks to it. An overlay is a thing a player toggles on over a
 * match; toggled on over nothing it should take as little of the screen as it has to say.
 */
function NoGame(): React.ReactElement {
  return (
    <div className="notch border border-line-1 bg-surface px-4 py-3 text-center">
      <p className="font-mono text-[10px] uppercase tracking-label text-text-faint">
        LoL AI Coach · waiting for a game
      </p>
    </div>
  );
}
