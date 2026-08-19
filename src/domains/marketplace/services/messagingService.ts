import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { redactContacts, redactionNotice } from "@/domains/marketplace/redact";

// Coach ↔ student messages.
//
// One thread per pair, not per booking: the relationship outlives any single
// session, and splitting it would scatter the history that makes a repeat
// booking worth having.
//
// Threads are addressed by their own id rather than by "the coach" — a coach
// with two students has two threads, and addressing by coach alone would pick
// one of them arbitrarily.
//
// Polled by the client rather than pushed. The draft room settled this for the
// codebase already (ADR-016): Vercel has no long-lived process to hold a socket
// on, and a five-second answer is a fine answer to "has my coach replied".

export interface MessageView {
  id: string;
  body: string;
  mine: boolean;
  wasRedacted: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface ThreadSummary {
  id: string;
  /** Who the reader is talking to, whichever side they are on. */
  withName: string;
  coachSlug: string | null;
  lastMessageAt: string;
  unread: number;
  /** The last thing said, for the list. Null on a thread with no messages. */
  preview: string | null;
  /**
   * The state of the most recent booking between these two, which is what the
   * thread is nearly always about. Null when they have never had one — which
   * cannot happen today, because a thread needs a booking to exist.
   */
  bookingStatus: BookingStatus | null;
}

/** An open thread. The list-only fields are not repeated — they are in it. */
export interface ThreadView extends Omit<ThreadSummary, "preview" | "bookingStatus"> {
  messages: MessageView[];
}

export type SendOutcome =
  | { ok: true; message: MessageView; notice: string | null }
  | { ok: false; reason: "not-found" | "no-booking" };

/** Both sides of a conversation, and which one the caller is. Null when neither. */
async function membership(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      studentId: true,
      lastMessageAt: true,
      student: { select: { name: true } },
      coachProfile: { select: { id: true, userId: true, slug: true, displayName: true } },
    },
  });

  if (!conversation) return null;

  const isCoach = conversation.coachProfile.userId === userId;
  const isStudent = conversation.studentId === userId;
  if (!isCoach && !isStudent) return null;

  return { conversation, isCoach };
}

/**
 * The status of the most recent booking for each (coach, student) pair, one row per pair.
 *
 * Raw SQL for `DISTINCT ON`, which has no fluent equivalent and is the whole point. The previous
 * version fetched *every* booking for every pair in the list ordered by date, then walked the
 * result keeping the first per pair and discarding the rest — so a coach with forty repeat students
 * at twenty sessions each read eight hundred rows to produce forty values, and there was no `take`
 * to bound it. It also built a hundred-branch `OR`, which is the shape a planner gives up on.
 *
 * The pair list is passed as two parallel arrays and joined against, rather than expanded into the
 * query text, so the statement is the same shape whatever the list length.
 */
async function latestBookingPerPair(
  pairs: Array<{ coachProfileId: string; studentId: string }>
): Promise<Map<string, BookingStatus>> {
  const latest = new Map<string, BookingStatus>();
  if (pairs.length === 0) return latest;

  const coachProfileIds = pairs.map((p) => p.coachProfileId);
  const studentIds = pairs.map((p) => p.studentId);

  const rows = await prisma.$queryRaw<
    Array<{ coachProfileId: string; studentId: string; status: BookingStatus }>
  >`
    SELECT DISTINCT ON (b."coachProfileId", b."studentId")
           b."coachProfileId", b."studentId", b."status"
    FROM bookings b
    JOIN unnest(${coachProfileIds}::uuid[], ${studentIds}::uuid[]) AS pair(cp, st)
      ON b."coachProfileId" = pair.cp AND b."studentId" = pair.st
    ORDER BY b."coachProfileId", b."studentId", b."createdAt" DESC
  `;

  for (const row of rows) {
    latest.set(`${row.coachProfileId}:${row.studentId}`, row.status);
  }
  return latest;
}

