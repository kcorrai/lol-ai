"use client";

import { clueLadder, nextClueNote } from "@/domains/quiz/services/clueLadder";
import type { QuizMode } from "@/domains/quiz";

interface ClueLadderProps {
  mode: QuizMode;
  misses: number;
  /** The clue text the server has already handed over, oldest first. */
  hints: string[];
}

const LEGEND = [
  { tone: "border-accent/40 bg-accent/20", text: "Exact match" },
  { tone: "border-warning/40 bg-warning/20", text: "Shares a value" },
  { tone: "border-line-2 bg-surface-dark", text: "No overlap" },
] as const;

/** Classic has no ladder — every column is compared from the first guess — so
 *  the rail carries the thing a player actually has to keep straight instead. */
function ClassicLegend(): React.JSX.Element {
  return (
    <div className="grid gap-2.5">
      {LEGEND.map((item) => (
        <div key={item.text} className="flex items-center gap-2.5">
          <span aria-hidden className={`h-2.5 w-2.5 shrink-0 border ${item.tone}`} />
          <span className="font-mono text-[11px] tracking-wide text-fg-2">{item.text}</span>
        </div>
      ))}
      <p className="mt-1 font-mono text-[11px] leading-relaxed text-fg-3">
        ▲ released later · ▼ released earlier
      </p>
    </div>
  );
}

export function ClueLadder({ mode, misses, hints }: ClueLadderProps): React.JSX.Element {
  const steps = clueLadder(mode, misses);
  const lastOn = steps.reduce((acc, step, i) => (step.unlocked ? i : acc), -1);

  return (
    <aside className="border-line-1 bg-surface-dark px-5 py-5 lg:border-l">
      <p className="font-mono text-[9.5px] uppercase tracking-micro text-text-muted">
        {mode === "classic" ? "// How to read it" : "// Clues unlocked"}
      </p>

      <div className="mt-3.5">
        {mode === "classic" ? (
          <ClassicLegend />
        ) : (
          <div className="grid gap-2.5">
            {steps.map((step, index) => (
              <div key={step.text} className="grid grid-cols-[16px_1fr] items-start gap-2.5">
                <span
                  aria-hidden
                  className={`mt-1.5 h-1.5 w-1.5 ${
                    step.unlocked ? "bg-acid-500" : "bg-ink-400"
                  } ${index === lastOn ? "glow-accent-soft animate-glow-pulse" : ""}`}
                />
                <span
                  className={`font-mono text-[12.5px] leading-snug tracking-wide ${
                    step.unlocked ? "text-fg-2" : "text-fg-4 opacity-60"
                  }`}
                >
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hints.length > 0 && (
        <div className="mt-4 border-t border-line-1 pt-3.5">
          <p className="font-mono text-[9.5px] uppercase tracking-micro text-text-muted">
            {"// Handed to you"}
          </p>
          <ul className="mt-2 grid gap-1.5">
            {hints.map((hint) => (
              <li key={hint} className="tag-cut border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] text-accent">
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode !== "classic" && (
        <p className="mt-4 border-t border-line-1 pt-3.5 font-mono text-[10px] uppercase tracking-label text-fg-4">
          {nextClueNote(mode, misses)}
        </p>
      )}
    </aside>
  );
}
