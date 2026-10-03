import { describe, it, expect, vi } from "vitest";

vi.mock("@/inngest/functions/marketplaceSweeps", () => ({ marketplaceSweeps: "sweeps" }));
vi.mock("@/inngest/functions/refreshCoachRanks", () => ({ refreshCoachRanks: "ranks" }));

import { marketplaceSchedules } from "./marketplaceSchedules";

describe("marketplaceSchedules", () => {
  it("serves nothing while the marketplace is not live, so Neon can suspend", () => {
    expect(marketplaceSchedules({})).toEqual([]);
  });

  it("treats anything but the literal 'true' as off", () => {
    expect(marketplaceSchedules({ MARKETPLACE_ENABLED: "1" })).toEqual([]);
    expect(marketplaceSchedules({ MARKETPLACE_ENABLED: "false" })).toEqual([]);
  });

  it("serves the sweep and the rank refresh once it is", () => {
    expect(marketplaceSchedules({ MARKETPLACE_ENABLED: "true" })).toEqual(["sweeps", "ranks"]);
  });
});
