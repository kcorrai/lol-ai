import { createTestPrisma, readStateFile } from "./db";
import { STATE_FILE } from "./constants";

// Shared setup for the two Streamer Kit specs (LA-25). They are split because
// the dashboard side needs a session and the OBS side must not have one, but
// both drive the same rows, and a key minted by one must not decide what the
// other sees.

export const creatorPrisma = createTestPrisma();
export const creatorState = readStateFile(STATE_FILE);

/**
 * A fixed key of the right shape, so no test depends on one another test minted.
 * 22 base64url characters, which is what `isOverlayKeyFormat` demands.
 */
export const OVERLAY_KEY = "e2eOverlayKey0000000AB";

export function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

/**
 * Put the kit into a known state.
 *
 * Called from each describe's own `beforeAll` rather than once per file, because
 * two of the cases (turning the kit on, rolling the key) replace the key on
 * purpose and the ones after them must not inherit that.
 */
export async function resetKit(
  overrides: { delaySeconds?: number; streamSafe?: boolean; goal?: boolean } = {}
): Promise<void> {
  await creatorPrisma.creatorProfile.deleteMany({ where: { userId: creatorState.userId } });
  await creatorPrisma.creatorProfile.create({
    data: {
      userId: creatorState.userId,
      overlayKey: OVERLAY_KEY,
      enabled: true,
      delaySeconds: overrides.delaySeconds ?? 0,
      streamSafe: overrides.streamSafe ?? false,
      goalTier: overrides.goal ? "EMERALD" : null,
      goalDivision: overrides.goal ? "I" : null,
    },
  });
}

/**
 * Undo what polling an overlay does to the account behind it.
 *
 * Every overlay poll asks for a sync if the account is stale, and under E2E the
 * sync itself cannot run — there is no Riot key — so it leaves the account
 * `FAILED` with an error string. That is the endpoint working as designed, but
 * it is state a later spec would inherit, and a spec that reads the dashboard
 * would meet a sync-error banner nothing in it caused.
 */
export async function restoreSyncState(): Promise<void> {
  await creatorPrisma.riotAccount.update({
    where: { id: creatorState.riotAccountId },
    data: {
      syncStatus: "IDLE",
      syncStartedAt: null,
      lastSyncError: null,
      lastSyncedAt: null,
    },
  });
}

/**
 * Two snapshots either side of the session boundary: Emerald III 40 LP recorded
 * yesterday, Emerald II 55 LP recorded ten minutes ago. That is one division and
 * 15 LP apart, so every "this session" figure below is +115.
 */
export async function seedRankedHistory(): Promise<void> {
  await creatorPrisma.rankedHistory.deleteMany({
    where: { riotAccountId: creatorState.riotAccountId },
  });
  await creatorPrisma.rankedHistory.createMany({
    data: [
      {
        riotAccountId: creatorState.riotAccountId,
        queueType: "RANKED_SOLO_5x5",
        tier: "EMERALD",
        division: "III",
        lp: 40,
        wins: 60,
        losses: 55,
        recordedAt: minutesAgo(26 * 60),
      },
      {
        riotAccountId: creatorState.riotAccountId,
        queueType: "RANKED_SOLO_5x5",
        tier: "EMERALD",
        division: "II",
        lp: 55,
        wins: 63,
        losses: 56,
        recordedAt: minutesAgo(10),
      },
    ],
  });
}
