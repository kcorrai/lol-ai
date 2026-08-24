import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@/lib/ai/usage", () => ({ getAiUsage: vi.fn() }));

import { assertWithinAiBudget, AiBudgetExceededError, __resetAiBudget } from "./budget";
import { getAiUsage } from "@/lib/ai/usage";

const usage = vi.mocked(getAiUsage);
const ORIGINAL = { ...process.env };

function spent(costUsd: number | null) {
  return { costUsd, promptTokens: 0, completionTokens: 0, calls: 0, byTask: {} };
}

let clock = 1_000_000;

beforeEach(() => {
  vi.clearAllMocks();
  __resetAiBudget();
  clock += 1_000_000;
  delete process.env.AI_DAILY_BUDGET_USD;
  delete process.env.AI_MONTHLY_BUDGET_USD;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetAiBudget();
  vi.restoreAllMocks();
});

describe("assertWithinAiBudget", () => {
  /** Off unless configured — and cheap when off, since this runs before every model call. */
  it("allows the call and reads nothing when no budget is set", async () => {
    await expect(assertWithinAiBudget(clock)).resolves.toBeUndefined();

    expect(usage).not.toHaveBeenCalled();
  });

  it("allows the call while spend is under the limit", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockResolvedValue(spent(4.2));

    await expect(assertWithinAiBudget(clock)).resolves.toBeUndefined();
  });

  it("refuses the call once the daily limit is reached", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockResolvedValue(spent(10));

    await expect(assertWithinAiBudget(clock)).rejects.toBeInstanceOf(AiBudgetExceededError);
  });

  it("enforces the monthly limit independently of the daily one", async () => {
    process.env.AI_MONTHLY_BUDGET_USD = "100";
    usage.mockResolvedValue(spent(140));

    await expect(assertWithinAiBudget(clock)).rejects.toMatchObject({ period: "month" });
  });

  /**
   * A budget the ledger cannot price is a budget that is not being enforced. Reading it as "under
   * budget" forever is the failure mode worth naming out loud, so it warns — but it must not
   * refuse calls on the strength of a number it does not have.
   */
  it("allows the call, loudly, when a budget is set but nothing can be priced", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockResolvedValue(spent(null));

    await expect(assertWithinAiBudget(clock)).resolves.toBeUndefined();
    expect(vi.mocked(console.warn).mock.calls.flat().join(" ")).toContain("not being enforced");
  });

  it("ignores a limit that is not a positive number", async () => {
    process.env.AI_DAILY_BUDGET_USD = "not-a-number";

    await expect(assertWithinAiBudget(clock)).resolves.toBeUndefined();
    expect(usage).not.toHaveBeenCalled();
  });

  /** The ceiling is a cost ceiling, not a safety one — an unreachable ledger must not take the product down. */
  it("fails open when the ledger cannot be read", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockRejectedValue(new Error("redis down"));

    await expect(assertWithinAiBudget(clock)).resolves.toBeUndefined();
  });

  it("reads the ledger once for a burst rather than once per call", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockResolvedValue(spent(1));

    await assertWithinAiBudget(clock);
    await assertWithinAiBudget(clock + 100);
    await assertWithinAiBudget(clock + 200);

    expect(usage).toHaveBeenCalledTimes(1);
  });

  it("re-reads once the memo window has passed", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockResolvedValue(spent(1));

    await assertWithinAiBudget(clock);
    await assertWithinAiBudget(clock + 10_000);

    expect(usage).toHaveBeenCalledTimes(2);
  });

  it("keeps refusing for the rest of the memo window once it has breached", async () => {
    process.env.AI_DAILY_BUDGET_USD = "10";
    usage.mockResolvedValue(spent(11));

    await expect(assertWithinAiBudget(clock)).rejects.toBeInstanceOf(AiBudgetExceededError);
    await expect(assertWithinAiBudget(clock + 100)).rejects.toBeInstanceOf(AiBudgetExceededError);
    expect(usage).toHaveBeenCalledTimes(1);
  });
});
