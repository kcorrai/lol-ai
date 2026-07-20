import { describe, it, expect } from "vitest";
import { resolveDashboardView } from "./dashboardView";

describe("resolveDashboardView", () => {
  it("shows the skeleton while accounts are still loading", () => {
    expect(resolveDashboardView(true, 0)).toBe("loading");
  });

  it("shows the connect prompt once loading finished with no accounts", () => {
    expect(resolveDashboardView(false, 0)).toBe("no-account");
  });

  it("renders the dashboard when the user has an account", () => {
    expect(resolveDashboardView(false, 1)).toBe("ready");
  });

  it("keeps rendering a populated dashboard during a background refetch", () => {
    expect(resolveDashboardView(true, 2)).toBe("ready");
  });
});
