export type DashboardView = "loading" | "no-account" | "ready";

/**
 * Decides what the dashboard renders before any match data is considered.
 *
 * Cached accounts win over the loading flag so a background refetch never flips a populated
 * dashboard back to the skeleton — and, more importantly, an empty account list is a real
 * state to be shown, not a slow one to be waited on.
 */
export function resolveDashboardView(
  accountsLoading: boolean,
  accountCount: number,
): DashboardView {
  if (accountCount > 0) return "ready";
  return accountsLoading ? "loading" : "no-account";
}
