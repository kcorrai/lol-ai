import { useRef } from "react";
import { ThisGamePanel } from "@/components/game/ThisGamePanel";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { BuildPanel } from "@/components/game/BuildPanel";
import { TimelinePanel } from "@/components/game/TimelinePanel";
import type { LiveRead } from "@/lib/liveClient/client";
import type { AllGameData } from "@/lib/liveClient/schema";
import type { OverlayPanel } from "@/lib/overlaySettings";
import type { LiveContextState } from "@/lib/useLiveContext";
import { useLiveContext } from "@/lib/useLiveContext";
import { useLiveGame } from "@/lib/useLiveGame";
import { useOverlayFit } from "@/lib/useOverlayFit";
import { useOverlayDrawing } from "@/lib/useOverlaySettings";

/**
 * The window that sits over the game.
 *
 * No navigation and no chrome. The main window is where a player reads; this is where they
 * glance, and everything that would take a second look belongs in the other one. The build
 * is here because "what do I buy next" is exactly a glance question.
 *
 * It never takes focus and it is toggled rather than pinned. Both competitors' overlays draw
 * all the time with no way to hide them, which is the complaint their reviews open with — an
 * overlay a player cannot dismiss is one they turn off at the installer.
 *
 * Which panels it draws is the player's now, not this file's. Every competitor lets the
 * overlay be arranged and this one did not; what has not changed is that they are the same
 * panels the main window draws, because two renderings of one reading are two things that
 * can disagree, and the one on top of the game is the one that must not.
 */
export function OverlayScreen(): React.ReactElement {
  const read = useLiveGame();
  const context = useLiveContext(read);
  const { drawing } = useOverlayDrawing();
  // The window takes its height from this element. Three full panels came to 1010 px in a
  // 620 px window, and the third of the build panel that fell outside it could not be
  // scrolled to either — the overlay never takes focus.
  const content = useRef<HTMLDivElement>(null);
  useOverlayFit(content);

  return (
    // Transparent to the game underneath rather than painted: the window itself carries no
    // ground, so only the panels are opaque and the rest of the rectangle is the match.
    // `select-none` because a stray drag across an overlay should not highlight text.
    //
    // Opacity is set on this element and not on the window. A window-level opacity would fade
    // the transparent ground along with the panels, which does nothing visible, and on the
    // panels it does exactly what the player asked for: lets the fight show through them.
    <div
      ref={content}
      className="grid select-none gap-3 p-3"
      style={{ opacity: drawing.opacity }}
    >
      {read.status === "ok" ? (
        drawing.panels.map((panel) => (
          <Panel key={panel} panel={panel} read={read} context={context} />
        ))
      ) : (
        <NoGame />
      )}
    </div>
  );
}

/**
 * One panel by name.
 *
 * A switch rather than a lookup table so a panel added to `OVERLAY_PANELS` and not to this
 * file fails to compile, instead of quietly never appearing for the players who turned it on.
 */
function Panel({
  panel,
  read,
  context,
}: {
  panel: OverlayPanel;
  read: LiveRead<AllGameData>;
  context: LiveContextState;
}): React.ReactElement {
  switch (panel) {
    case "performance":
      return <ThisGamePanel read={read} state={context} />;
    case "matchup":
      return <MatchupPanel state={context} />;
    case "build":
      return <BuildPanel state={context} />;
    case "timeline":
      // Fewer rows than the window draws: this one is read at a glance and the window it sits
      // over is a match, not a page.
      return read.status === "ok" ? <TimelinePanel data={read.data} limit={6} /> : <></>;
  }
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
