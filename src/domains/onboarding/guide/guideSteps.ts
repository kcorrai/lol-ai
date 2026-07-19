// Declarative step list for the forced, cross-page "first journey" onboarding (TASK-217).
// Unlike the retired presentational dashboard tour, every step here is *action-driven*: the user
// advances only by doing the real thing (navigating, connecting an account, generating a report).

export type GuidePlacement = "top" | "bottom" | "left" | "right" | "center";

// Live, real-world gates the engine derives from React Query hooks. A step can auto-advance or
// be fast-forwarded when its gate is already satisfied.
export interface GuideGates {
  hasAccount: boolean;
  hasMatches: boolean;
  hasCompleteReport: boolean;
}

export type GuideAdvance =
  | { type: "manual" } // advance via the bubble's primary button ("Got it")
  | { type: "route"; route: string } // advance when the pathname reaches `route` (prefix match)
  | { type: "state"; gate: keyof GuideGates }; // advance when a live gate flips true

export interface GuideStep {
  id: string;
  /** `data-tour` value of the element to spotlight. Omitted → centered step, no cutout. */
  target?: string;
  title: string;
  body: string;
  placement?: GuidePlacement;
  /** Extra px around the target rect for the spotlight hole. */
  padding?: number;
  advance: GuideAdvance;
  /** Fast-forward past this step on mount when the gate is already satisfied. */
  satisfiedGate?: keyof GuideGates;
  /** Route steps: a secondary "Take me there" button so the flow never hard-locks (e.g. off-screen nav on mobile). */
  goTo?: string;
  /** Final step: burst confetti + POST completion. */
  isFinal?: boolean;
}

export const GUIDE_STORAGE_KEY = "lolai_first_journey_v1";

// Namespace the step-index storage key per user. The completion gate is DB-backed, but the
// in-progress step index lives in localStorage — a browser-global key would leak one account's
// progress onto the next account signed in on the same browser (TASK-218).
export function storageKeyFor(userId: string | null | undefined): string {
  return userId ? `${GUIDE_STORAGE_KEY}:${userId}` : GUIDE_STORAGE_KEY;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: "welcome",
    placement: "center",
    title: "Welcome, summoner \u{1F44B}",
    body: "I'm your AI Coach. I'll walk you through everything myself — step by step. Follow the light: only what matters right now stays lit.",
    advance: { type: "manual" },
  },
  {
    id: "go-accounts",
    target: "nav-accounts",
    placement: "right",
    padding: 6,
    title: "First, connect your account",
    body: "Everything I do is built from your real ranked games. Click the glowing “Accounts” to get started.",
    advance: { type: "route", route: "/settings/accounts" },
    goTo: "/settings/accounts",
    satisfiedGate: "hasAccount",
  },
  {
    id: "connect",
    target: "connect-form",
    placement: "top",
    padding: 10,
    title: "Enter your Riot ID",
    body: "Type your in-game name, tag and region, then hit Connect. I'll pull your match history — I never change anything on your account.",
    advance: { type: "state", gate: "hasAccount" },
  },
  {
    id: "syncing",
    placement: "center",
    title: "Pulling your games…",
    body: "Give me a few seconds to fetch and crunch your recent ranked matches. This only happens once.",
    advance: { type: "state", gate: "hasMatches" },
  },
  {
    id: "go-dashboard",
    target: "nav-dashboard",
    placement: "right",
    padding: 6,
    title: "This is your Dashboard",
    body: "Your home base — trends, tilt warnings, daily focus. Click the glowing “Dashboard” to head back.",
    advance: { type: "route", route: "/dashboard" },
    goTo: "/dashboard",
  },
  {
    id: "click-match",
    target: "match-row",
    placement: "bottom",
    padding: 8,
    title: "Open a match",
    body: "Every game has a full breakdown. Click your latest match to see what I see.",
    advance: { type: "route", route: "/match/" },
  },
  {
    id: "match-breakdown",
    placement: "center",
    title: "This is a match breakdown",
    body: "KDA, CS, vision, gold — minute by minute. This is the raw material behind every piece of coaching I give you.",
    advance: { type: "manual" },
  },
  {
    id: "go-reports",
    target: "nav-reports",
    placement: "right",
    padding: 6,
    title: "Now, your AI reports",
    body: "This is where the real coaching lives. Click the glowing “Reports”.",
    advance: { type: "route", route: "/coaching" },
    goTo: "/coaching",
  },
  {
    id: "generate-report",
    target: "generate-report",
    placement: "bottom",
    padding: 12,
    title: "Generate your first report",
    body: "Hit a report type below. I'll analyze your recent games and write your strengths, weaknesses and a step-by-step plan. Wait here — it takes a few seconds.",
    advance: { type: "state", gate: "hasCompleteReport" },
  },
  {
    id: "go-improvement",
    target: "nav-improvement",
    placement: "right",
    padding: 6,
    title: "Your improvement plan",
    body: "Reports turn into a living plan you work through over time. Click the glowing “Improvement”.",
    advance: { type: "route", route: "/improvement" },
    goTo: "/improvement",
  },
  {
    id: "improvement-inside",
    target: "improvement-preview",
    placement: "top",
    padding: 12,
    title: "A living, scored plan",
    body: "Each week I set targets from your games and score how you did. Plans stack up over time so you can see the trend — here's a sample of what that looks like.",
    advance: { type: "manual" },
  },
  {
    id: "go-badges",
    target: "nav-badges",
    placement: "right",
    padding: 6,
    title: "Earn badges as you climb",
    body: "Hit milestones, unlock achievements, keep your streak alive. Click the glowing “Badges”.",
    advance: { type: "route", route: "/achievements" },
    goTo: "/achievements",
  },
  {
    id: "badges-inside",
    target: "badges-preview",
    placement: "top",
    padding: 12,
    title: "Badges for real milestones",
    body: "Big plays and streaks unlock badges automatically. You've got none yet — here's a taste of what you'll be chasing.",
    advance: { type: "manual" },
  },
  {
    id: "go-leaderboard",
    target: "nav-leaderboard",
    placement: "right",
    padding: 6,
    title: "See where you rank",
    body: "Weekly and monthly LP leaders. Last stop — click the glowing “Leaderboard”.",
    advance: { type: "route", route: "/leaderboard" },
    goTo: "/leaderboard",
  },
  {
    id: "leaderboard-inside",
    target: "leaderboard-preview",
    placement: "top",
    padding: 12,
    title: "This is the Leaderboard",
    body: "Fastest climbers, week by week. Make your profile public and play a few ranked games and you'll appear right here — this is a sample of what it looks like.",
    advance: { type: "manual" },
  },
  {
    id: "finish",
    placement: "center",
    title: "You're all set! \u{1F389}",
    body: "That's the whole app. Everything's unlocked now — go climb, and I'll be here whenever you need me.",
    advance: { type: "manual" },
    isFinal: true,
  },
];

// True when a step's advance condition is already met by the current gates. Used both to
// fast-forward past already-done steps on mount and to auto-advance state steps at runtime.
export function isGateSatisfied(step: GuideStep, gates: GuideGates): boolean {
  if (step.satisfiedGate && gates[step.satisfiedGate]) return true;
  if (step.advance.type === "state") return gates[step.advance.gate];
  return false;
}
