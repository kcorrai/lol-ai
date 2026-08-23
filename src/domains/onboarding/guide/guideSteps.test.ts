import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  GUIDE_STEPS,
  GUIDE_STORAGE_KEY,
  isGateSatisfied,
  storageKeyFor,
  type GuideGates,
} from "./guideSteps";
import { NAV_SECTIONS, NAV_SETTINGS } from "@/components/layout/navConfig";

/** The sidebar and bottom nav set `data-tour` from config rather than a literal. */
const NAV_TOUR_IDS = [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_SETTINGS]
  .map((i) => i.tourId)
  .filter((id): id is string => Boolean(id));

/** Every .tsx under the given roots — where a `data-tour` anchor can live. */
function tsxFilesUnder(...roots: string[]): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".tsx")) out.push(path);
    }
  };
  for (const root of roots) walk(root);
  return out;
}

const NONE: GuideGates = {
  hasAccount: false,
  hasMatches: false,
  hasCompleteReport: false,
  hasPlan: false,
};
const ALL: GuideGates = {
  hasAccount: true,
  hasMatches: true,
  hasCompleteReport: true,
  hasPlan: true,
};

describe("GUIDE_STEPS", () => {
  it("starts with a welcome and ends with a final step", () => {
    expect(GUIDE_STEPS[0].id).toBe("welcome");
    const last = GUIDE_STEPS[GUIDE_STEPS.length - 1];
    expect(last.isFinal).toBe(true);
    expect(last.advance.type).toBe("manual");
  });

  it("has unique step ids", () => {
    const ids = GUIDE_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Every step target must correspond to a real `data-tour` anchor rendered somewhere in the app.
  // A step pointing at a non-existent anchor leaves the user staring at an empty
  // spotlight with no control to click (this is what caught the missing
  // `connect-form` — TASK-220).
  //
  // The anchor set is read out of the tree rather than copied into a literal
  // here. The literal drifted: `my-profile-link` stayed in it for months after
  // the match-page redesign dropped the link that carried it, so the test kept
  // passing while the forced journey hard-locked on that step. A hand-kept copy
  // of reality asserts nothing about reality.
  it("only spotlights anchors the app actually renders", () => {
    const anchors = new Set<string>(NAV_TOUR_IDS);
    // Both shapes count: a literal `data-tour="x"`, and the conditional
    // `data-tour={cond ? "x" : undefined}` the row-level anchors use.
    for (const file of tsxFilesUnder("app", "src")) {
      for (const m of readFileSync(file, "utf8").matchAll(/data-tour=(?:"([^"]+)"|{([^}]*)})/g)) {
        if (m[1]) anchors.add(m[1]);
        for (const q of (m[2] ?? "").matchAll(/"([^"]+)"/g)) anchors.add(q[1]);
      }
    }

    for (const step of GUIDE_STEPS) {
      if (!step.target) continue;
      expect(
        anchors.has(step.target),
        `${step.id} → data-tour="${step.target}" must exist in the app`
      ).toBe(true);
    }
  });

  it("gives every route step a target, and every nav route step a goTo safety valve", () => {
    for (const step of GUIDE_STEPS) {
      if (step.advance.type !== "route") continue;
      // Every route step must spotlight something to click.
      expect(step.target, `${step.id} needs a target`).toBeTruthy();
      // Nav steps also expose a "Take me there" fallback so mobile / off-screen nav never locks.
      // (click-match is exempt: the user must click the real, guaranteed-present match row.)
      if (step.target?.startsWith("nav-")) {
        expect(step.goTo, `${step.id} needs goTo`).toBeTruthy();
      }
    }
  });

  it("shows each tab's inside as a manual preview step before finishing (TASK-219)", () => {
    const finish = GUIDE_STEPS.findIndex((s) => s.id === "finish");
    for (const id of ["improvement-inside", "badges-inside", "leaderboard-inside"]) {
      const i = GUIDE_STEPS.findIndex((s) => s.id === id);
      expect(i, `${id} exists`).toBeGreaterThan(-1);
      // Manual so the user actually looks at the preview instead of auto-advancing past it.
      expect(GUIDE_STEPS[i].advance.type, `${id} is manual`).toBe("manual");
      // Spotlights the page's preview anchor.
      expect(GUIDE_STEPS[i].target, `${id} targets a *-preview anchor`).toMatch(/-preview$/);
      expect(i, `${id} precedes finish`).toBeLessThan(finish);
    }
  });

  it("walks the whole profile between the match and reports (TASK-225/231)", () => {
    const breakdown = GUIDE_STEPS.findIndex((s) => s.id === "match-breakdown");
    const clickName = GUIDE_STEPS.findIndex((s) => s.id === "click-my-name");
    const reports = GUIDE_STEPS.findIndex((s) => s.id === "go-reports");

    const cn = GUIDE_STEPS[clickName];
    expect(cn.target).toBe("my-profile-link");
    expect(cn.advance).toEqual({ type: "route", route: "/u/" });

    // The profile walkthrough: hero → stats → champions → badges, all between click-my-name and reports.
    const walk = ["profile-hero", "profile-stats", "profile-champions", "profile-badges"];
    let prev = clickName;
    for (const id of walk) {
      const i = GUIDE_STEPS.findIndex((s) => s.id === id);
      expect(i, `${id} exists`).toBeGreaterThan(-1);
      expect(GUIDE_STEPS[i].advance.type, `${id} manual`).toBe("manual");
      expect(GUIDE_STEPS[i].target, `${id} targets its section`).toBe(id);
      expect(i, `${id} in order`).toBeGreaterThan(prev);
      prev = i;
    }
    expect(breakdown).toBeLessThan(clickName);
    expect(prev).toBeLessThan(reports);

    // Conditional sections auto-skip when absent so the walk never parks on an empty spotlight.
    for (const id of ["profile-stats", "profile-badges"]) {
      expect(
        GUIDE_STEPS[GUIDE_STEPS.findIndex((s) => s.id === id)].skipIfMissing,
        `${id} skipIfMissing`
      ).toBe(true);
    }
  });

  it("forces the account connection before anything else", () => {
    const accounts = GUIDE_STEPS.findIndex((s) => s.id === "go-accounts");
    const connect = GUIDE_STEPS.findIndex((s) => s.id === "connect");
    const reports = GUIDE_STEPS.findIndex((s) => s.id === "generate-report");
    expect(accounts).toBeLessThan(connect);
    expect(connect).toBeLessThan(reports);
  });
});

describe("storageKeyFor", () => {
  it("namespaces the step-index key per user so progress never leaks across accounts", () => {
    expect(storageKeyFor("user-a")).toBe(`${GUIDE_STORAGE_KEY}:user-a`);
    expect(storageKeyFor("user-a")).not.toBe(storageKeyFor("user-b"));
  });

  it("falls back to the bare key when no user id is available", () => {
    expect(storageKeyFor(null)).toBe(GUIDE_STORAGE_KEY);
    expect(storageKeyFor(undefined)).toBe(GUIDE_STORAGE_KEY);
  });
});

describe("isGateSatisfied", () => {
  it("never auto-advances manual steps", () => {
    const welcome = GUIDE_STEPS[0];
    expect(isGateSatisfied(welcome, ALL)).toBe(false);
  });

  it("skips the connect step once an account exists", () => {
    const connect = GUIDE_STEPS.find((s) => s.id === "connect")!;
    expect(isGateSatisfied(connect, NONE)).toBe(false);
    expect(isGateSatisfied(connect, ALL)).toBe(true);
  });

  it("fast-forwards go-accounts when already connected via satisfiedGate", () => {
    const go = GUIDE_STEPS.find((s) => s.id === "go-accounts")!;
    expect(go.satisfiedGate).toBe("hasAccount");
    expect(isGateSatisfied(go, { ...NONE, hasAccount: true })).toBe(true);
  });

  it("skips generate-report when a completed report already exists", () => {
    const gen = GUIDE_STEPS.find((s) => s.id === "generate-report")!;
    expect(isGateSatisfied(gen, { ...NONE, hasCompleteReport: true })).toBe(true);
    expect(isGateSatisfied(gen, NONE)).toBe(false);
  });
});
