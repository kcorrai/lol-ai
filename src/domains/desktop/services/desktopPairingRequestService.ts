import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type {
  DesktopAccount,
  DesktopDeviceSummary,
  DesktopPlatform,
  OpenedPairingRequest,
  PairingRequestInput,
  PendingPairingRequest,
} from "@/domains/desktop/contract";
import { generateDeviceToken } from "@/domains/desktop/deviceToken";
import {
  MAX_DEVICES_PER_USER,
  getDeviceAccount,
  toDeviceSummary,
} from "@/domains/desktop/services/desktopPairingService";

// Pairing without a code (ADR-048).
//
// The app asks to be paired, the player's browser approves it, and the app claims
// the token it was granted. The same decision the code flow reaches, from the other
// direction — and the reason for a second way is that both ends are on one machine,
// so the app can open the browser itself instead of asking a person to carry eight
// characters between them.
//
// The rules that make it safe are all here: what the secret is for, what the id is
// deliberately not enough for, and the refusal to tell a poller anything it did not
// already know.

/** The same ten minutes a pairing code gets, for the same reason: it is a live window. */
export const REQUEST_TTL_MS = 10 * 60 * 1000;

/** Where the browser is sent to decide. A path, never a URL — see the contract. */
export function approvePathFor(requestId: string): string {
  return `/settings/desktop/approve?request=${encodeURIComponent(requestId)}`;
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export type ApproveResult =
  | { ok: true; device: DesktopDeviceSummary }
  | { ok: false; reason: "not_found" | "expired" | "already_decided" | "too_many_devices" };

export type ClaimResult =
  | { ok: true; token: string; device: DesktopDeviceSummary; account: DesktopAccount }
  /** Nobody has approved it yet. The app keeps asking. */
  | { ok: false; reason: "pending" }
  /** Unknown, expired, already claimed, or the wrong secret — all one answer. */
  | { ok: false; reason: "invalid" };

/**
 * Record a machine asking to be paired.
 *
 * Unauthenticated, and deliberately so: at this point the request asserts nothing. It
 * is a row saying "a machine calling itself this asked at this time", and it is worth
 * nothing at all until somebody signed in says yes to it.
 *
 * The label and platform are the machine's own account of itself and are never treated
 * as more than that. They are shown to the player, who is the one deciding.
 */
export async function openPairingRequest(
  input: PairingRequestInput,
  now: Date = new Date()
): Promise<OpenedPairingRequest> {
  const expiresAt = new Date(now.getTime() + REQUEST_TTL_MS);

  const created = await prisma.desktopPairingRequest.create({
    data: {
      secretHash: input.secretHash,
      label: input.label.trim().slice(0, 64),
      platform: input.platform,
      appVersion: input.appVersion ?? null,
      expiresAt,
    },
  });

  return {
    requestId: created.id,
    approvePath: approvePathFor(created.id),
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * What the approval page draws.
 *
 * Readable by any signed-in player holding the id, which is the right scope: the id
 * reaches a browser only because this machine's app put it there, and the page shows
 * nothing that is not already on the screen of the computer that asked. It carries no
 * authority either way — approving is a separate, explicit POST.
 */
export async function getPairingRequest(
  requestId: string,
  now: Date = new Date()
): Promise<PendingPairingRequest | null> {
  const request = await prisma.desktopPairingRequest.findUnique({ where: { id: requestId } });
  if (!request) return null;

  const status =
    request.approvedAt !== null ? "approved" : request.expiresAt <= now ? "expired" : "pending";

  return {
    requestId: request.id,
    label: request.label,
    platform: request.platform as DesktopPlatform,
    appVersion: request.appVersion,
    requestedAt: request.createdAt.toISOString(),
    expiresAt: request.expiresAt.toISOString(),
    status,
  };
}

/**
 * The player says yes.
 *
 * Where the device is minted, in the same shape and under the same limit as redeeming
 * a code: approval and redemption are two routes to one decision, and they must not
 * disagree about what a paired machine is.
 *
 * The approval is a conditional update rather than a read followed by a write, so two
 * browser tabs pressing Approve produce one device instead of two.
 */
export async function approvePairingRequest(
  userId: string,
  requestId: string,
  now: Date = new Date()
): Promise<ApproveResult> {
  const request = await prisma.desktopPairingRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, reason: "not_found" };
  if (request.approvedAt !== null) return { ok: false, reason: "already_decided" };
  if (request.expiresAt <= now) return { ok: false, reason: "expired" };

  const active = await prisma.desktopDevice.count({ where: { userId, revokedAt: null } });
  if (active >= MAX_DEVICES_PER_USER) return { ok: false, reason: "too_many_devices" };

  const device = await prisma.$transaction(async (tx) => {
    const won = await tx.desktopPairingRequest.updateMany({
      where: { id: request.id, approvedAt: null, expiresAt: { gt: now } },
      data: { approvedAt: now, userId },
    });
    if (won.count === 0) return null;

    const created = await tx.desktopDevice.create({
      data: {
        userId,
        token: generateDeviceToken(),
        label: request.label,
        platform: request.platform,
        appVersion: request.appVersion,
      },
    });
    await tx.desktopPairingRequest.update({
      where: { id: request.id },
      data: { deviceId: created.id },
    });
    return created;
  });

  if (!device) return { ok: false, reason: "already_decided" };
  return { ok: true, device: toDeviceSummary(device) };
}

/**
 * The app takes the token it was granted.
 *
 * **The secret is the claim; the id is not.** The id travels in a URL — address bar,
 * history, referrer — so anything readable off a screen must not be enough on its own.
 * The comparison is constant-time: a hash compared with a plain equality leaks its
 * prefix to anyone willing to measure.
 *
 * `pending` is the only failure told apart from the rest, and only because the app has
 * to know whether to keep asking — and only after it has proved it holds the secret.
 * Unknown, expired, already claimed and wrong secret are one answer, so a caller
 * holding an id learns nothing about it that it did not already know.
 */
export async function claimPairingRequest(
  requestId: string,
  secret: string,
  now: Date = new Date()
): Promise<ClaimResult> {
  const request = await prisma.desktopPairingRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, reason: "invalid" };

  const offered = Buffer.from(hashSecret(secret), "hex");
  const stored = Buffer.from(request.secretHash, "hex");
  if (offered.length !== stored.length || !timingSafeEqual(offered, stored)) {
    return { ok: false, reason: "invalid" };
  }

  if (request.claimedAt !== null) return { ok: false, reason: "invalid" };
  if (request.approvedAt === null) {
    // Expiry answers "invalid" rather than "pending" so the app stops asking.
    return request.expiresAt <= now
      ? { ok: false, reason: "invalid" }
      : { ok: false, reason: "pending" };
  }
  if (!request.deviceId) return { ok: false, reason: "invalid" };

  // Single use, decided by the update rather than by the read above it.
  const taken = await prisma.desktopPairingRequest.updateMany({
    where: { id: request.id, claimedAt: null },
    data: { claimedAt: now },
  });
  if (taken.count === 0) return { ok: false, reason: "invalid" };

  const device = await prisma.desktopDevice.findUnique({ where: { id: request.deviceId } });
  // Revoked between approving and claiming is a real sequence: the player can open
  // their device list and change their mind in the seconds the app spends polling.
  if (!device || device.revokedAt !== null) return { ok: false, reason: "invalid" };

  const account = await getDeviceAccount(device);
  if (!account) return { ok: false, reason: "invalid" };

  return { ok: true, token: device.token, device: toDeviceSummary(device), account };
}
