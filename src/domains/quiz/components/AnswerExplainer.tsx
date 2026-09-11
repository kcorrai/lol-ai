"use client";

import { Lightbulb } from "lucide-react";
import type { PuzzleExplanation } from "@/domains/quiz";
import { EmojiDecoder } from "./EmojiDecoder";
import { ImpostorReveal } from "./ImpostorReveal";

interface AnswerExplainerProps {
  explanation: PuzzleExplanation;
  answerName: string;
}

/**
 * The payoff. Emoji and Impostor used to end on a bare name — five pictures
 * nobody ever decoded, and seven champions whose shared trait was never spoken
 * aloud. Everything in here is quoted from the committed dataset, so the panel
 * can be read as fact rather than as a guess about the game.
 */
export function AnswerExplainer({
  explanation,
  answerName,
}: AnswerExplainerProps): React.JSX.Element {
  return (
    <section className="animate-quiz-rise border-t border-line-1 bg-surface-dark">
      <header className="flex items-center gap-2.5 border-b border-line-1 px-5 py-3">
        <Lightbulb aria-hidden className="h-3.5 w-3.5 text-accent" />
        <h3 className="font-mono text-[9.5px] uppercase tracking-micro text-text-muted">
          {"// Why it was "}
          <span className="text-accent">{answerName}</span>
        </h3>
      </header>

      <div className="p-5">
        {explanation.kind === "emoji" ? (
          <EmojiDecoder champion={explanation.champion} clues={explanation.clues} />
        ) : (
          <ImpostorReveal
            category={explanation.category}
            value={explanation.value}
            impostorValues={explanation.impostorValues}
            candidates={explanation.candidates}
          />
        )}
      </div>
    </section>
  );
}
