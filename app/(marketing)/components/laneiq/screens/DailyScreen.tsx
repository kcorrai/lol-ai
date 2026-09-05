import { Illustration } from "../desktop/chrome";
import { Portrait, Window } from "./screenChrome";

/**
 * LaneIQ Daily, drawn.
 *
 * The eight modes are `src/domains/quiz/types/quiz.types.ts`'s `QUIZ_MODES`, in its order,
 * with `ModeStrip.tsx`'s display labels. The grid below them is Classic, the mode the strip
 * opens on.
 *
 * Classic's cells are drawn as colour without text on purpose. `CLASSIC_COLUMNS` has eight of
 * them — Gender, Position, Species, Resource, Range, Region, Class, Year — and eight legible
 * words do not fit across a card this wide. Colour is what the real grid is read by anyway:
 * green matched, amber shares a value, dim did not. The caption line underneath is the one the
 * app shows a first-time player, verbatim.
 */

const MODES: readonly string[] = [
  "Classic",
  "Ability",
  "Splash",
  "Lore",
  "Quote",
  "Emoji",
  "Build",
  "Impostor",
];

type Cell = "exact" | "partial" | "none";

/** Three guesses closing in — the shape of a solve, not a real day's answer. */
const GUESSES: readonly (readonly Cell[])[] = [
  ["none", "exact", "none", "partial", "none", "none", "partial", "none"],
  ["none", "exact", "partial", "partial", "exact", "none", "partial", "none"],
  ["exact", "exact", "partial", "exact", "exact", "partial", "exact", "none"],
];

const CELL: Record<Cell, string> = {
  exact: "border-accent bg-accent",
  partial: "border-warning bg-warning/25",
  none: "border-line-1 bg-surface-dark",
};

export function DailyScreen(): React.ReactElement {
  return (
    <Illustration
      label="LaneIQ Daily drawn as an illustration: the eight puzzle modes as tabs, and Classic's comparison grid where each guess turns its columns green, amber or dim."
      caption="// Illustration — drawn, not a capture"
    >
      <Window name="LaneIQ Daily" meta="New every day">
        <div className="p-3">
          <div className="flex flex-wrap gap-1">
            {MODES.map((m) => (
              <span
                key={m}
                className={`border px-1.5 py-[3px] font-mono text-[8.5px] uppercase tracking-[0.1em] ${
                  m === "Classic" ? "border-accent text-accent" : "border-line-1 text-text-faint"
                }`}
              >
                {m}
              </span>
            ))}
          </div>

          <div className="mt-3 grid gap-1.5">
            {GUESSES.map((row, i) => (
              <div
                // The two rows are positions in a sequence, not entities — the index is the
                // only identity they have.
                key={i}
                className="grid grid-cols-[auto_1fr] items-center gap-2"
              >
                <span className="flex items-center gap-1.5">
                  <Portrait size={16} />
                </span>
                <span className="grid grid-cols-8 gap-1">
                  {row.map((c, j) => (
                    <span key={j} aria-hidden className={`block h-4 border ${CELL[c]}`} />
                  ))}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 border-t border-line-1 pt-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint">
            Green matches · amber shares a value
          </p>
        </div>
      </Window>
    </Illustration>
  );
}
