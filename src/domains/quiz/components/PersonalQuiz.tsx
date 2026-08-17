"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, X } from "lucide-react";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { usePersonalQuiz } from "@/hooks/usePersonalQuiz";

interface Graded {
  correct: boolean;
  answer: string;
  choice: string;
}

export function PersonalQuiz(): React.JSX.Element {
  const { data, isLoading } = usePersonalQuiz();
  const [graded, setGraded] = useState<Record<string, Graded>>({});

  async function answer(questionId: string, choice: string): Promise<void> {
    if (graded[questionId]) return;
    try {
      const res = await fetch("/api/quiz/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, choice }),
      });
      const json = (await res.json()) as { data?: { correct: boolean; answer: string } };
      if (json.data) setGraded((g) => ({ ...g, [questionId]: { ...json.data!, choice } }));
    } catch {
      // Leaving the question unanswered is the honest failure here.
    }
  }

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  // Anonymous. This is the one mode an account actually buys, so say so.
  if (!data) {
    return (
      <HudPanel className="p-5 text-center">
        <Lock className="mx-auto h-5 w-5 text-fg-4" />
        <h3 className="mt-2.5 font-display text-base font-bold uppercase tracking-wide text-fg-1">
          Your own quiz
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-3">
          Five questions a day about your own games — the champions you really play, the games you
          really won. Nobody else can ask these, because nobody else has your match history.
        </p>
        <Link
          href="/login?callbackUrl=/quiz"
          className="notch-sm mt-3.5 inline-block border border-accent/50 bg-accent/12 px-4 py-2 font-mono text-[11px] uppercase tracking-label text-accent hover:bg-accent/20"
        >
          Sign in to play
        </Link>
      </HudPanel>
    );
  }

  if (data.needsMatches) {
    return (
      <HudPanel className="p-5 text-center">
        <h3 className="font-display text-base font-bold uppercase tracking-wide text-fg-1">
          Not enough games yet
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-3">
          Your personal quiz needs {data.needsMatches.need} synced games to ask a fair question.
          You have {data.needsMatches.have}.
        </p>
        <Link
          href="/dashboard"
          className="notch-sm mt-3.5 inline-block border border-line-2 px-4 py-2 font-mono text-[11px] uppercase tracking-label text-fg-2 hover:text-fg-1"
        >
          Sync your matches
        </Link>
      </HudPanel>
    );
  }

  const correctCount = Object.values(graded).filter((g) => g.correct).length;

  return (
    <HudPanel className="space-y-4 p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-fg-1">
          Your own quiz
        </h2>
        <span className="font-mono text-[10.5px] text-fg-4">
          {correctCount}/{data.questions.length}
        </span>
      </div>

      {data.questions.map((question) => {
        const result = graded[question.id];
        return (
          <div key={question.id} className="space-y-2">
            <HudRule label={`// ${question.kind.replace(/-/g, " ").toUpperCase()}`} />
            <p className="text-[13.5px] text-fg-2">{question.prompt}</p>

            {question.scoreline && (
              <div className="notch-sm flex flex-wrap items-center gap-3 border border-line-2 bg-surface-dark px-3 py-2">
                <ChampionIcon name={question.scoreline.championName} size={32} />
                <span className="font-mono text-[13px] text-fg-1">
                  {question.scoreline.kills}/{question.scoreline.deaths}/
                  {question.scoreline.assists}
                </span>
                <span className="font-mono text-[11px] text-fg-3">
                  {question.scoreline.cs} CS · {question.scoreline.durationMin} min
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {question.options.map((option) => {
                const isAnswer = result && option === result.answer;
                const isWrongPick = result && option === result.choice && !result.correct;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={Boolean(result)}
                    onClick={() => void answer(question.id, option)}
                    className={`notch-sm flex items-center gap-1.5 border px-3 py-1.5 text-[12.5px] transition-colors ${
                      isAnswer
                        ? "border-accent bg-accent/15 text-accent"
                        : isWrongPick
                          ? "border-danger/50 bg-danger/12 text-danger"
                          : "border-line-2 bg-surface-dark text-fg-2 hover:text-fg-1 disabled:opacity-50"
                    }`}
                  >
                    {option}
                    {isAnswer && <Check className="h-3.5 w-3.5" />}
                    {isWrongPick && <X className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </HudPanel>
  );
}
