import { HudPanel, PanelMeta } from "@/components/layout/HudPanel";
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
 * The scoreboard already tells them what they have. What it cannot tell them is whether it is
 * good *for them* — 6.2 CS a minute is a fine game for one player and a bad one for the next,
 * and the only honest comparison is against their own last twenty games on the same champion.
 *
 * Nothing here instructs. Riot prohibits notifications that dictate player action from the
 * current game state, and this panel is on the right side of that line by construction: it
 * reports the player's own numbers and what those numbers usually are, and stops.
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

  // Unlike the other panels, this one has something to say with the website switched off:
  // the four live numbers are read off the player's own scoreboard and need nothing but the
  // game. So the website being unreachable costs the *comparison* and not the panel — an
  // earlier draft copied the other panels and let the note win, which blanked a player's
  // live CS/min the moment their connection dropped.
  if (!me || read.status !== "ok") {
    return <HudPanel title="This game">{note ?? <NotPlaying />}</HudPanel>;
  }

  const readings = readPerformance(
    read.data,
    me,
    context?.baseline ?? null,
    context?.challenges ?? []
  );

  return (
    <HudPanel
      title="This game"
      action={
        context?.baseline ? (
          <PanelMeta>
            vs your last {context.baseline.games} ranked{" "}
            {context.baseline.games === 1 ? "game" : "games"}
          </PanelMeta>
        ) : null
      }
      bare
    >
      <div className="grid grid-cols-2 gap-px bg-line-1 md:grid-cols-4">
        {readings.map((reading, index) => (
          <Metric key={reading.metric} reading={reading} index={index} />
        ))}
      </div>

      {/* Only the ready context knows why there is no baseline. Without one, the note
          underneath already says what went wrong, and a second line blaming an unlinked Riot
          account would be a guess — the account may well be linked and simply unreachable. */}
      {!context ? null : !context.riotAccountLinked ? (
        <div className="border-t border-line-1">
          <NoRiotAccount />
        </div>
      ) : !context.baseline ? (
        <div className="border-t border-line-1">
          {/* Deliberately not a zero or a dash pretending to be an average: too few games is
              a different thing from a bad average, and the player can fix one of them. */}
          <PanelNote>
            Too few ranked games on this champion to know what is normal for you yet.
          </PanelNote>
        </div>
      ) : null}

      {note ? <div className="border-t border-line-1">{note}</div> : null}
    </HudPanel>
  );
}

/**
 * The context is ready but this machine cannot see a game, or cannot find the player among
 * the ten. Either way there is nothing to measure, which is not a fault.
 */
function NotPlaying(): React.ReactElement {
  return <PanelNote>Nothing to measure until you are in a game.</PanelNote>;
}

const TONE: Record<Standing, string> = {
  above: "text-accent",
  below: "text-danger",
  even: "text-text-body",
  unknown: "text-text",
};

function Metric({ reading, index }: { reading: MetricReading; index: number }): React.ReactElement {
  const target = reading.target;
  const hit = reading.vsTarget !== "below";

  return (
    <div className="min-w-0 bg-surface px-5 py-4">
      <p className="hud-label truncate text-[10px] tracking-[0.18em]">{reading.label}</p>
      <p
        className={cn(
          "mt-2.5 font-mono text-[30px] font-bold tabular-nums leading-none",
          TONE[reading.vsBaseline]
        )}
      >
        {reading.value.toFixed(reading.places)}
      </p>

      {/*
        The two comparisons, in the order they matter: the goal the player chose beats the
        average they happen to have. Only one, because a cell with three numbers in it is a
        cell nobody reads mid-game.
      */}
      {target !== null ? (
        <>
          <span aria-hidden className="mt-3 block h-1 bg-surface-dark">
            <span
              className={cn("hud-bar block h-full", hit ? "bg-accent" : "bg-warning")}
              style={{
                width: `${towards(reading.value, target, reading.metric === "deaths")}%`,
                animationDelay: `${index * 60}ms`,
              }}
            />
          </span>
          <p className="mt-2 flex items-center gap-2 truncate font-mono text-xs">
            <span className={hit ? "text-accent" : "text-danger"}>{hit ? "✓" : "✕"}</span>
            <span className="text-text-muted">goal {target.toFixed(reading.places)}</span>
          </p>
        </>
      ) : reading.baseline !== null ? (
        <p className="mt-3 truncate font-mono text-xs text-text-muted">
          usually {reading.baseline.toFixed(reading.places)}
        </p>
      ) : (
        <p className="mt-3 truncate font-mono text-xs text-text-faint">no average yet</p>
      )}
    </div>
  );
}

/**
 * How full the bar towards a goal is drawn, 0–100.
 *
 * Deaths run the other way — the goal is a ceiling rather than a floor — so the bar fills as
 * the number stays *under* it and is full while the player is still clean. Anything past the
 * goal clamps rather than overflowing, because a bar longer than its track says nothing a
 * number beside it does not already say.
 */
function towards(value: number, target: number, lowerIsBetter: boolean): number {
  if (target <= 0) return lowerIsBetter && value === 0 ? 100 : 0;
  const ratio = lowerIsBetter ? 1 - value / target : value / target;
  return Math.max(0, Math.min(100, ratio * 100));
}
