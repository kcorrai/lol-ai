import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { notification: { create: vi.fn() } },
}));
vi.mock("@/domains/discord", () => ({ messageLinkedUser: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { messageLinkedUser } from "@/domains/discord";
import { notify } from "@/domains/marketplace/services/notificationService";

const db = vi.mocked(prisma, true);
const dm = vi.mocked(messageLinkedUser);

beforeEach(() => {
  vi.clearAllMocks();
  db.notification.create.mockResolvedValue({} as never);
  dm.mockResolvedValue(true);
});

describe("notify", () => {
  it("also DMs the student on Discord when their session is confirmed", async () => {
    await notify({
      type: "booking.accepted",
      bookingId: "b-1",
      studentId: "st-1",
      coachName: "Elif",
    });

    expect(db.notification.create).toHaveBeenCalled();
    expect(dm).toHaveBeenCalledWith("st-1", expect.stringContaining("/sessions/b-1"));
  });

  it("sends a reminder to Discord too", async () => {
    await notify({
      type: "session.reminder",
      bookingId: "b-1",
      userId: "u-1",
      withName: "Elif",
      startsAt: new Date("2026-09-27T18:00:00Z"),
    });

    expect(dm).toHaveBeenCalledWith("u-1", expect.any(String));
  });

  it("keeps everything else in the app", async () => {
    await notify({
      type: "booking.requested",
      bookingId: "b-1",
      coachUserId: "c-1",
      studentName: "Deniz",
    });

    expect(dm).not.toHaveBeenCalled();
  });

  it("never lets a Discord failure escape", async () => {
    dm.mockRejectedValue(new Error("discord down"));

    await expect(
      notify({ type: "booking.accepted", bookingId: "b-1", studentId: "st-1", coachName: "Elif" })
    ).resolves.toBeUndefined();
    expect(db.notification.create).toHaveBeenCalled();
  });
});
