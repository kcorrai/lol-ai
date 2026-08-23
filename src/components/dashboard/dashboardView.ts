import { FetchError } from "@/lib/api/fetcher";

export type DashboardView = "loading" | "no-account" | "ready";

export type SyncErrorKind = "account" | "upstream";

/**
 * Which failure the dashboard is looking at, so the banner can say something true.
 *
 * 401 and 403 come from our own ownership check and mean the request named an account
 * this user cannot read — Riot was never contacted. Everything else (5xx, a dropped
 * connection, a parse failure) is the upstream case the "Riot is down" copy describes.
 * Anything unrecognised is treated as upstream: an outage message on a client-side fault
 * is a smaller lie than telling a player to reconnect a perfectly good account.
 */
export function classifySyncError(error: unknown): SyncErrorKind {
  const status = error instanceof FetchError ? error.statusCode : undefined;
  return status === 401 || status === 403 ? "account" : "upstream";
}

/**
 * Decides what the dashboard renders before any match data is considered.
 *
 * Cached accounts win over the loading flag so a background refetch never flips a populated
 * dashboard back to the skeleton — and, more importantly, an empty account list is a real
 * state to be shown, not a slow one to be waited on.
 */
export function resolveDashboardView(
  accountsLoading: boolean,
  accountCount: number
): DashboardView {
  if (accountCount > 0) return "ready";
  return accountsLoading ? "loading" : "no-account";
}
