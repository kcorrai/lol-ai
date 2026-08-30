import { ArrowRight, CloudOff, Crosshair, MonitorSmartphone, UserRoundSearch } from "lucide-react";
import { AbilityPanel } from "@/components/champions/AbilityPanel";
import { BuildPanel } from "@/components/game/BuildPanel";
import { GamePlanPanel } from "@/components/game/GamePlanPanel";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { LaneTabs } from "@/components/champions/LaneTabs";
import { Button } from "@/components/hud/Button";
import { EmptyState } from "@/components/hud/EmptyState";
import { HudPanel } from "@/components/layout/HudPanel";
import { ChampionPicker } from "@/components/pregame/ChampionPicker";
import { ClashHeader } from "@/components/pregame/ClashHeader";
import { goTo } from "@/lib/router";
import { usePregame } from "@/lib/usePregame";
import type { LiveContextState } from "@/lib/useLiveContext";

/**
 * The matchup, before there is a game to read it from.
 *
 * Champion select is where every competitor's advice lands, and it is the one moment this
 * app cannot see — it lives behind the League Client API, which ADR-038 ships compiled out
 * and which turns on for a build Riot has approved and never for a Korean client. So this
 * screen asks the player for the two champions instead of reading them, and answers with the
 * panels the game screen would have shown a minute later.
 *
 * The trade is honest and worth saying out loud on the screen itself: they name two
 * champions, and in exchange the app never touches an interface it is not allowed to touch.
 */
export function PregameScreen(): React.ReactElement {
  const pregame = usePregame();
  const read = pregame.context;
  const answered = read.status !== "idle";

  return (
    <div className="mx-auto grid max-w-[1400px] gap-4">
      {/* The moment a champion is named, before anything has been read. Two search boxes
          are a form; two champions facing each other are a matchup. */}
      {pregame.mine ? (
        <ClashHeader
          mine={pregame.mine}
          theirs={pregame.theirs}
          lane={pregame.lane}
          context={read.status === "ready" ? read.context : null}
        />
      ) : null}

      <HudPanel bare>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-1 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text">
              Pick the lane
            </h2>
            <p className="mt-1.5 max-w-[74ch] text-[13px] text-text-muted">
              Pick what you are playing and who into, and this reads the same lane, build and plan
              the game screen would.{" "}
              {/* The reason a player is typing rather than being read, said where they are
                  doing the typing. Riot does not support the client API for third-party apps
                  and gates it behind per-release approval, so this app does not use it. */}
              It asks you rather than reading your champion select: that interface is not one Riot
              supports for apps like this, so this one leaves it alone.
            </p>
          </div>
          <ReadButton
            disabled={!pregame.canRead}
            busy={read.status === "loading"}
            stale={answered && !pregame.isCurrent}
            onRead={pregame.read}
          />
        </div>

        <LaneTabs
          active={pregame.lane}
          onSelect={pregame.setLane}
          className="border-b border-line-1"
        />

        <div className="grid md:grid-cols-2">
          <div className="border-b border-line-1 md:border-b-0 md:border-r">
            <ChampionPicker
              label="You"
              side="mine"
              hint="What you are playing."
              roster={pregame.roster}
              chosen={pregame.mine}
              onChoose={pregame.setMine}
            />
          </div>
          <ChampionPicker
            label="Against"
            side="theirs"
            hint="Optional — leave it empty and you still get your build and your own record."
            roster={pregame.roster}
            chosen={pregame.theirs}
            onChoose={pregame.setTheirs}
            clearable
          />
        </div>
      </HudPanel>

      {/* One empty state for the screen rather than one per panel, the way the game screen
          does it: three boxes each saying "nothing has been asked yet" reads as an app broken
          in three places rather than one waiting to be told what to look at. */}
      {read.status === "ready" ? (
        <>
          {read.context.opponent ? (
            <AbilityPanel
              abilities={read.context.opponentAbilities}
              champion={read.context.opponent.name}
              title="What to play around"
              meta="Their kit · Riot's own clips and cooldowns"
            />
          ) : null}
          <MatchupPanel state={read} />
          <BuildPanel state={read} />
          <GamePlanPanel state={read} />
        </>
      ) : (
        <HudPanel title="This lane" bare>
          <PregameEmpty state={read} champion={pregame.mine} />
        </HudPanel>
      )}
    </div>
  );
}

/**
 * The screen with no reading on it, which is most of the time it is open.
 *
 * Five reasons, each with its own icon, its own sentence and — for the two a player can act
 * on — its own way out. The champion they have already named grounds the panel, so even the
 * failures are about their matchup rather than about nothing.
 */
function PregameEmpty({
  state,
  champion,
}: {
  state: Exclude<LiveContextState, { status: "ready" }>;
  champion: string | null;
}): React.ReactElement {
  const splash = champion ?? undefined;

  switch (state.status) {
    case "loading":
      return (
        <EmptyState
          busy
          icon={Crosshair}
          splash={splash}
          title="Reading your account"
          body="Pulling your record in this lane and the build that is winning on this patch."
        />
      );
    case "unpaired":
      return (
        <EmptyState
          icon={MonitorSmartphone}
          splash={splash}
          title="This machine is not paired"
          body="Pair this machine on the Pairing screen and your own record in this lane appears here."
          action={
            <Button size="sm" icon={MonitorSmartphone} onClick={() => goTo("/pairing")}>
              Open pairing
            </Button>
          }
        />
      );
    case "unavailable":
      return (
        <EmptyState
          icon={MonitorSmartphone}
          splash={splash}
          title="This is the browser preview"
          body="It has no credential store, so it cannot read your account. Run the desktop app."
        />
      );
    case "error":
      return (
        <EmptyState
          icon={CloudOff}
          tone="danger"
          splash={splash}
          title="Cannot reach LoL AI Coach"
          body={`${state.message} Your picks are kept — press Read again when it is back.`}
        />
      );
    case "idle":
      return champion ? (
        <EmptyState
          icon={UserRoundSearch}
          splash={champion}
          title="Ready when you are"
          body="Press Read and this fills in with the matchup on this patch, your own record in it, the build that is winning, and the habits worth watching."
        />
      ) : (
        <EmptyState
          icon={Crosshair}
          title="Nothing read yet"
          body="Name a champion above and press Read. The answer covers how the lane goes on this patch, how it has gone for you, what to build and what you keep doing wrong in it."
        />
      );
  }
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
    <Button
      size="sm"
      variant={stale ? "primary" : "ghost"}
      iconRight={ArrowRight}
      disabled={disabled || busy}
      onClick={onRead}
    >
      {busy ? "Reading…" : stale ? "Read again" : "Read this matchup"}
    </Button>
  );
}
