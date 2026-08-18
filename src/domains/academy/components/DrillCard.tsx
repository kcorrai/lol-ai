"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { gradeDrill, type DrillResult } from "@/domains/academy/drills/scoring";
import { isChoiceDrill, type Drill } from "@/domains/academy/types";
import { MapDrillBody } from "./MapDrillBody";
import { OrderDrillBody } from "./OrderDrillBody";
import { WaveSimDrillBody } from "./WaveSimDrillBody";

interface DrillCardProps {
  drill: Drill;
  onAnswered: (drillId: string, answer: string[]) => void;
}

const KIND_LABEL: Record<Drill["kind"], string> = {
  quiz: "Check",
  decision: "Decision",
  order: "Sequence",
  map: "On the map",
  "wave-sim": "Wave",
};

/**
 * One drill, answered in place. Feedback is shown immediately and the answer is locked —
 * a drill you can retry until it goes green teaches nothing.
 */
export function DrillCard({ drill, onAnswered }: DrillCardProps): React.ReactElement {
  const [result, setResult] = useState<DrillResult | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  function answer(ids: string[]): void {
    if (result) return;
    setPicked(ids[0] ?? null);
    setResult(gradeDrill(drill, ids));
    onAnswered(drill.id, ids);
  }

  return (
    <section className="notch my-7 border border-line-2 bg-surface-dark">
      <div className="flex items-center gap-3.5 border-b border-line-1 px-5 py-2.5">
        <span className="hud-label text-accent">{KIND_LABEL[drill.kind]}</span>
        {result && (
          <span
            className={`ml-auto flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-label ${
              result.correct ? "text-accent" : "text-danger"
            }`}
          >
            {result.correct ? (
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            ) : (
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            {result.correct ? "Correct" : "Not quite"}
          </span>
        )}
      </div>

      <div className="p-5">
        {drill.kind === "decision" ? (
          <>
            <p className="text-[14px] leading-relaxed text-text">{drill.situation}</p>
            <ul className="mt-3 flex flex-col gap-1 border-l-2 border-line-2 pl-3.5">
              {drill.facts.map((fact) => (
                <li key={fact} className="font-mono text-[11.5px] text-text-muted">
                  {fact}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[14px] leading-relaxed text-text">{drill.prompt}</p>
        )}

        {drill.kind === "order" ? (
          <OrderDrillBody drill={drill} locked={result !== null} onSubmit={answer} />
        ) : drill.kind === "wave-sim" ? (
          <WaveSimDrillBody drill={drill} locked={result !== null} onSubmit={answer} />
        ) : drill.kind === "map" ? (
          <MapDrillBody drill={drill} picked={picked} locked={result !== null} onPick={answer} />
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {drill.options.map((option) => {
              const isPicked = picked === option.id;
              const reveal = result !== null;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={reveal}
                    onClick={() => answer([option.id])}
                    className={`notch-sm w-full border px-4 py-2.5 text-left text-[13.5px] transition-colors ${
                      reveal && option.correct
                        ? "border-acid-500 bg-[var(--surface-accent)] text-text"
                        : isPicked
                          ? "border-danger text-text"
                          : "border-line-1 text-text-body hover:border-line-3 disabled:hover:border-line-1"
                    }`}
                  >
                    {option.label}
                  </button>
                  {reveal && (isPicked || option.correct) && (
                    <p className="mt-1.5 pl-1 text-[12.5px] leading-relaxed text-text-muted">
                      {option.explain}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* The choice kinds explain themselves through the option the player picked; these two
            carry one explanation for the whole drill, so it goes here. */}
        {result && !isChoiceDrill(drill) && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-text-muted">{result.explanation}</p>
        )}
      </div>
    </section>
  );
}
