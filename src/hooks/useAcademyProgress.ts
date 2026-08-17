"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DrillAttempt } from "@/domains/academy/drills/scoring";
import type { SubmitResult } from "@/domains/academy/services/progressService";
import type { AssignmentView } from "@/domains/academy/services/assignmentService";

/**
 * Records that a signed-in player opened a lesson. Fire-and-forget: a failed write
 * costs a progress row, not the reading experience, so callers ignore the result.
 */
export function useOpenLesson() {
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: (lessonId) =>
      apiFetch<{ ok: boolean }>("/api/academy/progress", {
        method: "POST",
        body: JSON.stringify({ action: "open", lessonId }),
      }),
  });
}

export interface SubmitLessonInput {
  lessonId: string;
  attempts: DrillAttempt[];
}

/** Whatever the assignment ended up as — null when there is nothing to measure against. */
export type SubmitLessonResult = SubmitResult & { assignment: AssignmentView | null };

/** Grades the drills server-side, stores the attempt, and starts the field assignment. */
export function useSubmitLesson() {
  return useMutation<SubmitLessonResult, Error, SubmitLessonInput>({
    mutationFn: ({ lessonId, attempts }) =>
      apiFetch<SubmitLessonResult>("/api/academy/progress", {
        method: "POST",
        body: JSON.stringify({ action: "submit", lessonId, attempts }),
      }),
  });
}

/** Clears a failed or expired assignment and opens a fresh one from today's baseline. */
export function useRestartAssignment() {
  return useMutation<{ assignment: AssignmentView | null }, Error, string>({
    mutationFn: (lessonId) =>
      apiFetch<{ assignment: AssignmentView | null }>("/api/academy/progress", {
        method: "POST",
        body: JSON.stringify({ action: "restart-assignment", lessonId }),
      }),
  });
}
