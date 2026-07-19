import { describe, it, expect } from "vitest";
import { shouldAutoSync, AUTO_SYNC_STALE_MS } from "./useAutoSync";

const NOW = 1_800_000_000_000;

describe("shouldAutoSync", () => {
  it("syncs when the last sync is older than the stale window", () => {
    const stale = new Date(NOW - AUTO_SYNC_STALE_MS - 1).toISOString();
    expect(shouldAutoSync(stale, "COMPLETED", NOW)).toBe(true);
  });

  it("does not sync when data is still fresh", () => {
    const fresh = new Date(NOW - 60_000).toISOString();
    expect(shouldAutoSync(fresh, "COMPLETED", NOW)).toBe(false);
  });

  it("treats a never-synced account as stale", () => {
    expect(shouldAutoSync(null, "IDLE", NOW)).toBe(true);
    expect(shouldAutoSync(undefined, undefined, NOW)).toBe(true);
  });

  it("never stacks a sync while one is already running", () => {
    expect(shouldAutoSync(null, "PENDING", NOW)).toBe(false);
    expect(shouldAutoSync(null, "RUNNING", NOW)).toBe(false);
  });
});
