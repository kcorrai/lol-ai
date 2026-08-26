import { BuildPanel } from "@/components/game/BuildPanel";
import { GamePlanPanel } from "@/components/game/GamePlanPanel";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { LaneTabs } from "@/components/champions/LaneTabs";
import { HudPanel } from "@/components/layout/HudPanel";
import { ChampionPicker } from "@/components/pregame/ChampionPicker";
import { cn } from "@/lib/cn";
import { usePregame } from "@/lib/usePregame";

/**
 * The matchup, before there is a game to read it from.
 *
 * Champion select is where every competitor's advice lands, and it is the one moment this
 * app cannot see — it lives behind the League Client API, which ADR-038 ships compiled out
 * and which turns on for a build Riot has approved and never for a Korean client. So this
 * screen asks the player for the two champions instead of reading them, and answers with the
 * panels the game screen would have shown a minute later.
 *
 * The trade is honest and worth saying out loud on the screen itself: they type two names,
 * and in exchange the app never touches an interface it is not allowed to touch.
 */
export function PregameScreen(): React.ReactElement {
  const pregame = usePregame();
  const answered = pregame.context.status !== "idle";

  return (
    <div className="grid gap-4">
      <HudPanel
        title="Before the game"
        action={
          <ReadButton
            disabled={!pregame.canRead}
            busy={pregame.context.status === "loading"}
            stale={answered && !pregame.isCurrent}
            onRead={pregame.read}
          />
        }
      >
        <div className="grid gap-4">
          <div>
            <p className="text-sm text-text-body">
              Pick what you are playing and who into, and this reads the same lane, build and
              plan the game screen would.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {/* The reason a player is typing rather than being read, said where they are
                  doing the typing. Riot does not support the client API for third-party apps
                  and gates it behind per-release approval, so this app does not use it. */}
              It asks you rather than reading your champion select: that interface is not one
              Riot supports for apps like this, so this one leaves it alone.
            </p>
          </div>

          <LaneTabs active={pregame.lane} onSelect={pregame.setLane} />

          <div className="grid gap-4 md:grid-cols-2">
            <ChampionPicker
              label="You"
              hint="What you are playing."
              roster={pregame.roster}
              chosen={pregame.mine}
              onChoose={pregame.setMine}
            />
            <ChampionPicker
              label="Against"
              hint="Optional — leave it empty and you still get your build and your own record."
              roster={pregame.roster}
              chosen={pregame.theirs}
              onChoose={pregame.setTheirs}
              clearable
            />
          </div>
        </div>
      </HudPanel>

      {/* One empty state for the screen rather than one per panel, the way the game screen
          does it: three boxes each saying "nothing has been asked yet" reads as an app broken
          in three places rather than one waiting to be told what to look at. */}
      {answered ? (
        <>
          <MatchupPanel state={pregame.context} />
          <BuildPanel state={pregame.context} />
          <GamePlanPanel state={pregame.context} />
        </>
      ) : (
        <HudPanel title="This lane">
          <div className="px-4 py-10 text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text-muted">
              Nothing read yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-text-body">
              Name a champion above and press Read. The answer covers how the lane goes on this
              patch, how it has gone for you, what to build and what you keep doing wrong in it.
            </p>
          </div>
        </HudPanel>
      )}
    </div>
  );
}

/**
 * The one thing on this screen that spends a request.
 *
 * A button rather than a fetch on every change, and that is the whole design of the screen.
 * `/api/desktop/live-context` is rate limited per device because it was written for a game,
 * which asks once and then not again for forty minutes; two pickers that fetched as they
 * moved would spend a match's worth of that allowance in half a minute of clicking.
 *
 * It says "read again" once the pickers have moved past what is on screen, so a player
 * looking at a stale answer can tell that is what they are looking at.
 */
function ReadButton({
  disabled,
  busy,
  stale,
  onRead,
}: {
  disabled: boolean;
  busy: boolean;
  stale: boolean;
  onRead: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onRead}
      className={cn(
        "notch flex items-center gap-2 border px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.08em] transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        disabled || busy
          ? "cursor-not-allowed border-line-1 bg-transparent text-text-faint"
          : "cursor-pointer border-accent bg-transparent text-accent hover:bg-surface-2"
      )}
    >
      {busy ? "Reading…" : stale ? "Read again" : "Read this matchup"}
    </button>
  );
}
