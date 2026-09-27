"use client";

import { CoachMarketVisual, CreatorVisual } from "./ArsenalVisuals";
import { AcademyVisual, CoachVisual } from "./ArsenalMedia";
import { EsportsVisual } from "./ArsenalBoards";
import { DraftVisual } from "./DraftDemo";

export type ArsenalKey = "coach" | "coaches" | "academy" | "draft" | "esports" | "creator";

export interface ArsenalEntry {
  key: ArsenalKey;
  /** Rail label. Two words at most — the rail is 300px and does not wrap well. */
  title: string;
  /** Second line in the rail, desktop only. */
  hint: string;
  kicker: string;
  headline: string;
  body: string;
  points: readonly string[];
  cta: string;
  href: string;
  Panel: () => React.ReactElement;
}

/**
 * Marketing's own description of each pillar, deliberately not derived from the
 * domains it describes. The landing page says what a feature *is* to somebody who
 * has never opened it; it should not change shape because an internal list did
 * — the same rule DailyQuizStrip follows for the quiz modes.
 *
 * Every number below is checked against source and cited where it is not obvious.
 */
export const ARSENAL: readonly ArsenalEntry[] = [
  {
    key: "coach",
    title: "AI Coach",
    hint: "Reads your games, names one habit",
    kicker: "// The coach",
    headline: "It reads the games you already lost",
    body: "Three report types, each built from your real match timelines rather than a rank-wide average. The verdict is one habit — the thing costing you the most LP — plus the three actions that fix it.",
    points: [
      "Session review reads 5 games, climb roadmap 10",
      "Graded against your own rank, not a global baseline",
      "Habit and tilt detection across the whole history",
      "Free: 3 reports a month. Pro: unlimited, 100 games deep",
    ],
    cta: "See a full report",
    href: "#report",
    Panel: CoachVisual,
  },
  {
    // Second, immediately after the AI one, because that adjacency is the claim: the
    // report and the person are two products here, not a product and an upsell. Every
    // number below is read from the section itself — the badge refresh is
    // `refreshCoachRanks.ts` (every 6 hours, stale at 36), the three kinds are
    // `KIND_OPTIONS` in `marketplace/components/options.ts`, and the review blind is
    // `REVIEW_BLIND_DAYS` in `marketplace/policy.ts`.
    key: "coaches",
    title: "Coaches",
    hint: "A person, with a rank we checked",
    kicker: "// The person",
    headline: "Book a human whose rank we read ourselves",
    body: "A storefront you can filter by rank, role, language and price. Every rank on it was read from that coach's own linked Riot account and is shown with the date we checked it — nobody here typed their rank into a box.",
    points: [
      "Replay review, live 1:1 session, or live game coaching",
      "Rank re-read from Riot every six hours, always dated",
      "Price and free slots visible before you message anyone",
      "Every booking change recorded with who did it and why",
    ],
    cta: "Browse coaches",
    href: "/coaches",
    Panel: CoachMarketVisual,
  },
  {
    key: "academy",
    title: "Academy",
    hint: "61 lessons, then measured in ranked",
    kicker: "// The curriculum",
    headline: "Learn it, then prove it in your own games",
    body: "Six core tracks and a path for each role — 61 lessons in all. Every lesson ends in a drill you have to get right, and every track ends in a field assignment measured against your own ranked baseline.",
    points: [
      "Foundations, Laning, Vision, Macro, Teamfighting, Mental",
      "Five role paths: top, jungle, mid, ADC, support",
      "Drills: decisions, map reads, build orders, wave sims",
      "Mastery is re-checked every 21 days — it can decay",
    ],
    cta: "Open the Academy",
    href: "/academy",
    Panel: AcademyVisual,
  },
  {
    key: "draft",
    title: "Draft Room",
    hint: "Fearless pick/ban, one link",
    kicker: "// Before the game",
    headline: "Run the whole pick/ban with your team",
    body: "A real draft room: one link per side, a spectator link for everyone else, and advice on the turn actually in front of you. Fearless series are first-class — champions spent in earlier games stay gone.",
    points: [
      "Up to 5 games a series, lockouts carried across both sides",
      "30-second turn timer by default, or untimed",
      "Per-turn advice: win rate, counter score, the gap in your comp",
      "No login to start one",
    ],
    cta: "Start a draft",
    href: "/draft",
    Panel: DraftVisual,
  },
  {
    key: "esports",
    title: "Esports",
    hint: "Live scores and the pro meta",
    kicker: "// The pros",
    headline: "What the best players are picking today",
    body: "Live scores, schedules, standings and results from every published league, plus the pro champion meta — what teams actually pick and ban, separate from the solo-queue tier list.",
    points: [
      "Worlds, LEC, LCK, LPL, LTA and the rest",
      "Team, player and league pages with match history",
      "Pro pick and ban rates per champion",
      "Free, no login",
    ],
    cta: "Open the esports hub",
    href: "/esports",
    Panel: EsportsVisual,
  },
  {
    key: "creator",
    title: "Creator Kit",
    hint: "OBS overlays and chat commands",
    kicker: "// On stream",
    headline: "Put your own numbers on the broadcast",
    body: "Five browser-source overlays for OBS and five chat commands, all fed from your ranked history. One poll serves a whole scene, and everything is stream-safe before it leaves us.",
    points: [
      "Widgets: rank, session, last game, champions, goal",
      "Commands: !rank, !session, !lastgame, !champs, !laneiq",
      "Twitch, Kick and YouTube",
      "Overlays authenticate by key — OBS never needs your login",
    ],
    cta: "Set up the kit",
    href: "/creator",
    Panel: CreatorVisual,
  },
];
