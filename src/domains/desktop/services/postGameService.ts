import type { DesktopDevice } from "@prisma/client";
import { runSyncWithStatus } from "@/domains/riot";
import { prisma } from "@/lib/db/prisma";
import { dispatchOrRunInProcess } from "@/lib/inngest/dispatch";
import type { MatchSyncPayload } from "@/inngest/functions/matchSync";

// Pulling the game in the moment it ends (ADR-038, phase 5).
//
// The website syncs an account when somebody opens the dashboard and the data is half an
// hour stale. That is the best a server can do: nothing on it knows a game has finished.
// The process on the player's machine does know, to the second, and this is the one thing
// it can tell the website that the website could not have worked out.

/**
 * A sync already running is left alone unless it started long enough ago to be stuck.
 * Same window the web route uses, and for the same reason: a run that died, or an Inngest
 * event that was never processed, would otherwise wedge the account for ever.
 */
const STUCK_AFTER_MS = 5 * 60 * 1000;

export type PostGameResult =
  /** A sync was requested for this device's account. */
  | { status: "pending"; riotAccountId: string }
  /** One was already running and had not been running long enough to be stuck. */
  | { status: "already_running"; riotAccountId: string }
  /** The account behind this device has no Riot account to sync. */
  | { status: "no_riot_account" };

/**
 * Ask for this device's account to be pulled from Riot.
 *
 * The account is read from the device row rather than taken from the request, and that is
 * the property that makes this endpoint safe to put behind a device token. `withDeviceAuth`
 * carries the rule that a stolen token must not do anything worth stealing it for; a stolen
 * token here can cause the owner's own matches to be fetched slightly sooner than they
 * would have been, and cannot name a different account to fetch.
 */
export async function requestPostGameSync(
  device: DesktopDevice,
  now: Date = new Date()
): Promise<PostGameResult> {
  const account = await prisma.riotAccount.findFirst({
    where: { userId: device.userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { id: true, syncStatus: true, syncStartedAt: true },
  });
  // A machine can be paired before an account is linked. A real state with a fix the app
  // can name, so it is reported rather than raised.
  if (!account) return { status: "no_riot_account" };

  const inProgress = account.syncStatus === "RUNNING" || account.syncStatus === "PENDING";
  const startedMs = account.syncStartedAt?.getTime() ?? 0;
  if (inProgress && now.getTime() - startedMs <= STUCK_AFTER_MS) {
    // Two clients can report the same game ending — the app and a dashboard left open —
    // and the second must not start a duplicate pull of the same matches.
    return { status: "already_running", riotAccountId: account.id };
  }

  await prisma.riotAccount.update({
    where: { id: account.id },
    data: { syncStatus: "PENDING", syncStartedAt: now, lastSyncError: null },
  });

  // Durable through Inngest where it is reachable, in-process where it is not — the same
  // path the website's own sync button takes, so a game reported by the app and one
  // reported by a browser are pulled by exactly the same code.
  await dispatchOrRunInProcess(
    {
      name: "riot/sync.requested",
      data: { riotAccountId: account.id, userId: device.userId } satisfies MatchSyncPayload,
    },
    () => runSyncWithStatus(account.id, device.userId)
  );

  return { status: "pending", riotAccountId: account.id };
}
