"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RankTier } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { tierLabel } from "@/lib/riot/rankDisplay";
import { Button } from "@/components/ui/button";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useRankedData } from "@/hooks/useRankedData";
import { FOCUS_AREAS, goalFor, quizResultPath, type QuizAnswers } from "@/lib/coachMatch/matchQuiz";
import { rememberGoal } from "@/lib/coachMatch/carriedGoal";
import { Choice, Question } from "@/domains/marketplace/components/QuizParts";
import { RoleIcon } from "@/domains/marketplace/components/hud/RoleIcon";
import {
  KIND_OPTIONS,
  LANGUAGE_OPTIONS,
  ROLE_OPTIONS,
} from "@/domains/marketplace/components/options";

const TIERS: RankTier[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
];
const BUDGETS = [20, 40, 60] as const;

const START: QuizAnswers = {
  role: null,
  tier: null,
  focus: null,
  kind: null,
  maxPrice: null,
  language: null,
};

/**
 * Six taps to a shortlist.
 *
 * Every answer is optional and every one becomes a storefront filter; nothing
 * is saved. A signed-in player's rank is filled in from their linked account,
 * because asking someone for a number we already hold is the kind of question
 * that makes a form feel like a form.
 */
export function FindCoachQuiz(): React.ReactElement {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>(START);
  const set = (patch: Partial<QuizAnswers>): void => setAnswers((a) => ({ ...a, ...patch }));

  const { data: accounts } = useRiotAccounts();
  const primary = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  const { data: ranked } = useRankedData(primary?.id);
  const myTier = ranked?.rank?.tier ?? null;
  useEffect(() => {
    if (myTier) setAnswers((a) => (a.tier ? a : { ...a, tier: myTier }));
  }, [myTier]);

  function finish(): void {
    rememberGoal(goalFor(answers.focus));
    router.push(quizResultPath(answers));
  }

  return (
    <div className="grid gap-5">
      <Question title="Which role do you play?">
        {ROLE_OPTIONS.map((o) => (
          <Choice
            key={o.value}
            on={answers.role === o.value}
            onClick={() => set({ role: toggle(answers.role, o.value) as QuizAnswers["role"] })}
          >
            <RoleIcon role={o.value} labelled size={16} />
          </Choice>
        ))}
      </Question>

      <Question
        title="Where are you now?"
        note={myTier ? "Filled in from your account" : undefined}
      >
        {TIERS.map((t) => (
          <Choice
            key={t}
            on={answers.tier === t}
            onClick={() => set({ tier: toggle(answers.tier, t) as RankTier | null })}
          >
            {t === "MASTER" ? "Master+" : tierLabel(t)}
          </Choice>
        ))}
      </Question>

      <Question title="What do you want to fix?">
        {FOCUS_AREAS.map((f) => (
          <Choice
            key={f.value}
            on={answers.focus === f.value}
            onClick={() => set({ focus: toggle(answers.focus, f.value) as QuizAnswers["focus"] })}
          >
            {f.label}
          </Choice>
        ))}
      </Question>

      <Question title="How do you want to learn?">
        {KIND_OPTIONS.map((o) => (
          <Choice
            key={o.value}
            on={answers.kind === o.value}
            onClick={() => set({ kind: toggle(answers.kind, o.value) as QuizAnswers["kind"] })}
          >
            {o.label}
          </Choice>
        ))}
      </Question>

      <Question title="Budget per session">
        {BUDGETS.map((b) => (
          <Choice
            key={b}
            on={answers.maxPrice === b}
            onClick={() => set({ maxPrice: answers.maxPrice === b ? null : b })}
          >
            Up to ${b}
          </Choice>
        ))}
      </Question>

      <Question title="Language">
        {LANGUAGE_OPTIONS.slice(0, 8).map((o) => (
          <Choice
            key={o.value}
            on={answers.language === o.value}
            onClick={() => set({ language: toggle(answers.language, o.value) })}
          >
            {o.label}
          </Choice>
        ))}
      </Question>

      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={finish} size="lg">
          Show my coaches
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <span className="text-[12.5px] text-text-muted">
          Skip anything — every answer is optional, and nothing is saved.
        </span>
      </div>
    </div>
  );
}

function toggle(current: string | null, value: string): string | null {
  return current === value ? null : value;
}
