import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: { findFirst: vi.fn() },
    conversation: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@/domains/marketplace/services/questionGate", () => ({
  hasBooking: vi.fn(),
  mayOpenQuestion: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { hasBooking, mayOpenQuestion } from "@/domains/marketplace/services/questionGate";
import { openThread } from "@/domains/marketplace/services/threadOpenService";

const db = vi.mocked(prisma, true);
const booked = vi.mocked(hasBooking);
const mayOpen = vi.mocked(mayOpenQuestion);

beforeEach(() => {
  vi.clearAllMocks();
  db.coachProfile.findFirst.mockResolvedValue({ id: "cp-1", userId: "coach-user" } as never);
  db.conversation.findUnique.mockResolvedValue(null as never);
  db.conversation.upsert.mockResolvedValue({ id: "conv-new" } as never);
  booked.mockResolvedValue(false);
  mayOpen.mockResolvedValue(true);
});

describe("openThread", () => {
  it("finds a coach by slug, approved only", async () => {
    await openThread({ slug: "riftwalker" }, "st-1");
    expect(db.coachProfile.findFirst).toHaveBeenCalledWith({
      where: { slug: "riftwalker", status: "APPROVED" },
      select: { id: true, userId: true },
    });
  });

  it("reports a coach that is not listed", async () => {
    db.coachProfile.findFirst.mockResolvedValue(null as never);
    expect(await openThread({ id: "cp-x" }, "st-1")).toEqual({ ok: false, reason: "not-found" });
  });

  it("refuses a coach messaging themselves", async () => {
    expect(await openThread({ id: "cp-1" }, "coach-user")).toEqual({ ok: false, reason: "self" });
  });

  it("always reopens an existing thread, whatever the limits say", async () => {
    db.conversation.findUnique.mockResolvedValue({ id: "conv-old" } as never);
    mayOpen.mockResolvedValue(false);

    expect(await openThread({ id: "cp-1" }, "st-1")).toEqual({
      ok: true,
      conversationId: "conv-old",
    });
    expect(db.conversation.upsert).not.toHaveBeenCalled();
  });

  it("lets a student ask before booking", async () => {
    expect(await openThread({ id: "cp-1" }, "st-1")).toEqual({
      ok: true,
      conversationId: "conv-new",
    });
  });

  it("holds a student to the daily question limit", async () => {
    mayOpen.mockResolvedValue(false);
    expect(await openThread({ id: "cp-1" }, "st-1")).toEqual({
      ok: false,
      reason: "question-limit",
    });
  });

  it("never limits a student who has booked the coach", async () => {
    booked.mockResolvedValue(true);
    mayOpen.mockResolvedValue(false);

    expect((await openThread({ id: "cp-1" }, "st-1")).ok).toBe(true);
  });
});
