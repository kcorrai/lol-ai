import type { Track } from "@/domains/academy/types";

import { mapAndWinCondition } from "./foundations/mapAndWinCondition";
import { minionsAndGold } from "./foundations/minionsAndGold";
import { shopAndPowerSpikes } from "./foundations/shopAndPowerSpikes";
import { recallTiming } from "./foundations/recallTiming";
import { visionBasics } from "./foundations/visionBasics";
import { objectivesAndPlates } from "./foundations/objectivesAndPlates";

import { waveStates } from "./laning/waveStates";
import { slowPushAndCrash } from "./laning/slowPushAndCrash";
import { freezing } from "./laning/freezing";
import { tradingPatterns } from "./laning/tradingPatterns";
import { jungleTracking } from "./laning/jungleTracking";
import { theFirstBack } from "./laning/theFirstBack";

// Lesson order inside a track is the teaching order and the recommendation order.
// It is deliberate: nothing in a lesson may depend on a lesson listed after it.
export const TRACKS: readonly Track[] = [
  {
    id: "foundations",
    title: "Foundations",
    tagline: "What the game is actually about",
    description:
      "The chain that decides every game of League: gold becomes power, power becomes map space, map space becomes objectives, objectives become the Nexus. Six lessons, no jargon, nothing you need to be good at yet.",
    level: "foundation",
    lessons: [
      mapAndWinCondition,
      minionsAndGold,
      shopAndPowerSpikes,
      recallTiming,
      visionBasics,
      objectivesAndPlates,
    ],
  },
  {
    id: "laning",
    title: "Laning",
    tagline: "Wave management, trades and tempo",
    description:
      "The single biggest skill gap between ranks. Read the wave, build one on purpose, trade only when the maths is already in your favour, and know where the enemy jungler is without warding for it.",
    level: "core",
    lessons: [waveStates, slowPushAndCrash, freezing, tradingPatterns, jungleTracking, theFirstBack],
  },
];
