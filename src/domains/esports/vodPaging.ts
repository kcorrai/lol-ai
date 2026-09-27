/** How many series one step of the VOD archive shows. */
export const VOD_PAGE_SIZE = 40;

/**
 * How many series to show for a `?show=` value: one page by default, and a
 * whole number of pages when "Show more" asked for more — never past the end.
 * Anything unreadable falls back to one page rather than to everything.
 */
export function shownCount(show: string | undefined, total: number): number {
  const asked = Number.parseInt(show ?? "", 10);
  if (!Number.isFinite(asked) || asked <= VOD_PAGE_SIZE) return Math.min(VOD_PAGE_SIZE, total);
  return Math.min(Math.ceil(asked / VOD_PAGE_SIZE) * VOD_PAGE_SIZE, total);
}
