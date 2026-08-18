"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { PersonalQuestion } from "@/domains/quiz/services/personalQuestions";

export interface Graded {
  correct: boolean;
  answer: string;
  choice: string;
}

interface PersonalQuestionCardProps {
  question: Omit<PersonalQuestion, "answer">;
  result?: Graded;
  onAnswer: (option: string) => void;
}

function optionTone(state: "right" | "wrong" | "spent" | "open"): string {
  switch (state) {
    case "right":
      return "glow-accent-soft animate-quiz-pop border-accent bg-accent/12 text-accent";
    case "wrong":
      return "animate-quiz-shake border-danger bg-danger/12 text-danger";
    case "spent":
      return "border-line-2 bg-surface text-fg-4";
    case "open":
      return "border-line-2 bg-surface text-fg-1 hover:border-line-3";
  }
}

export function PersonalQuestionCard({
  question,
  result,
  onAnswer,
}: PersonalQuestionCardProps): React.JSX.Element {
  return (
    <div className="notch border border-line-1 bg-surface-dark p-4">
      <p className="font-mono text-[9.5px] uppercase tracking-micro text-text-muted">
        {question.kind.replace(/-/g, " ")}
      </p>
      <p className="mt-2.5 text-[14.5px] leading-snug text-fg-1">{question.prompt}</p>

      {question.scoreline && (
        <div className="tag-cut mt-3 flex flex-wrap items-center gap-3 border border-line-2 bg-surface px-3 py-2">
          <ChampionIcon name={question.scoreline.championName} size={30} />
          <span className="font-mono text-[13px] tabular-nums text-fg-1">
            {question.scoreline.kills}/{question.scoreline.deaths}/{question.scoreline.assists}
          </span>
          <span className="font-mono text-[11px] text-fg-3">
            {question.scoreline.cs} CS · {question.scoreline.durationMin} min
          </span>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        {question.options.map((option) => {
          const isAnswer = result && option === result.answer;
          const isWrongPick = result && option === result.choice && !result.correct;
          const state = isAnswer ? "right" : isWrongPick ? "wrong" : result ? "spent" : "open";
          return (
            <button
              key={option}
              type="button"
              disabled={Boolean(result)}
              onClick={() => onAnswer(option)}
              className={`tag-cut border px-3 py-1.5 text-[13px] transition-colors ${optionTone(state)}`}
            >
              {option}
              {isAnswer && " ✓"}
              {isWrongPick && " ✕"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
