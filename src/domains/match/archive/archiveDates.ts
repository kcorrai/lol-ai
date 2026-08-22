/**
 * The date range facet, translated between the two things that disagree about what a date is:
 * `<input type="date">` speaks `yyyy-mm-dd` in the player's own timezone, the API speaks ISO with
 * an offset, and `gameStart` is an instant.
 */

/** ISO instant → the `yyyy-mm-dd` the input expects, in local time. */
export function toDateInput(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * `yyyy-mm-dd` → ISO instant, with the `to` edge widened to the last millisecond of that day.
 *
 * `gameStart <= 2026-08-19T00:00` excludes every game played on the 19th, which is not what anyone
 * means by picking the 19th as the end of a range. The widening happens here rather than server-side
 * because the server is given an instant and cannot know which day the player was in — local
 * midnight is the boundary they saw on the calendar.
 */
export function fromDateInput(value: string, edge: "start" | "end"): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const date =
    edge === "start"
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
