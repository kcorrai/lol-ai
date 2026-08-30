import { useMemo } from "react";
import { Gamepad2, PlugZap } from "lucide-react";
import { AbilityPanel } from "@/components/champions/AbilityPanel";
import { BuildPanel } from "@/components/game/BuildPanel";
import { GamePlanPanel } from "@/components/game/GamePlanPanel";
import { LiveHeader } from "@/components/game/LiveHeader";
import { MatchupPanel } from "@/components/game/MatchupPanel";
import { ObjectivesPanel } from "@/components/game/ObjectivesPanel";
import { PostGamePanel } from "@/components/game/PostGamePanel";
import { Scoreboard } from "@/components/game/Scoreboard";
import { ThisGamePanel } from "@/components/game/ThisGamePanel";
import { TimelinePanel } from "@/components/game/TimelinePanel";
import { EmptyState } from "@/components/hud/EmptyState";
import { HudPanel } from "@/components/layout/HudPanel";
import type { LiveRead } from "@/lib/liveClient/client";
import type { AllGameData } from "@/lib/liveClient/schema";
import { activePlayerOf } from "@/lib/liveMatchup";
import { readTimeline } from "@/lib/timeline";
import { useLiveContext } from "@/lib/useLiveContext";
import { usePostGame } from "@/lib/usePostGame";

/**
 * The two halves of this app, on one screen.
 *
 * The top is what this machine can see and the website cannot — the game itself. Everything
 * under it is what the website knows and this machine cannot work out — the account playing
 * it. Neither half is worth much alone, which is the whole argument for a desktop companion
 * existing at all (ADR-038).
 */
export function GameScreen({ read }: { read: LiveRead<AllGameData> }): React.ReactElement {
  const context = useLiveContext(read);
  const postGame = usePostGame(read);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-4">
      {/* Above the rest once a game has ended: it is the only thing on this screen with
          something for the player to do. */}
      <PostGamePanel state={postGame.state} lastMatch={postGame.lastMatch} open={postGame.open} />

      {/* One empty state for the screen, not one per panel.

          Every panel below is a reading of a game, so with no game they were boxes in a
          column printing the same sentence — which reads as an app that has broken in six
          places rather than one that is waiting. They are not rendered at all now, and the
          wait is said once, with what it is waiting to fill. */}
      {read.status === "ok" ? (
        <LiveGame data={read.data} read={read} context={context} />
      ) : (
        <HudPanel title="Current game" bare>
          <NoGame read={read} />
        </HudPanel>
      )}
    </div>
  );
}

function LiveGame({
  data,
  read,
  context,
}: {
  data: AllGameData;
  read: LiveRead<AllGameData>;
  context: ReturnType<typeof useLiveContext>;
}): React.ReactElement {
  const me = useMemo(() => activePlayerOf(data), [data]);
  // Read once for both panels that need it. Two readings of the same stream that disagreed
  // would be the worse bug, because the player can see the objectives board and the timeline
  // beside each other.
  const entries = useMemo(() => readTimeline(data, me), [data, me]);
  const ready = context.status === "ready" ? context.context : null;

  return (
    <>
      <LiveHeader data={data} context={ready} />

      {/* The board: everyone in the game on the left, and what the two sides have taken off
          each other on the right. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Scoreboard data={data} />
        {me ? <ObjectivesPanel entries={entries} team={me.team} /> : null}
      </div>

      <ThisGamePanel read={read} state={context} />

      {ready?.opponent ? (
        <AbilityPanel
          abilities={ready.opponentAbilities}
          champion={ready.opponent.name}
          title="What to play around"
          meta="Their kit · Riot's own clips and cooldowns"
        />
      ) : null}

      <MatchupPanel state={context} />
      <BuildPanel state={context} />
      <GamePlanPanel state={context} />
      <TimelinePanel data={data} />
    </>
  );
}

/**
 * The screen with no game on it, which is most of the time this window is open.
 *
 * Two reasons, and they are not the same: out of a match is waiting, and a client that cannot
 * be read is something to fix. The second gets the steps, because it is the only failure on
 * these screens a player can actually work through themselves.
 */
function NoGame({
  read,
}: {
  read: Exclude<LiveRead<AllGameData>, { status: "ok" }>;
}): React.ReactElement {
  if (read.status === "no-game") {
    return (
      <EmptyState
        icon={Gamepad2}
        title="Waiting for a game"
        body="Start a match and this screen fills in on its own — the scoreboard, your numbers against your own average, the lane, the build and the plan."
      />
    );
  }

  return (
    <EmptyState
      icon={PlugZap}
      tone="warning"
      title="Cannot read the client"
      body={read.reason}
      steps={[
        "Make sure a game is actually running — the port only opens in-game.",
        "Run LoL AI Coach as administrator if the League client is elevated.",
        "Allow 127.0.0.1:2999 through your firewall.",
      ]}
    />
  );
}
