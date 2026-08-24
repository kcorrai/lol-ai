import { logger } from "@/lib/utils/logger";
import { getAiUsage } from "@/lib/ai/usage";

/**
 * A ceiling on what the model spend can reach before calls are refused.
 *
 * `docs/AI_ARCHITECTURE.md` §8.2 asks for hard caps and the product has only ever had one: the
 * per-user daily message limit on chat. Nothing bounded the total. A loop in a cron, a scraped
 * endpoint or a pricing change could run the bill up with no ceiling and nothing to notice it,
 * because until the usage ledger there was also nothing counting.
 *
 * Off unless configured. It is deliberately not defaulted to some number this repository invents —
 * a cap that refuses a paying customer's coaching report is not a thing to switch on by guess.
 */
export class AiBudgetExceededError extends Error {
  constructor(
    readonly period: "day" | "month",
    readonly spentUsd: number,
    readonly limitUsd: number
  ) {
    super(
      `AI ${period} budget exhausted: $${spentUsd.toFixed(2)} of $${limitUsd.toFixed(2)}. ` +
        `Raise AI_${period === "day" ? "DAILY" : "MONTHLY"}_BUDGET_USD or wait for the period to roll over.`
    );
    this.name = "AiBudgetExceededError";
  }
}

/**
 * Checking costs a Redis read, and a burst of calls would all read the same answer. Memoised for a
 * few seconds so the guard costs roughly one round trip per burst rather than one per call — the
 * same trade `metaStatsService` makes, and for the same reason.
 *
 * The window is short because being late to notice an exhausted budget by a few seconds is cheap,
 * and being late by a minute is not.
 */
const CHECK_MEMO_MS = 5_000;
let memo: { at: number; breach: AiBudgetExceededError | null } | null = null;

let warnedUnpriced = false;

function limitFor(period: "day" | "month"): number | null {
  const raw =
    period === "day" ? process.env.AI_DAILY_BUDGET_USD : process.env.AI_MONTHLY_BUDGET_USD;
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn(
      `[ai] AI_${period === "day" ? "DAILY" : "MONTHLY"}_BUDGET_USD is not a positive number; ignoring it`
    );
    return null;
  }
  return parsed;
}

async function findBreach(): Promise<AiBudgetExceededError | null> {
  const periods = (["day", "month"] as const).filter((p) => limitFor(p) !== null);
  if (periods.length === 0) return null;

  for (const period of periods) {
    const limit = limitFor(period)!;
    const { costUsd } = await getAiUsage(period);

    // A configured budget the ledger cannot price is a budget that is not being enforced. Say so
    // once rather than letting it read as "under budget" forever.
    if (costUsd === null) {
      if (!warnedUnpriced) {
        warnedUnpriced = true;
        logger.warn(
          "[ai] a budget is configured but no spend could be priced — AI_MODEL_PRICES is unset " +
            "or does not cover the models in use, so the budget is not being enforced"
        );
      }
      continue;
    }

    if (costUsd >= limit) return new AiBudgetExceededError(period, costUsd, limit);
  }

  return null;
}

/** Throws when a configured budget is exhausted. Resolves — cheaply — when none is configured. */
export async function assertWithinAiBudget(now = Date.now()): Promise<void> {
  if (memo && now - memo.at < CHECK_MEMO_MS) {
    if (memo.breach) throw memo.breach;
    return;
  }

  let breach: AiBudgetExceededError | null;
  try {
    breach = await findBreach();
  } catch (err) {
    // The guard failing open is the right direction: an unreachable ledger must not take the
    // product down, and the ceiling it protects is a cost ceiling, not a safety one.
    logger.warn("[ai] budget check could not run; allowing the call", err);
    return;
  }

  memo = { at: now, breach };
  if (breach) throw breach;
}

/** Test seam — the check is memoised and the unpriced warning fires once per process. */
export function __resetAiBudget(): void {
  memo = null;
  warnedUnpriced = false;
}