/** Every thread the caller is in, most recently active first. */
export async function listThreads(userId: string): Promise<ThreadSummary[]> {
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ studentId: userId }, { coachProfile: { userId } }] },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    select: {
      id: true,
      studentId: true,
      lastMessageAt: true,
      student: { select: { name: true } },
      coachProfile: { select: { userId: true, slug: true, displayName: true } },
      _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
      // One message and one booking per row, not a join per thread — the list
      // is capped at 100 and both are ordered reads off an existing index.
      messages: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: { body: true },
      },
      coachProfileId: true,
    },
  });

  const latest = await latestBookingPerPair(rows);

  return rows.map((row) => ({
    id: row.id,
    withName:
      row.coachProfile.userId === userId
        ? (row.student.name ?? "A student")
        : row.coachProfile.displayName,
    coachSlug: row.coachProfile.slug,
    lastMessageAt: row.lastMessageAt.toISOString(),
    unread: row._count.messages,
    preview: row.messages[0]?.body ?? null,
    bookingStatus: latest.get(`${row.coachProfileId}:${row.studentId}`) ?? null,
  }));
}

/** One thread, oldest message first. Marks the other side's messages read. */
export async function getThread(
  conversationId: string,
  userId: string,
  limit = 100
): Promise<ThreadView | null> {
  const found = await membership(conversationId, userId);
  if (!found) return null;

  const { conversation, isCoach } = found;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      body: true,
      senderId: true,
      wasRedacted: true,
      createdAt: true,
      readAt: true,
    },
  });

  // Marked read on read, which is what makes an unread count mean anything.
  //
  // Only when there is something to mark. An open thread is polled every five seconds, so this
  // fired twelve times a minute per reader and almost always matched zero rows — a write
  // transaction, its WAL and its locks, bought to change nothing. The page just read tells us
  // whether any unread message from the other side exists, so the question is already answered.
  const hasUnread = messages.some((m) => m.senderId !== userId && m.readAt === null);
  if (hasUnread) {
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return {
    id: conversation.id,
    withName: isCoach
      ? (conversation.student.name ?? "A student")
      : conversation.coachProfile.displayName,
    coachSlug: conversation.coachProfile.slug,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    unread: 0,
    messages: messages
      .map((message) => ({
        id: message.id,
        body: message.body,
        mine: message.senderId === userId,
        wasRedacted: message.wasRedacted,
        createdAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString() ?? null,
      }))
      .reverse(),
  };
}

/**
 * The student's thread with a coach, created on first use.
 *
 * Only openable by a student who has booked that coach. Open messaging would
 * turn the storefront into an inbox for anyone who can type a slug, and the
 * first thing that inbox fills with is people arranging to pay each other
 * somewhere else.
 */
export async function openThread(
  coachProfileId: string,
  studentId: string
): Promise<{ ok: true; conversationId: string } | { ok: false; reason: "no-booking" }> {
  const booking = await prisma.booking.findFirst({
    where: { coachProfileId, studentId },
    select: { id: true },
  });
  if (!booking) return { ok: false, reason: "no-booking" };

  const conversation = await prisma.conversation.upsert({
    where: { coachProfileId_studentId: { coachProfileId, studentId } },
    create: { coachProfileId, studentId },
    update: {},
    select: { id: true },
  });

  return { ok: true, conversationId: conversation.id };
}

/** Send one message. The stored body is already redacted — see `redact.ts`. */
export async function sendMessage(
  conversationId: string,
  userId: string,
  body: string,
  bookingId?: string | null
): Promise<SendOutcome> {
  const found = await membership(conversationId, userId);
  if (!found) return { ok: false, reason: "not-found" };

  const redaction = redactContacts(body.trim());

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        // What is stored, not what was typed. A detail recoverable from the row
        // later has not really been removed.
        body: redaction.text,
        wasRedacted: redaction.redacted,
        bookingId: bookingId ?? null,
      },
      select: { id: true, body: true, wasRedacted: true, createdAt: true, readAt: true },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return {
    ok: true,
    message: {
      id: message.id,
      body: message.body,
      mine: true,
      wasRedacted: message.wasRedacted,
      createdAt: message.createdAt.toISOString(),
      readAt: null,
    },
    notice: redactionNotice(redaction),
  };
}
