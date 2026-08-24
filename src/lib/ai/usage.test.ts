import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/cache/redisCache", () => ({
  redisCacheHashIncrBy: vi.fn(),
  redisCacheHashGetAll: vi.fn(),
}));

import { recordAiUsage, getAiUsage } from "./usage";
import { __resetPricing } from "./pricing";
import { redisCacheHashIncrBy, redisCacheHashGetAll } from "@/lib/cache/redisCache";

const incr = vi.mocked(redisCacheHashIncrBy);
const getAll = vi.mocked(redisCacheHashGetAll);
const ORIGINAL = { ...process.env };
const NOW = new Date("2026-08-24T12:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  __resetPricing();
  incr.mockResolvedValue(true);
  getAll.mockResolvedValue({});
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetPricing();
});

describe("recordAiUsage", () => {
  it("counts the same call into the day and the month", async () => {
    await recordAiUsage(
      { task: "coach-chat", model: "gpt-4o", promptTokens: 800, completionTokens: 200 },
      NOW
    );

    expect(incr.mock.calls.map((c) => c[0])).toEqual(["ai:usage:2026-08-24", "ai:usage:2026-08"]);
  });

  it("attributes tokens to the task, not just the total", async () => {
    await recordAiUsage(
      { task: "coach-chat", model: "gpt-4o", promptTokens: 800, completionTokens: 200 },
      NOW
    );

    expect(incr.mock.calls[0][1]).toMatchObject({
      calls: 1,
      promptTokens: 800,
      completionTokens: 200,
      "calls:coach-chat": 1,
      "promptTokens:coach-chat": 800,
      "completionTokens:coach-chat": 200,
      "calls:model:gpt-4o": 1,
    });
  });

  /**
   * The token counts are the part that cannot be wrong, so they are recorded whether or not
   * anybody has configured prices. Money is the optional half.
   */
  it("records tokens but no cost when the model has no configured price", async () => {
    delete process.env.AI_MODEL_PRICES;

    await recordAiUsage(
      { task: "tilt-message", model: "gpt-4o-mini", promptTokens: 100, completionTokens: 50 },
      NOW
    );

    expect(incr.mock.calls[0][1]).not.toHaveProperty("costMicros");
    expect(incr.mock.calls[0][1]).toMatchObject({ promptTokens: 100 });
  });

  it("records cost in micro-dollars when a price is configured", async () => {
    process.env.AI_MODEL_PRICES = JSON.stringify({ "gpt-4o": { in: 2, out: 10 } });

    await recordAiUsage(
      { task: "coach-chat", model: "gpt-4o", promptTokens: 1_000_000, completionTokens: 0 },
      NOW
    );

    expect(incr.mock.calls[0][1]).toMatchObject({ costMicros: 2_000_000 });
  });

  /** A lost counter is a reporting gap. Failing a coaching report to protect a statistic is not. */
  it("does not throw when the counter store is unreachable", async () => {
    incr.mockRejectedValue(new Error("redis down"));

    await expect(
      recordAiUsage(
        { task: "coach-chat", model: "gpt-4o", promptTokens: 1, completionTokens: 1 },
        NOW
      )
    ).resolves.toBeUndefined();
  });
});

describe("getAiUsage", () => {
  it("reads the day key for a day and the month key for a month", async () => {
    await getAiUsage("day", NOW);
    await getAiUsage("month", NOW);

    expect(getAll.mock.calls.map((c) => c[0])).toEqual(["ai:usage:2026-08-24", "ai:usage:2026-08"]);
  });

  it("splits the counters back out per task", async () => {
    getAll.mockResolvedValue({
      calls: 3,
      promptTokens: 1200,
      completionTokens: 300,
      costMicros: 4_500,
      "calls:coach-chat": 2,
      "promptTokens:coach-chat": 1000,
      "completionTokens:coach-chat": 250,
      "calls:tilt-message": 1,
      "promptTokens:tilt-message": 200,
      "completionTokens:tilt-message": 50,
      "calls:model:gpt-4o": 2,
    });

    const summary = await getAiUsage("day", NOW);

    expect(summary.calls).toBe(3);
    expect(summary.costUsd).toBeCloseTo(0.0045, 10);
    expect(summary.byTask).toEqual({
      "coach-chat": { calls: 2, promptTokens: 1000, completionTokens: 250 },
      "tilt-message": { calls: 1, promptTokens: 200, completionTokens: 50 },
    });
  });

  /** Per-model counters share the `metric:suffix` shape and must not be read as a task. */
  it("does not mistake a model counter for a task", async () => {
    getAll.mockResolvedValue({ calls: 1, "calls:model:gpt-4o": 1 });

    expect(await getAiUsage("day", NOW)).toMatchObject({ byTask: {} });
  });

  it("reports no cost rather than zero cost when nothing priced was recorded", async () => {
    getAll.mockResolvedValue({ calls: 2, promptTokens: 100, completionTokens: 20 });

    expect((await getAiUsage("day", NOW)).costUsd).toBeNull();
  });
});
