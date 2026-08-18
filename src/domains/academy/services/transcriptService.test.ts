import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { academyProgress: { findMany: vi.fn() }, user: { findUnique: vi.fn() } },
}));

import { prisma } from "@/lib/db/prisma";
import { buildCertificate, getTranscript } from "./transcriptService";
import { TRACKS, lessonId } from "@/domains/academy/curriculum";

const USER = "user-1";
const FOUNDATIONS = TRACKS.find((t) => t.id === "foundations")!;

function row(lesson: string, over: Record<string, unknown> = {}) {
  return {
    lessonId: lesson,
    status: "completed",
    completedAt: new Date("2026-08-01T00:00:00Z"),
    masteredAt: null,
    xpAwarded: 40,
    ...over,
  };
}

/** Every lesson of Foundations finished, with the given status. */
function wholeTrack(status: string, over: Record<string, unknown> = {}) {
  return FOUNDATIONS.lessons.map((l) => row(lessonId(l), { status, ...over }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: "Kaan" } as never);
});

describe("getTranscript", () => {
  it("reports every track, with untouched lessons available", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([] as never);

    const transcript = await getTranscript(USER);

    expect(transcript.tracks).toHaveLength(TRACKS.length);
    expect(transcript.totalCompleted).toBe(0);
    expect(transcript.tracks[0].lessons.every((l) => l.status === "available")).toBe(true);
    expect(transcript.tracks[0].finished).toBe(false);
  });

  it("counts completed and mastered separately and sums the XP paid", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([
      row(lessonId(FOUNDATIONS.lessons[0]), {
        status: "mastered",
        masteredAt: new Date("2026-08-05T00:00:00Z"),
        xpAwarded: 160,
      }),
      row(lessonId(FOUNDATIONS.lessons[1])),
    ] as never);

    const transcript = await getTranscript(USER);
    const foundations = transcript.tracks.find((t) => t.trackId === "foundations")!;

    expect(foundations.completed).toBe(2);
    expect(foundations.mastered).toBe(1);
    expect(transcript.xp).toBe(200);
  });

  // A decayed lesson is not finished: the certificate would claim something the player's own
  // games have stopped showing.
  it("does not call a track finished while one of its lessons is in review", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([
      ...wholeTrack("mastered").slice(1),
      row(lessonId(FOUNDATIONS.lessons[0]), { status: "review" }),
    ] as never);

    const transcript = await getTranscript(USER);
    expect(transcript.tracks.find((t) => t.trackId === "foundations")!.finished).toBe(false);
  });
});

describe("buildCertificate", () => {
  it("issues one for a finished track, dated by its last lesson", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([
      ...wholeTrack("completed"),
      row(lessonId(FOUNDATIONS.lessons[5]), {
        status: "mastered",
        masteredAt: new Date("2026-08-09T00:00:00Z"),
      }),
    ] as never);

    const certificate = await buildCertificate(USER, "foundations");

    expect(certificate).toMatchObject({
      trackId: "foundations",
      trackTitle: "Foundations",
      displayName: "Kaan",
      lessonsTotal: 6,
      lessonsMastered: 1,
    });
    expect(certificate?.finishedAt).toBe("2026-08-09T00:00:00.000Z");
  });

  it("refuses one for a track that is not finished", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([
      row(lessonId(FOUNDATIONS.lessons[0])),
    ] as never);

    expect(await buildCertificate(USER, "foundations")).toBeNull();
  });

  it("returns null for a track that does not exist", async () => {
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue([] as never);
    expect(await buildCertificate(USER, "nope")).toBeNull();
  });

  it("falls back to a neutral name for a player without one", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: null } as never);
    vi.mocked(prisma.academyProgress.findMany).mockResolvedValue(wholeTrack("completed") as never);

    const certificate = await buildCertificate(USER, "foundations");
    expect(certificate?.displayName).toBe("A LaneIQ player");
  });
});
