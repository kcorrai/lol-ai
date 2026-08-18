"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonalQuiz } from "@/hooks/usePersonalQuiz";
import { PersonalQuestionCard, type Graded } from "./PersonalQuestionCard";
import { StageHeader, StageShell } from "./StageShell";

/** The empty states share the stage frame so the mode strip never jumps. */
function Gate({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
}): React.JSX.Element {
  return (
    <StageShell>
      <StageHeader icon={UserRound} label="Yours" note="Not started" />
      <div className="px-5 py-10 text-center">
        {icon}
        <h3 className="mt-3 font-display text-base font-bold uppercase tracking-wide text-fg-1">
          {title}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-fg-3">{body}</p>
        <div className="mt-4">{action}</div>
      </div>
    </StageShell>
  );
}

const ACTION_CLASS =
  "tag-cut btn-glow inline-block border border-accent bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-ink-1000 hover:bg-acid-400";

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

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  // Anonymous. This is the one mode an account actually buys, so say so.
  if (!data) {
    return (
      <Gate
        icon={<Lock aria-hidden className="mx-auto h-5 w-5 text-fg-4" />}
        title="Your own quiz"
        body="Five questions a day about your own games — the champions you really play, the games you really won. Nobody else can ask these, because nobody else has your match history."
        action={
          <Link href="/login?callbackUrl=/quiz" className={ACTION_CLASS}>
            Sign in to play
          </Link>
        }
      />
    );
  }

  if (data.needsMatches) {
    return (
      <Gate
        title="Not enough games yet"
        body={`Your personal quiz needs ${data.needsMatches.need} synced games to ask a fair question. You have ${data.needsMatches.have}.`}
        action={
          <Link
            href="/dashboard"
            className="tag-cut inline-block border border-line-2 px-4 py-2 font-mono text-[11px] uppercase tracking-label text-fg-2 hover:border-accent hover:text-accent"
          >
            Sync your matches
          </Link>
        }
      />
    );
  }

  const correctCount = Object.values(graded).filter((g) => g.correct).length;

  return (
    <StageShell>
      <StageHeader
        icon={UserRound}
        label="Yours"
        note={`${correctCount}/${data.questions.length} correct`}
      />

      <div className="grid animate-quiz-stage gap-4 p-5 md:grid-cols-2">
        {data.questions.map((question) => (
          <PersonalQuestionCard
            key={question.id}
            question={question}
            result={graded[question.id]}
            onAnswer={(choice) => void answer(question.id, choice)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-1 px-5 py-3.5">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-3">
          Built from your own last 90 days
        </span>
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-accent hover:text-acid-400"
        >
          Re-sync matches →
        </Link>
      </div>
    </StageShell>
  );
}
