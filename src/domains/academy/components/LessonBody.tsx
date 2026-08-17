"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOpenLesson, useSubmitLesson } from "@/hooks/useAcademyProgress";
import { scoreLesson, type DrillAttempt } from "@/domains/academy/drills/scoring";
import type { AssignmentTarget } from "@/domains/academy/assignments";
import type { Drill, LessonBlock } from "@/domains/academy/types";
import { LessonBlockView } from "./LessonBlocks";
import { DrillCard } from "./DrillCard";
import { LessonComplete } from "./LessonComplete";

interface LessonBodyProps {
  lessonId: string;
  blocks: LessonBlock[];
  drills: Drill[];
  assignment: AssignmentTarget | null;
  next: { href: string; title: string } | null;
  isAuthenticated: boolean;
  /** A stored assignment is already on the page below, so the panel need not repeat it. */
  liveAssignment: boolean;
}

/**
 * The reading and drilling surface. Drills are answered inline; once every drill on the
 * page has an answer the lesson grades itself and the field assignment appears. Grading
 * runs locally for the instant result and on the server for the stored one — the server's
 * verdict is the one that counts.
 */
export function LessonBody({
  lessonId,
  blocks,
  drills,
  assignment,
  next,
  isAuthenticated,
  liveAssignment,
}: LessonBodyProps): React.ReactElement {
  const [attempts, setAttempts] = useState<DrillAttempt[]>([]);
  const router = useRouter();
  const open = useOpenLesson();
  const submit = useSubmitLesson();
  const submitted = useRef(false);

  const drillById = useMemo(() => new Map(drills.map((d) => [d.id, d])), [drills]);
  const finished = drills.length > 0 && attempts.length === drills.length;

  // Opening is recorded once per mount, and only for someone who has somewhere to record it.
  const openMutate = open.mutate;
  useEffect(() => {
    if (isAuthenticated) openMutate(lessonId);
  }, [isAuthenticated, lessonId, openMutate]);

  // The submit is what opens the field assignment, and the assignment panel is rendered by the
  // server component above this one — so a refresh is how it appears without a manual reload.
  const submitMutate = submit.mutate;
  useEffect(() => {
    if (!finished || submitted.current || !isAuthenticated) return;
    submitted.current = true;
    submitMutate({ lessonId, attempts }, { onSuccess: () => router.refresh() });
  }, [finished, isAuthenticated, lessonId, attempts, submitMutate, router]);

  function record(drillId: string, answer: string[]): void {
    setAttempts((prev) =>
      prev.some((a) => a.drillId === drillId) ? prev : [...prev, { drillId, answer }]
    );
  }

  // Scored against the drills actually on the page, so a gated pro lesson is graded on
  // its visible half rather than on drills the reader never saw.
  const localScore = scoreLesson(drills, attempts);

  return (
    <div>
      {blocks.map((block, i) => {
        if (block.kind !== "drill") {
          return <LessonBlockView key={`${block.kind}-${i}`} block={block} />;
        }
        const drill = drillById.get(block.drillId);
        return drill ? <DrillCard key={drill.id} drill={drill} onAnswered={record} /> : null;
      })}

      {finished && (
        <LessonComplete
          score={localScore}
          assignment={assignment}
          next={next}
          isAuthenticated={isAuthenticated}
          saving={submit.isPending}
          saveFailed={submit.isError}
          liveAssignment={liveAssignment}
        />
      )}
    </div>
  );
}
