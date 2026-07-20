export const TOTAL_CHAMPION_LEVELS = 18;

// A champion spends 18 points: 5 each into Q/W/E and 3 into R, the ultimate unlocking at 6/11/16.
const MAX_POINTS: Record<string, number> = { Q: 5, W: 5, E: 5, R: 3 };
const BASIC_ABILITIES = ["Q", "W", "E"] as const;
const ULTIMATE_LEVELS = [6, 11, 16];

/**
 * op.gg's `skills[].order` stops at level 15, but players keep levelling to 18. The missing tail
 * is not a matter of taste — it is whatever points the levelling rules leave over: the third R at
 * 16, then the basic abilities that haven't reached 5 points yet.
 *
 * Idempotent, so it is safe to apply again at render time on a build that came from cache before
 * this completion existed.
 *
 * @param order   the levelling order as far as the data source provides it
 * @param maxOrder the champion's max priority (e.g. ["Q","E","W"]), used to decide which of the
 *                 leftover basic points comes first
 */
export function completeSkillOrder(order: string[], maxOrder: string[] = []): string[] {
  if (order.length === 0 || order.length >= TOTAL_CHAMPION_LEVELS) return order;

  const result = [...order];
  const remaining: Record<string, number> = { ...MAX_POINTS };
  for (const ability of result) {
    if (remaining[ability] !== undefined) remaining[ability] -= 1;
  }

  // Prefer the champion's own max order for the leftover basics; Q/W/E is the fallback so an
  // absent or partial max order can't leave a point unassigned.
  const basicPriority = [
    ...maxOrder.filter((a): a is string => a in remaining && a !== "R"),
    ...BASIC_ABILITIES,
  ];

  while (result.length < TOTAL_CHAMPION_LEVELS) {
    const level = result.length + 1;
    const next =
      ULTIMATE_LEVELS.includes(level) && remaining.R > 0
        ? "R"
        : basicPriority.find((a) => remaining[a] > 0);

    // Data that doesn't fit the standard levelling model (a transforming champion, say) is left
    // as-is rather than padded with invented points.
    if (!next) break;

    remaining[next] -= 1;
    result.push(next);
  }

  return result;
}
