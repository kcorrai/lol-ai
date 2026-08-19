import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    conversation: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    message: { findMany: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    booking: { findMany: vi.fn(), findFirst: vi.fn() },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { getThread, listThreads } from "@/domains/marketplace/services/messagingService";

const db = prisma as unknown as {
  conversation: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  message: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> };
  booking: { findMany: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

const ME = "user-me";
const THEM = "user-them";
const CONVERSATION = "conv-1";

function conversation() {
  return {
    id: CONVERSATION,
    studentId: ME,
    lastMessageAt: new Date("2026-08-19T10:00:00Z"),
    student: { name: "Kaan" },
    coachProfile: { id: "cp-1", userId: THEM, slug: "a-coach", displayName: "A Coach" },
  };
}

function message(over: Record<string, unknown> = {}) {
  return {
    id: "m-1",
    body: "hello",
    senderId: THEM,
    wasRedacted: false,
    createdAt: new Date("2026-08-19T09:00:00Z"),
    readAt: new Date("2026-08-19T09:30:00Z"),
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.conversation.findUnique.mockResolvedValue(conversation());
  db.message.updateMany.mockResolvedValue({ count: 0 });
});

describe("getThread read receipts", () => {
  // An open thread is polled every five seconds. This write fired on every one of those polls and
  // almost always matched nothing — a write transaction, its WAL and its locks, for no change.
  it("does not write when everything is already read", async () => {
    db.message.findMany.mockResolvedValue([message(), message({ id: "m-2", senderId: ME })]);

    await getThread(CONVERSATION, ME);

    expect(db.message.updateMany).not.toHaveBeenCalled();
  });

  it("does not write when the only unread message is our own", async () => {
    // Our own outgoing message is unread until they open the thread. That is their receipt to set,
    // not ours, and it must not be mistaken for something to mark.
    db.message.findMany.mockResolvedValue([message({ senderId: ME, readAt: null })]);

    await getThread(CONVERSATION, ME);

    expect(db.message.updateMany).not.toHaveBeenCalled();
  });

  it("writes once when the other side has something unread", async () => {
    db.message.findMany.mockResolvedValue([message({ senderId: THEM, readAt: null })]);

    await getThread(CONVERSATION, ME);

    expect(db.message.updateMany).toHaveBeenCalledTimes(1);
    expect(db.message.updateMany).toHaveBeenCalledWith({
      where: { conversationId: CONVERSATION, senderId: { not: ME }, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  // The guard reads the page, but the write is not scoped to it. Unread messages are always the
  // newest ones — readAt is only ever set here, and set for all of them at once — so if any exist
  // the newest message is one of them and the page cannot miss it. The write then clears the whole
  // backlog, not just the page.
  it("clears the whole backlog, not only the page it inspected", async () => {
    db.message.findMany.mockResolvedValue([message({ senderId: THEM, readAt: null })]);

    await getThread(CONVERSATION, ME, 1);

    const where = db.message.updateMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty("id");
    expect(where).toEqual({ conversationId: CONVERSATION, senderId: { not: ME }, readAt: null });
  });

  it("reports the thread as read regardless, since the caller is reading it now", async () => {
    db.message.findMany.mockResolvedValue([message()]);

    const thread = await getThread(CONVERSATION, ME);

    expect(thread?.unread).toBe(0);
  });

  it("returns null for someone who is in neither side of the conversation", async () => {
    const thread = await getThread(CONVERSATION, "a-stranger");

    expect(thread).toBeNull();
    expect(db.message.findMany).not.toHaveBeenCalled();
  });
});

describe("listThreads booking lookup", () => {
  function threadRow(over: Record<string, unknown> = {}) {
    return {
      id: "conv-1",
      studentId: ME,
      lastMessageAt: new Date("2026-08-19T10:00:00Z"),
      student: { name: "Kaan" },
      coachProfile: { userId: THEM, slug: "a-coach", displayName: "A Coach" },
      _count: { messages: 0 },
      messages: [{ body: "hi" }],
      coachProfileId: "cp-1",
      ...over,
    };
  }

  beforeEach(() => {
    db.conversation.findMany.mockResolvedValue([threadRow()]);
    db.$queryRaw.mockResolvedValue([]);
  });

  // It used to read every booking for every pair and then throw away all but the newest per pair —
  // a coach with forty repeat students at twenty sessions each read eight hundred rows to produce
  // forty values, with no `take` bounding it.
  it("asks the database for one row per pair instead of every booking", async () => {
    await listThreads(ME);

    expect(db.booking.findMany).not.toHaveBeenCalled();
    expect(db.$queryRaw).toHaveBeenCalledTimes(1);

    const sql = (db.$queryRaw.mock.calls[0][0] as string[]).join(" ? ");
    expect(sql).toContain("DISTINCT ON");
    expect(sql).toContain('"createdAt" DESC');
  });

  it("passes the pairs as arrays rather than expanding them into the query text", async () => {
    db.conversation.findMany.mockResolvedValue([
      threadRow({ id: "c1", coachProfileId: "cp-1", studentId: ME }),
      threadRow({ id: "c2", coachProfileId: "cp-2", studentId: ME }),
    ]);

    await listThreads(ME);

    const [, coachIds, studentIds] = db.$queryRaw.mock.calls[0];
    expect(coachIds).toEqual(["cp-1", "cp-2"]);
    expect(studentIds).toEqual([ME, ME]);
  });

  it("maps each pair's status onto its thread", async () => {
    db.$queryRaw.mockResolvedValue([
      { coachProfileId: "cp-1", studentId: ME, status: "COMPLETED" },
    ]);

    const threads = await listThreads(ME);

    expect(threads[0].bookingStatus).toBe("COMPLETED");
  });

  it("leaves the status null for a pair with no booking", async () => {
    db.$queryRaw.mockResolvedValue([]);

    const threads = await listThreads(ME);

    expect(threads[0].bookingStatus).toBeNull();
  });

  it("does not query at all when the caller is in no threads", async () => {
    db.conversation.findMany.mockResolvedValue([]);

    const threads = await listThreads(ME);

    expect(threads).toEqual([]);
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
});
