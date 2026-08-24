import { logger } from "@/lib/utils/logger";

/**
 * What a model costs, per million tokens.
 *
 * **There is deliberately no built-in price table.** Model prices are not a fact this repository
 * can know — they change, they differ per provider and per plan, and a stale constant compiled
 * into the build would report confident, wrong numbers on the one dashboard whose entire job is to
 * be trusted. So prices are configuration: set `AI_MODEL_PRICES` and the ledger reports money;
 * leave it unset and the ledger still counts every token, which is the part that cannot be wrong.
 *
 * Format — USD per 1M tokens, keyed by the model id the provider returns:
 *
 *   AI_MODEL_PRICES={"gpt-4o":{"in":2.5,"out":10},"gpt-4o-mini":{"in":0.15,"out":0.6}}
 *
 * Keys are matched longest-prefix-first, so a dated snapshot id (`gpt-4o-2024-08-06`) is covered
 * by the `gpt-4o` entry without listing every snapshot.
 */
export interface ModelPrice {
  /** USD per 1M input tokens. */
  in: number;
  /** USD per 1M output tokens. */
  out: number;
}

let parsed: Record<string, ModelPrice> | null = null;
let parseFailed = false;

function priceTable(): Record<string, ModelPrice> {
  if (parsed) return parsed;
  if (parseFailed) return {};

  const raw = process.env.AI_MODEL_PRICES;
  if (!raw) {
    parseFailed = true;
    return {};
  }

  try {
    const table = JSON.parse(raw) as Record<string, ModelPrice>;
    for (const [model, price] of Object.entries(table)) {
      if (typeof price?.in !== "number" || typeof price?.out !== "number") {
        throw new Error(`entry "${model}" needs numeric "in" and "out"`);
      }
    }
    parsed = table;
    return table;
  } catch (err) {
    // A bad price table must not stop anything calling a model. Report tokens, drop the money.
    parseFailed = true;
    logger.warn("[ai] AI_MODEL_PRICES could not be read; usage will be recorded without cost", err);
    return {};
  }
}

/**
 * Cost of one call in USD, or `null` when the model has no configured price.
 *
 * `null` is not zero and is not rounded to zero anywhere downstream — an unpriced model shows as
 * unpriced, so a spend figure is never quietly missing a model nobody added to the table.
 */
export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number
): number | null {
  const table = priceTable();

  // Longest prefix wins, so "gpt-4o-mini" is not matched by a "gpt-4o" entry.
  const key = Object.keys(table)
    .filter((k) => model === k || model.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  if (!key) return null;

  const price = table[key];
  return (promptTokens / 1_000_000) * price.in + (completionTokens / 1_000_000) * price.out;
}

/** Test seam — the table is parsed once per process. */
export function __resetPricing(): void {
  parsed = null;
  parseFailed = false;
}
