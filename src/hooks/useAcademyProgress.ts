"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DrillAttempt } from "@/domains/academy/drills/scoring";
import type { SubmitResult } from "@/domains/academy/services/progressService";

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

/** Grades the drills server-side and stores the attempt. */
export function useSubmitLesson() {
  return useMutation<SubmitResult, Error, SubmitLessonInput>({
    mutationFn: ({ lessonId, attempts }) =>
      apiFetch<SubmitResult>("/api/academy/progress", {
        method: "POST",
        body: JSON.stringify({ action: "submit", lessonId, attempts }),
      }),
  });
}
