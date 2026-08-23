import type { CreatorProfile } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { generateOverlayKey } from "@/domains/creator/overlayKey";
import { normaliseDelaySeconds } from "@/domains/creator/session";
import type { CreatorKit, CreatorSettings } from "@/domains/creator/types";

// The creator's own side of the Streamer Kit — everything here is reached with a
// session, unlike the overlay itself, which is reached with the key (ADR-026).

export type SaveResult = { ok: true; kit: CreatorKit } | { ok: false; reason: string };

function toKit(profile: CreatorProfile): CreatorKit {
  return {
    overlayKey: profile.overlayKey,
    enabled: profile.enabled,
    riotAccountId: profile.riotAccountId,
    displayName: profile.displayName,
    streamSafe: profile.streamSafe,
    delaySeconds: profile.delaySeconds,
    theme: profile.theme,
    accentColor: profile.accentColor,
    sessionStartedAt: profile.sessionStartedAt?.toISOString() ?? null,
    goalTier: profile.goalTier,
    goalDivision: profile.goalDivision,
    twitchHandle: profile.twitchHandle,
    kickHandle: profile.kickHandle,
    youtubeHandle: profile.youtubeHandle,
  };
}

export async function getKit(userId: string): Promise<CreatorKit | null> {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  return profile ? toKit(profile) : null;
}

/**
 * Turn the kit on, minting a key the first time.
 *
 * Idempotent: enabling twice returns the same key rather than a new one, because
 * a second click must not silently break the OBS source the first one produced.
 */
export async function enableKit(userId: string): Promise<CreatorKit> {
  const existing = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (existing) {
    if (existing.enabled) return toKit(existing);
    const reEnabled = await prisma.creatorProfile.update({
      where: { userId },
      data: { enabled: true },
    });
    return toKit(reEnabled);
  }

  const created = await prisma.creatorProfile.create({
    data: { userId, overlayKey: generateOverlayKey() },
  });
  return toKit(created);
}

/**
 * A goal is both halves or neither — a tier without a division cannot be placed
 * on the ladder, so the widget would have nothing to count toward.
 */
function goalIsWellFormed(settings: CreatorSettings): boolean {
  const hasTier = settings.goalTier !== null;
  const hasDivision = settings.goalDivision !== null;
  return hasTier === hasDivision;
}

export async function saveSettings(userId: string, settings: CreatorSettings): Promise<SaveResult> {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) return { ok: false, reason: "Creator mode is not enabled." };

  if (!goalIsWellFormed(settings)) {
    return { ok: false, reason: "A goal rank needs both a tier and a division." };
  }

  // A creator can only point the overlay at an account they own. Without this
  // check the kit would read anyone's rank onto their stream.
  if (settings.riotAccountId !== null) {
    const owned = await prisma.riotAccount.findFirst({
      where: { id: settings.riotAccountId, userId },
      select: { id: true },
    });
    if (!owned) return { ok: false, reason: "That Riot account is not linked to your profile." };
  }

  const updated = await prisma.creatorProfile.update({
    where: { userId },
    data: {
      enabled: settings.enabled,
      riotAccountId: settings.riotAccountId,
      displayName: settings.displayName,
      streamSafe: settings.streamSafe,
      delaySeconds: normaliseDelaySeconds(settings.delaySeconds),
      theme: settings.theme,
      accentColor: settings.accentColor,
      goalTier: settings.goalTier,
      goalDivision: settings.goalDivision,
      twitchHandle: settings.twitchHandle,
      kickHandle: settings.kickHandle,
      youtubeHandle: settings.youtubeHandle,
    },
  });

  return { ok: true, kit: toKit(updated) };
}

/**
 * Mint a new key and discard the old one.
 *
 * This breaks every OBS source and every chat command at once, since one key
 * covers both. The caller is expected to say so before offering the button.
 */
export async function rotateOverlayKey(userId: string): Promise<CreatorKit | null> {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const updated = await prisma.creatorProfile.update({
    where: { userId },
    data: { overlayKey: generateOverlayKey() },
  });
  return toKit(updated);
}

/**
 * Start a fresh session from now.
 *
 * Passing null clears it, which returns the session counters to "since local
 * midnight" — the default a creator who never touches this gets.
 */
export async function resetSession(
  userId: string,
  startAt: Date | null
): Promise<CreatorKit | null> {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const updated = await prisma.creatorProfile.update({
    where: { userId },
    data: { sessionStartedAt: startAt },
  });
  return toKit(updated);
}
