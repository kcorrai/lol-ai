// Declarative step list for the Clash-Royale-style coach tour. Each step optionally spotlights a
// real dashboard/nav element identified by its `data-tour` attribute. `fallback` is used when the
// primary target is absent (e.g. the desktop sidebar is hidden on mobile → use the BottomNav item).

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  id: string;
  /** `data-tour` value of the element to spotlight. Omitted → centered step, no cutout. */
  target?: string;
  /** Alternate `data-tour` target when the primary one is not in the DOM. */
  fallback?: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  /** Extra px around the target rect for the spotlight hole. */
  padding?: number;
  /** Final-step primary action. */
  cta?: { label: string; href: string };
  /** Render a confetti burst behind the bubble (finale). */
  celebrate?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    placement: "center",
    title: "Hey, I'm your AI Coach \u{1F44B}",
    body: "Give me 30 seconds and I'll show you around. Everything here is built from your own ranked games — no generic advice.",
  },
  {
    id: "progression",
    target: "progression",
    placement: "bottom",
    padding: 10,
    title: "This is your progression",
    body: "Your level, XP and daily streak live here. Play, complete tasks and climb — the bar fills as you improve.",
  },
  {
    id: "ask-coach",
    target: "ask-coach",
    placement: "bottom",
    padding: 8,
    title: "Ask me anything",
    body: "Stuck on a matchup or a mistake? Open the chat and I'll answer using your real match data.",
  },
  {
    id: "nav-reports",
    target: "nav-reports",
    fallback: "nav-reports",
    placement: "right",
    padding: 6,
    title: "Your AI reports",
    body: "Every session I break down your strengths, weaknesses and a step-by-step plan. Your reports live in here.",
  },
  {
    id: "daily-tasks",
    target: "daily-tasks",
    placement: "left",
    padding: 10,
    title: "Earn XP every day",
    body: "Finish daily challenges to gain XP and keep your streak alive. Small habits, real LP.",
  },
  {
    id: "nav-badges",
    target: "nav-badges",
    placement: "right",
    padding: 6,
    title: "Unlock badges",
    body: "Hit milestones and collect achievements as you climb. Check back here to see what's next.",
  },
  {
    id: "finish",
    placement: "center",
    title: "You're all set! \u{1F389}",
    body: "That's the tour. Let's get your very first AI report — it only takes a few seconds.",
    cta: { label: "Get my first report →", href: "/coaching" },
    celebrate: true,
  },
];

export const TOUR_STORAGE_KEY = "lolai_coach_tour_v1";
