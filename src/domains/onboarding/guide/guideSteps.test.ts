import { describe, it, expect } from "vitest";
import { GUIDE_STEPS, GUIDE_STORAGE_KEY, isGateSatisfied, storageKeyFor, type GuideGates } from "./guideSteps";

const NONE: GuideGates = { hasAccount: false, hasMatches: false, hasCompleteReport: false };
const ALL: GuideGates = { hasAccount: true, hasMatches: true, hasCompleteReport: true };

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
  // A step pointing at a non-existent anchor makes the spotlight overlay freeze the whole page
  // (this list is what caught the missing `connect-form` — TASK-220). Keep in sync with the
  // `data-tour="..."` attributes in the components.
  it("only spotlights anchors the app actually renders", () => {
    const KNOWN_ANCHORS = new Set([
      "nav-dashboard", "nav-accounts", "nav-reports", "nav-improvement", "nav-badges", "nav-leaderboard",
      "connect-form", "match-row", "generate-report",
      "improvement-preview", "badges-preview", "leaderboard-preview",
    ]);
    for (const step of GUIDE_STEPS) {
      if (!step.target) continue;
      expect(KNOWN_ANCHORS.has(step.target), `${step.id} → data-tour="${step.target}" must exist in the app`).toBe(true);
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
