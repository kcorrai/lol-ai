import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    academyProgress: { findUnique: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/domains/analysis", () => ({ awardXp: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { awardXp } from "@/domains/analysis";
import { submitLessonAttempt } from "./progressService";
import { COMPLETION_XP } from "@/domains/academy/xp";

const USER = "user-1";
// Foundations lesson 1: two drills, both quizzes, and free — so a signed-out reader sees both.
const LESSON = "foundations/map-and-win-condition";

/** The answers that pass the lesson, taken from the curriculum itself. */
import { getLessonById } from "@/domains/academy/curriculum";

function correctAnswers() {
  const lesson = getLessonById(LESSON)!;
  return lesson.drills.map((drill) => ({
    drillId: drill.id,
    answer:
      drill.kind === "order"
        ? drill.correctOrder
        : drill.kind === "wave-sim"
          ? []
          : [drill.options.find((o) => o.correct)!.id],
  }));
}

function wrongAnswers() {
  const lesson = getLessonById(LESSON)!;
  return lesson.drills.map((drill) => ({ drillId: drill.id, answer: ["nonsense"] }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(
    (async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)) as never
  );
  vi.mocked(prisma.academyProgress.findUnique).mockResolvedValue(null as never);
  vi.mocked(prisma.academyProgress.upsert).mockImplementation(
    (async ({ create }: { create: Record<string, unknown> }) => ({
      lessonId: LESSON,
      status: create.status ?? "in_progress",
      attempts: 1,
      bestScore: create.bestScore ?? 0,
      completedAt: create.completedAt ?? null,
    })) as never
  );
});

describe("submitLessonAttempt", () => {
  it("pays completion XP the first time a lesson is passed", async () => {
    await submitLessonAttempt(USER, LESSON, correctAnswers(), true);

    expect(awardXp).toHaveBeenCalledWith(prisma, USER, COMPLETION_XP);
    expect(prisma.academyProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "completed", xpAwarded: COMPLETION_XP }),
      })
    );
  });

  it("pays nothing for passing a lesson that has already been paid for", async () => {
    vi.mocked(prisma.academyProgress.findUnique).mockResolvedValue({
      bestScore: 100,
      status: "completed",
      completedAt: new Date(),
      xpAwarded: COMPLETION_XP,
    } as never);

    await submitLessonAttempt(USER, LESSON, correctAnswers(), true);

    expect(awardXp).not.toHaveBeenCalled();
  });

  // A mastery that decayed keeps its XP, so redoing the lesson is not a way to farm it.
  it("pays nothing for redoing a lesson that decayed to review", async () => {
    vi.mocked(prisma.academyProgress.findUnique).mockResolvedValue({
      bestScore: 100,
      status: "review",
      completedAt: new Date(),
      xpAwarded: 160,
    } as never);

    await submitLessonAttempt(USER, LESSON, correctAnswers(), true);

    expect(awardXp).not.toHaveBeenCalled();
  });

  it("pays nothing for an attempt that does not pass", async () => {
    const result = await submitLessonAttempt(USER, LESSON, wrongAnswers(), true);

    expect(result.score.passed).toBe(false);
    expect(awardXp).not.toHaveBeenCalled();
  });
});
