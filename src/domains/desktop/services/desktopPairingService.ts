import type { DesktopDevice, RiotAccount } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  DesktopAccount,
  DesktopDeviceSummary,
  DesktopPlatform,
  IssuedPairingCode,
} from "@/domains/desktop/contract";
import { generateDeviceToken } from "@/domains/desktop/deviceToken";
import {
  CODE_TTL_MS,
  generatePairingCode,
  isPairingCodeFormat,
  normalisePairingCode,
} from "@/domains/desktop/pairingCode";

// Pairing, end to end (ADR-038).
//
// The player is signed in on the website and asks for a code; the desktop app,
// which has no session and never will, exchanges that code once for a token.
// Everything that makes a short code safe lives here rather than in the code
// module: expiry, single use, one live code per account, and the refusal to say
// which of those a rejected code failed.

/** How many machines one account may have paired at once. */
export const MAX_DEVICES_PER_USER = 10;

export type RedeemResult =
  | { ok: true; token: string; device: DesktopDeviceSummary; account: DesktopAccount }
  | { ok: false; reason: "invalid" | "too_many_devices" };

function toSummary(device: DesktopDevice): DesktopDeviceSummary {
  return {
    id: device.id,
    label: device.label,
    // Stored as a plain string so an unrecognised platform from a future client
    // is kept rather than refused. The route validates on the way in, so anything
    // already in the column came through that check.
    platform: device.platform as DesktopPlatform,
    appVersion: device.appVersion,
    createdAt: device.createdAt.toISOString(),
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    revokedAt: device.revokedAt?.toISOString() ?? null,
  };
}

function toAccount(
  user: {
    id: string;
    email: string | null;
    name: string | null;
    emailVerified: Date | null;
  },
  riot: RiotAccount | null
): DesktopAccount {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    riotAccount: riot
      ? {
          id: riot.id,
          gameName: riot.gameName,
          tagLine: riot.tagLine,
          region: riot.region,
          summonerLevel: riot.summonerLevel,
          profileIconId: riot.profileIconId,
        }
      : null,
  };
}

/**
 * The account the desktop app reads for everything personal: the primary linked
 * Riot account, or the oldest one when nothing is marked primary.
 */
async function primaryRiotAccount(userId: string): Promise<RiotAccount | null> {
  return prisma.riotAccount.findFirst({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Mint a code for a signed-in player.
 *
 * Issuing expires whatever was outstanding. Two live codes would mean a code
 * read off a screen an hour ago still works, which is the window the short
 * expiry exists to close — and a player who asks again has, by asking, said the
 * first one is not the one they are looking at.
 */
export async function issuePairingCode(
  userId: string,
  now: Date = new Date()
): Promise<IssuedPairingCode> {
  await prisma.desktopPairingCode.updateMany({
    where: { userId, consumedAt: null, expiresAt: { gt: now } },
    data: { expiresAt: now },
  });

  const code = generatePairingCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);
  await prisma.desktopPairingCode.create({ data: { userId, code, expiresAt } });

  return { code, expiresAt: expiresAt.toISOString() };
}

/**
 * Exchange a code for a device token. The only call that ever returns a token.
 *
 * Every failure that is about the code — unknown, expired, already used — answers
 * the same `invalid`. Telling them apart would let someone guessing codes learn
 * that a guess hit a real account, which on a ~39-bit code is the one piece of
 * feedback worth denying them.
 */
export async function redeemPairingCode(
  input: { code: string; label: string; platform: DesktopPlatform; appVersion?: string | null },
  now: Date = new Date()
): Promise<RedeemResult> {
  const code = normalisePairingCode(input.code);
  if (!isPairingCodeFormat(code)) return { ok: false, reason: "invalid" };

  const pending = await prisma.desktopPairingCode.findUnique({ where: { code } });
  if (!pending || pending.consumedAt !== null || pending.expiresAt <= now) {
    return { ok: false, reason: "invalid" };
  }

  const active = await prisma.desktopDevice.count({
    where: { userId: pending.userId, revokedAt: null },
  });
  if (active >= MAX_DEVICES_PER_USER) return { ok: false, reason: "too_many_devices" };

  const token = generateDeviceToken();

  // One transaction, and the code is consumed by a conditional update rather than
  // by a read followed by a write. Two apps racing the same code both pass the
  // check above; only one of them matches `consumedAt: null` here.
  const paired = await prisma.$transaction(async (tx) => {
    const claimed = await tx.desktopPairingCode.updateMany({
      where: { id: pending.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (claimed.count === 0) return null;

    const device = await tx.desktopDevice.create({
      data: {
        userId: pending.userId,
        token,
        label: input.label.trim().slice(0, 64),
        platform: input.platform,
        appVersion: input.appVersion ?? null,
      },
    });
    await tx.desktopPairingCode.update({
      where: { id: pending.id },
      data: { deviceId: device.id },
    });
    return device;
  });

  if (!paired) return { ok: false, reason: "invalid" };

  const user = await prisma.user.findUnique({
    where: { id: pending.userId },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  // The foreign key makes this unreachable short of the account being deleted
  // mid-exchange. `invalid` is the honest answer: there is no account left to
  // pair with.
  if (!user) return { ok: false, reason: "invalid" };

  return {
    ok: true,
    token,
    device: toSummary(paired),
    account: toAccount(user, await primaryRiotAccount(user.id)),
  };
}

/**
 * Resolve a bearer token to the device presenting it.
 *
 * `lastSeenAt` is written here, on the read path, because that is the only place
 * the device speaks. Deliberately not awaited into the request it rode in on — a
 * failed touch must not turn an otherwise good request into an error.
 */
export async function authenticateDevice(
  token: string,
  now: Date = new Date()
): Promise<{ device: DesktopDevice } | null> {
  const device = await prisma.desktopDevice.findUnique({ where: { token } });
  if (!device || device.revokedAt !== null) return null;

  void prisma.desktopDevice
    .update({ where: { id: device.id }, data: { lastSeenAt: now } })
    .catch(() => undefined);

  return { device };
}

/** Who a paired machine is acting as. */
export async function getDeviceAccount(device: DesktopDevice): Promise<DesktopAccount | null> {
  const user = await prisma.user.findUnique({
    where: { id: device.userId },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!user) return null;
  return toAccount(user, await primaryRiotAccount(user.id));
}

/** Every machine this account has ever paired, revoked ones included. */
export async function listDevices(userId: string): Promise<DesktopDeviceSummary[]> {
  const devices = await prisma.desktopDevice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return devices.map(toSummary);
}

/**
 * Cut a machine off.
 *
 * Scoped by `userId` in the same query rather than fetched and then checked, so a
 * device id belonging to someone else is a miss instead of a leak: the caller
 * cannot tell "not yours" from "does not exist".
 */
export async function revokeDevice(
  userId: string,
  deviceId: string,
  now: Date = new Date()
): Promise<boolean> {
  const revoked = await prisma.desktopDevice.updateMany({
    where: { id: deviceId, userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return revoked.count > 0;
}

export { toSummary as toDeviceSummary };
