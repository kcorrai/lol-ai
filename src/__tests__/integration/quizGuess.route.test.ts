import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// What is under test is the route's own contract (CLAUDE.md 2.2): a round is
// judged before it is recorded, so a failing write must not take the judged
// round down with it (LA-26). Everything the route delegates to is mocked.
vi.mock("@/domains/quiz", () => ({
  isQuizMode: (value: string) => value === "classic",
  judgeGuess: vi.fn(),
  revealAnswer: vi.fn(),
  UnknownChampionError: class extends Error {
    constructor(public readonly guess: string) {
      super(guess);
    }
  },
}));

vi.mock("@/domains/quiz/services/streakService", async () => {
  const actual = await vi.importActual<typeof import("@/domains/quiz/services/streakService")>(
    "@/domains/quiz/services/streakService"
  );
  return {
    recordGuess: vi.fn(),
    recordGiveUp: vi.fn(),
    // The real one: swallowing is the behaviour being tested, not a stand-in.
    recordBestEffort: actual.recordBestEffort,
  };
});

// `recordBestEffort` is the only thing imported for real out of that file, and
// it touches neither of these — they are stubbed so loading the module does not
// reach for a database.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/domains/analysis", () => ({ awardXp: vi.fn() }));

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));

vi.mock("@/lib/api/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterMs: 0, limit: 30 }),
  rateLimitResponse: vi.fn(),
  getIp: () => "127.0.0.1",
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from "@/../app/api/quiz/guess/route";
import { judgeGuess, revealAnswer } from "@/domains/quiz";
import { recordGiveUp, recordGuess } from "@/domains/quiz/services/streakService";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/utils/logger";

const mockJudge = judgeGuess as unknown as ReturnType<typeof vi.fn>;
const mockReveal = revealAnswer as unknown as ReturnType<typeof vi.fn>;
const mockRecordGuess = recordGuess as unknown as ReturnType<typeof vi.fn>;
const mockRecordGiveUp = recordGiveUp as unknown as ReturnType<typeof vi.fn>;
const mockSession = getServerSession as unknown as ReturnType<typeof vi.fn>;

const VERDICT = { guess: "Aatrox", correct: true };
const ANSWER = { id: "Aatrox", name: "Aatrox", title: "the Darkin Blade" };

function post(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/quiz/guess", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockJudge.mockReturnValue(VERDICT);
  mockReveal.mockReturnValue(ANSWER);
  mockSession.mockResolvedValue({ user: { id: "user-1" } });
});

describe("POST /api/quiz/guess", () => {
  it("answers with the verdict and records it for a signed-in player", async () => {
    const res = await POST(post({ mode: "classic", guess: "Aatrox", previousGuesses: [] }));
    const body = (await res.json()) as { data: typeof VERDICT };

    expect(res.status).toBe(200);
    expect(body.data).toEqual(VERDICT);
    expect(mockRecordGuess).toHaveBeenCalledWith(
      "user-1",
      "classic",
      "Aatrox",
      true,
      expect.any(Date)
    );
  });

  it("still answers with the judged round when recording it throws", async () => {
    mockRecordGuess.mockRejectedValue(new Error("P2003 foreign key constraint failed"));

    const res = await POST(post({ mode: "classic", guess: "Aatrox", previousGuesses: [] }));
    const body = (await res.json()) as { data: typeof VERDICT };

    expect(res.status).toBe(200);
    expect(body.data).toEqual(VERDICT);
    expect(logger.error).toHaveBeenCalled();
  });

  it("still reveals the answer when recording the give-up throws", async () => {
    mockRecordGiveUp.mockRejectedValue(new Error("too many clients already"));

    const res = await POST(post({ mode: "classic", giveUp: true }));
    const body = (await res.json()) as { data: { answer: typeof ANSWER } };

    expect(res.status).toBe(200);
    expect(body.data.answer).toEqual(ANSWER);
    expect(logger.error).toHaveBeenCalled();
  });

  it("records nothing for an anonymous player", async () => {
    mockSession.mockResolvedValue(null);

    const res = await POST(post({ mode: "classic", guess: "Aatrox", previousGuesses: [] }));

    expect(res.status).toBe(200);
    expect(mockRecordGuess).not.toHaveBeenCalled();
  });

  it("records nothing for a practice round", async () => {
    const res = await POST(
      post({ mode: "classic", guess: "Aatrox", previousGuesses: [], practiceSeed: "seed-1" })
    );

    expect(res.status).toBe(200);
    expect(mockRecordGuess).not.toHaveBeenCalled();
  });
});
