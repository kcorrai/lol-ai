import { describe, it, expect } from "vitest";
import { NAV_SECTIONS, NAV_SETTINGS, ALL_NAV_HREFS } from "./navConfig";

const ALL_ITEMS = [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_SETTINGS];

describe("navConfig", () => {
  it("has unique hrefs across every section", () => {
    const hrefs = ALL_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("ALL_NAV_HREFS matches the flattened item hrefs", () => {
    expect(new Set(ALL_NAV_HREFS)).toEqual(new Set(ALL_ITEMS.map((i) => i.href)));
  });

  // The forced onboarding journey (guideSteps.ts) spotlights the sidebar by tour id. Dropping
  // any of these while regrouping would freeze the guided overlay on a missing anchor (TASK-220).
  it("preserves every onboarding tour id the guided journey depends on", () => {
    const REQUIRED_TOUR_IDS = [
      "nav-dashboard",
      "nav-champions",
      "nav-reports",
      "nav-coach-chat",
      "nav-improvement",
      "nav-otp",
      "nav-badges",
      "nav-leaderboard",
      "nav-accounts",
      "nav-profile",
      "nav-discord",
    ];
    const present = new Set(ALL_ITEMS.map((i) => i.tourId).filter(Boolean));
    for (const id of REQUIRED_TOUR_IDS) {
      expect(present.has(id)).toBe(true);
    }
  });

  it("surfaces the free tools in their own section", () => {
    const tools = NAV_SECTIONS.find((s) => s.label === "Free Tools");
    expect(tools).toBeDefined();
    const toolHrefs = tools!.items.map((i) => i.href);
    expect(toolHrefs).toContain("/tools/counter-picker");
    expect(toolHrefs).toContain("/tools/tier-list");
    expect(toolHrefs).toContain("/builds");
  });
});
