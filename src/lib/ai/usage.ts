import { redisCacheHashIncrBy, redisCacheHashGetAll } from "@/lib/cache/redisCache";
import { estimateCostUsd } from "@/lib/ai/pricing";
import type { AiTask } from "@/lib/ai/taskTiers";

/**
 * What every model call cost, counted per day and per month.
 *
 * `docs/AI_ARCHITECTURE.md` §8.3 has always specified a daily cost aggregate and an admin view of
 * it, and the diagram in §2 shows the AI client doing "cost tracking". Neither existed: of eleven
 * call sites exactly one — the coaching pipeline — wrote anything down, so ten features spent
 * money that nothing counted. Every other decision about the AI bill was a guess.
 *
 * Counters live in Redis, not Postgres, for the reason ADR-014 gives for the AI cache: this is
 * regenerable telemetry, one write per model call, on a database billed by transfer. Putting it in
 * Postgres would mean a row per call in the exact table this project spent three tasks emptying.
 *
 * Cost is money only when `AI_MODEL_PRICES` is configured (see pricing.ts). Tokens are counted
 * either way, and they are the number that cannot be wrong.
 */

const DAY_TTL_SECONDS = 45 * 24 * 60 * 60;
const MONTH_TTL_SECONDS = 400 * 24 * 60 * 60;

/** Money is counted in micro-dollars because Redis counters are integers. */
const MICROS_PER_USD = 1_000_000;

export interface AiUsageRecord {
  task: AiTask;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface AiUsageSummary {
  /** Total spend for the period, or null when no call in it had a configured price. */
  costUsd: number | null;
  promptTokens: number;
  completionTokens: number;
  calls: number;
  /** Per task: what it called, how much it used, and what that cost where a price was known. */
  byTask: Record<string, { calls: number; promptTokens: number; completionTokens: number }>;
}

function dayKey(now: Date): string {
  return `ai:usage:${now.toISOString().slice(0, 10)}`;
}

function monthKey(now: Date): string {
  return `ai:usage:${now.toISOString().slice(0, 7)}`;
}

/**
 * Records one call. Never throws and never blocks the caller's result — a lost counter is a
 * reporting gap, and failing a coaching report to protect a statistic would be the wrong trade.
 */
export async function recordAiUsage(record: AiUsageRecord, now = new Date()): Promise<void> {
  const { task, model, promptTokens, completionTokens } = record;
  const costUsd = estimateCostUsd(model, promptTokens, completionTokens);

  const fields: Record<string, number> = {
    calls: 1,
    promptTokens,
    completionTokens,
    [`calls:${task}`]: 1,
    [`promptTokens:${task}`]: promptTokens,
    [`completionTokens:${task}`]: completionTokens,
    [`calls:model:${model}`]: 1,
  };
  if (costUsd !== null) fields.costMicros = Math.round(costUsd * MICROS_PER_USD);

  try {
    await Promise.all([
      redisCacheHashIncrBy(dayKey(now), fields, DAY_TTL_SECONDS),
      redisCacheHashIncrBy(monthKey(now), fields, MONTH_TTL_SECONDS),
    ]);
  } catch {
    // `redisCacheHashIncrBy` already swallows its own failures, so reaching here means something
    // unforeseen. Swallowing it too is still right: the caller has a finished model response in
    // hand, and losing the statistic is strictly better than losing that.
  }
}

function summarise(counters: Record<string, number>): AiUsageSummary {
  const byTask: AiUsageSummary["byTask"] = {};

  for (const [field, value] of Object.entries(counters)) {
    const [metric, ...rest] = field.split(":");
    if (rest.length !== 1 || rest[0] === "model") continue;
    const task = rest[0];
    byTask[task] ??= { calls: 0, promptTokens: 0, completionTokens: 0 };
    if (metric === "calls") byTask[task].calls = value;
    if (metric === "promptTokens") byTask[task].promptTokens = value;
    if (metric === "completionTokens") byTask[task].completionTokens = value;
  }

  return {
    // Absent rather than zero: no priced call was recorded, which is not the same as free.
    costUsd: counters.costMicros === undefined ? null : counters.costMicros / MICROS_PER_USD,
    promptTokens: counters.promptTokens ?? 0,
    completionTokens: counters.completionTokens ?? 0,
    calls: counters.calls ?? 0,
    byTask,
  };
}

export async function getAiUsage(
  period: "day" | "month",
  now = new Date()
): Promise<AiUsageSummary> {
  const key = period === "day" ? dayKey(now) : monthKey(now);
  return summarise(await redisCacheHashGetAll(key));
}
