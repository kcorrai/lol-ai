import { HudPanel } from "@/components/layout/HudPanel";
import { NoRiotAccount, noteFor, PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import type { LiveContext } from "@/lib/liveContext";
import type { LiveContextState } from "@/lib/useLiveContext";

type Habit = LiveContext["habits"][number];

const SEVERITY: Record<string, { text: string; rule: string }> = {
  high: { text: "text-danger", rule: "border-danger" },
  medium: { text: "text-warning", rule: "border-warning" },
  low: { text: "text-text-muted", rule: "border-line-2" },
};

/**
 * What to do about the lane: how this matchup is played, and what this player keeps doing
 * wrong regardless of it.
 *
 * Both halves are readings the website already produced — the matchup hints from the patch
 * snapshot, the habits from this account's own matches. Nothing here is generated at game
 * start. A round trip to a model on every match would cost the player a delay in the one
 * minute they cannot spare, and the deterministic readings are the ones that can be checked
 * against the data that produced them.
 *
 * Side by side, with the matchup given the wider column: its lines are advice about the next
 * forty minutes, and the habits beside them are the same three every game.
 */
export function GamePlanPanel({ state }: { state: LiveContextState }): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;

  return (
    <HudPanel title="Game plan" bare={Boolean(context)}>
      {note ?? (context ? <Plan context={context} /> : null)}
    </HudPanel>
  );
}

function Plan({ context }: { context: LiveContext }): React.ReactElement {
  const hints = context.meta?.hints ?? [];

  if (!context.riotAccountLinked && hints.length === 0) {
    return <NoRiotAccount />;
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="border-b border-line-1 p-5 lg:border-b-0 lg:border-r">
        <p className="hud-label text-[10px] tracking-[0.18em]">Playing the matchup</p>
        {hints.length > 0 ? (
          <ul className="mt-3.5 grid gap-3.5">
            {hints.map((hint) => (
              <li key={hint} className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-3">
                <span aria-hidden className="font-mono text-[11px] text-accent">
                  ▸
                </span>
                <span className="text-[14.5px] leading-relaxed text-text-body">{hint}</span>
              </li>
            ))}
          </ul>
        ) : (
          <PanelNote>Nothing specific to this pair on this patch.</PanelNote>
        )}
      </section>

      <section className="p-5">
        <p className="hud-label text-[10px] tracking-[0.18em]">Watch for</p>
        {!context.riotAccountLinked ? (
          <NoRiotAccount />
        ) : context.habits.length > 0 ? (
          <ul className="mt-3.5 grid gap-4">
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

/**
 * One habit, marked by a rule down its left edge.
 *
 * The rule carries the severity, and it is a rule rather than only a colour: a habit marked
 * by hue alone is one a player who cannot tell those hues apart never sees ranked.
 */
function HabitRow({ habit }: { habit: Habit }): React.ReactElement {
  const tone = SEVERITY[habit.severity] ?? SEVERITY.low;

  return (
    <li className={cn("border-l-2 pl-3.5", tone.rule)}>
      <p
        className={cn("font-display text-[12.5px] font-bold uppercase tracking-[0.1em]", tone.text)}
      >
        {habit.displayName}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-body">{habit.message}</p>
    </li>
  );
}
