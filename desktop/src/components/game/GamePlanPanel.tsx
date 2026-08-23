import { HudPanel } from "@/components/layout/HudPanel";
import { NoRiotAccount, noteFor, PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import type { LiveContext } from "@/lib/liveContext";
import type { LiveContextState } from "@/lib/useLiveContext";

type Habit = LiveContext["habits"][number];

const SEVERITY_TONE: Record<string, string> = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-text-muted",
};

/**
 * What to do about the lane: how this matchup is played, and what this player keeps doing
 * wrong regardless of it.
 *
 * Both halves are readings the website already produced — the matchup hints from the patch
 * snapshot, the habits from this account's own matches. Nothing here is generated at game
 * start. A round trip to a model on every match would cost the player a delay in the one
 * minute they cannot spare, and the deterministic readings are the ones that can be
 * checked against the data that produced them.
 */
export function GamePlanPanel({ state }: { state: LiveContextState }): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;

  return (
    <HudPanel title="Game plan">{note ?? (context ? <Plan context={context} /> : null)}</HudPanel>
  );
}

function Plan({ context }: { context: LiveContext }): React.ReactElement {
  const hints = context.meta?.hints ?? [];

  if (!context.riotAccountLinked && hints.length === 0) {
    return <NoRiotAccount />;
  }

  return (
    <div className="grid gap-4">
      <section>
        <p className="hud-label mb-2">Playing the matchup</p>
        {hints.length > 0 ? (
          <ul className="grid gap-2">
            {hints.map((hint) => (
              <li key={hint} className="flex gap-2 text-sm text-text-body">
                <span aria-hidden className="text-accent">
                  ▸
                </span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        ) : (
          <PanelNote>Nothing specific to this pair on this patch.</PanelNote>
        )}
      </section>

      <section className="border-t border-line-1 pt-4">
        <p className="hud-label mb-2">Watch for</p>
        {!context.riotAccountLinked ? (
          <NoRiotAccount />
        ) : context.habits.length > 0 ? (
          <ul className="grid gap-3">
            {context.habits.map((habit) => (
              <HabitRow key={habit.habitType} habit={habit} />
            ))}
          </ul>
        ) : (
          // Genuinely good news, and worth saying so — an empty list here would read as a
          // panel that failed to load.
          <PanelNote>No recurring weakness detected in your recent games.</PanelNote>
        )}
      </section>
    </div>
  );
}

function HabitRow({ habit }: { habit: Habit }): React.ReactElement {
  return (
    <li>
      <p
        className={cn(
          "font-display text-xs font-bold uppercase tracking-[0.08em]",
          SEVERITY_TONE[habit.severity] ?? "text-text-muted"
        )}
      >
        {habit.displayName}
      </p>
      <p className="mt-1 text-sm text-text-body">{habit.message}</p>
    </li>
  );
}
