interface AccountRef {
  id: string;
}

/**
 * The Riot account the app should actually read, given what the switcher persisted.
 *
 * `activeRiotAccountId` lives in localStorage and outlives the account it names — a
 * re-seeded database is enough to leave a dangling id behind. Letting it win over the
 * real list pointed every request at an account the signed-in user no longer owns, and
 * the 403 our own ownership check returned was then shown to the player as a Riot
 * outage. An id that matches nothing is treated as no selection at all.
 */
export function resolveActiveAccountId(
  accounts: AccountRef[] | undefined,
  activeId: string | null | undefined,
): string | null {
  if (!accounts || accounts.length === 0) return null;
  if (activeId && accounts.some((a) => a.id === activeId)) return activeId;
  return accounts[0].id;
}

/**
 * True when the persisted selection names an account that is not in the list any more.
 * Distinct from "nothing selected yet", because only this case needs overwriting.
 */
export function isStaleActiveAccountId(
  accounts: AccountRef[] | undefined,
  activeId: string | null | undefined,
): boolean {
  if (!activeId) return false;
  if (!accounts || accounts.length === 0) return false;
  return !accounts.some((a) => a.id === activeId);
}
