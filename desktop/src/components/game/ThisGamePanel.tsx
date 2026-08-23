import { HudPanel } from "@/components/layout/HudPanel";
import { NoRiotAccount, noteFor, PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import type { LiveRead } from "@/lib/liveClient/client";
import type { AllGameData } from "@/lib/liveClient/schema";
import { activePlayerOf } from "@/lib/liveMatchup";
import { readPerformance, type MetricReading, type Standing } from "@/lib/livePerformance";
import type { LiveContextState } from "@/lib/useLiveContext";

/**
 * This game, against the player's own record of themselves.
 *
 * The scoreboard already tells them what they have. What it cannot tell them is whether
 * it is good *for them* — 6.2 CS a minute is a fine game for one player and a bad one for
 * the next, and the only honest comparison is against their own last twenty games on the
 * same champion.
 *
 * Nothing here instructs. Riot prohibits notifications that dictate player action from
 * the current game state, and this panel is on the right side of that line by
 * construction: it reports the player's own numbers and what those numbers usually are,
 * and stops.
 */
export function ThisGamePanel({
  read,
  state,
}: {
  read: LiveRead<AllGameData>;
  state: LiveContextState;
}): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;
  const me = read.status === "ok" ? activePlayerOf(read.data) : null;

  return (
    <HudPanel
      title="This game"
      action={context?.baseline ? <Sample games={context.baseline.games} /> : null}
    >
      {note ??
        (read.status !== "ok" || !me ? (
          <NotPlaying />
        ) : (
          <Readings
            readings={readPerformance(read.data, me, context?.baseline ?? null, context?.challenges ?? [])}
            linked={context?.riotAccountLinked ?? false}
            hasBaseline={Boolean(context?.baseline)}
          />
        ))}
    </HudPanel>
  );
}

/** The sample the averages came from, in the header — a number nobody can size is a number nobody can argue with. */
function Sample({ games }: { games: number }): React.ReactElement {
  return (
    <p className="truncate font-mono text-xs text-text-muted">
      vs your last {games} ranked {games === 1 ? "game" : "games"}
    </p>
  );
}

/**
 * The context is ready but this machine cannot see a game, or cannot find the player
 * among the ten. Either way there is nothing to measure, which is not a fault.
 */
function NotPlaying(): React.ReactElement {
  return <PanelNote>Nothing to measure until you are in a game.</PanelNote>;
}

function Readings({
  readings,
  linked,
  hasBaseline,
}: {
  readings: MetricReading[];
  linked: boolean;
  hasBaseline: boolean;
}): React.ReactElement {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-px bg-line-1">
        {readings.map((reading) => (
          <Metric key={reading.metric} reading={reading} />
        ))}
      </div>
      {!linked ? (
        <div className="border-t border-line-1 pt-4">
          <NoRiotAccount />
        </div>
      ) : !hasBaseline ? (
        <div className="border-t border-line-1 pt-4">
          {/* Deliberately not a zero or a dash pretending to be an average: too few games
              is a different thing from a bad average, and the player can fix one of them. */}
          <PanelNote>
            Too few ranked games on this champion to know what is normal for you yet.
          </PanelNote>
        </div>
      ) : null}
    </div>
  );
}

const TONE: Record<Standing, string> = {
  above: "text-success",
  below: "text-danger",
  even: "text-text-body",
  unknown: "text-text",
};

function Metric({ reading }: { reading: MetricReading }): React.ReactElement {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="hud-label">{reading.label}</p>
      <p className={cn("mt-1 font-mono text-lg font-bold", TONE[reading.vsBaseline])}>
        {reading.value.toFixed(reading.places)}
      </p>
      <Against reading={reading} />
    </div>
  );
}

/**
 * The two comparisons, in the order they matter: the goal the player chose beats the
 * average they happen to have. Only one line, because a cell with three numbers in it is
 * a cell nobody reads mid-game.
 */
function Against({ reading }: { reading: MetricReading }): React.ReactElement | null {
  if (reading.target !== null) {
    return (
      <p className="mt-0.5 truncate text-xs text-text-muted">
        <span className={TONE[reading.vsTarget]}>
          {reading.vsTarget === "below" ? "✕" : "✓"}
        </span>{" "}
        goal {reading.target.toFixed(reading.places)}
      </p>
    );
  }

  if (reading.baseline !== null) {
    return (
      <p className="mt-0.5 truncate text-xs text-text-muted">
        usually {reading.baseline.toFixed(reading.places)}
      </p>
    );
  }

  return <p className="mt-0.5 truncate text-xs text-text-faint">no average yet</p>;
}
