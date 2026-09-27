import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    booking: { findFirst: vi.fn() },
    conversation: { count: vi.fn() },
    message: { findFirst: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  hasBooking,
  mayAskAgain,
  mayOpenQuestion,
  MAX_QUESTION_THREADS_PER_DAY,
  MAX_UNANSWERED_QUESTIONS,
} from "@/domains/marketplace/services/questionGate";

const db = vi.mocked(prisma, true);

beforeEach(() => vi.clearAllMocks());

describe("hasBooking", () => {
  it("is true for any booking between the pair, whatever its state", async () => {
    db.booking.findFirst.mockResolvedValue({ id: "b-1" } as never);
    expect(await hasBooking("cp-1", "st-1")).toBe(true);
    expect(db.booking.findFirst).toHaveBeenCalledWith({
      where: { coachProfileId: "cp-1", studentId: "st-1" },
      select: { id: true },
    });
  });

  it("is false when they have never booked", async () => {
    db.booking.findFirst.mockResolvedValue(null as never);
    expect(await hasBooking("cp-1", "st-1")).toBe(false);
  });
});

describe("mayOpenQuestion", () => {
  it("allows new questions under the daily limit", async () => {
    db.conversation.count.mockResolvedValue((MAX_QUESTION_THREADS_PER_DAY - 1) as never);
    expect(await mayOpenQuestion("st-1")).toBe(true);
  });

  it("refuses at the limit", async () => {
    db.conversation.count.mockResolvedValue(MAX_QUESTION_THREADS_PER_DAY as never);
    expect(await mayOpenQuestion("st-1")).toBe(false);
  });

  it("counts only the last day's threads with coaches the student never booked", async () => {
    db.conversation.count.mockResolvedValue(0 as never);
    const now = new Date("2026-09-27T12:00:00Z");

    await mayOpenQuestion("st-1", now);

    expect(db.conversation.count).toHaveBeenCalledWith({
      where: {
        studentId: "st-1",
        createdAt: { gte: new Date("2026-09-26T12:00:00Z") },
        coachProfile: { bookings: { none: { studentId: "st-1" } } },
      },
    });
  });
});

describe("mayAskAgain", () => {
  it("counts everything the student sent when the coach has never replied", async () => {
    db.message.findFirst.mockResolvedValue(null as never);
    db.message.count.mockResolvedValue(MAX_UNANSWERED_QUESTIONS as never);

    expect(await mayAskAgain("conv-1", "st-1")).toBe(false);
    expect(db.message.count).toHaveBeenCalledWith({
      where: { conversationId: "conv-1", senderId: "st-1" },
    });
  });

  it("starts counting again after the coach's last reply", async () => {
    const replied = new Date("2026-09-27T10:00:00Z");
    db.message.findFirst.mockResolvedValue({ createdAt: replied } as never);
    db.message.count.mockResolvedValue(0 as never);

    expect(await mayAskAgain("conv-1", "st-1")).toBe(true);
    expect(db.message.count).toHaveBeenCalledWith({
      where: { conversationId: "conv-1", senderId: "st-1", createdAt: { gt: replied } },
    });
  });
});
