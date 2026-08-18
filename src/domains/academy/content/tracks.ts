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

import { wardPlacementsByPhase } from "./vision/wardPlacementsByPhase";
import { sweeperAndControlWards } from "./vision/sweeperAndControlWards";
import { minimapRhythm } from "./vision/minimapRhythm";
import { theDangerTriangle } from "./vision/theDangerTriangle";
import { wardingAsATeam } from "./vision/wardingAsATeam";
import { visionBeforeObjectives } from "./vision/visionBeforeObjectives";

import { tempoAndPriority } from "./macro/tempoAndPriority";
import { objectiveSetup } from "./macro/objectiveSetup";
import { sideLaneAssignment } from "./macro/sideLaneAssignment";
import { tradingObjectives } from "./macro/tradingObjectives";
import { towerPriorityAndPlates } from "./macro/towerPriorityAndPlates";
import { closingTheGame } from "./macro/closingTheGame";

import { positioningBasics } from "./teamfighting/positioningBasics";
import { targetSelection } from "./teamfighting/targetSelection";
import { cooldownTracking } from "./teamfighting/cooldownTracking";
import { engageAndDisengage } from "./teamfighting/engageAndDisengage";
import { peelingAndProtecting } from "./teamfighting/peelingAndProtecting";
import { fightingAroundObjectives } from "./teamfighting/fightingAroundObjectives";

import { tiltAndTheNextGame } from "./mental/tiltAndTheNextGame";
import { theDodgeDecision } from "./mental/theDodgeDecision";
import { warmUpAndFirstGame } from "./mental/warmUpAndFirstGame";
import { playingFromBehind } from "./mental/playingFromBehind";
import { communicationAndMute } from "./mental/communicationAndMute";
import { sessionDiscipline } from "./mental/sessionDiscipline";

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
  {
    id: "vision",
    title: "Vision & Map",
    tagline: "Knowing what is not on your screen",
    description:
      "The players with map awareness are not seeing more than you — they are inferring more. Where each ward goes and what it asks, how to take theirs away, the rhythm that makes looking free, and the shape of where an invisible jungler can be.",
    level: "core",
    lessons: [
      wardPlacementsByPhase,
      sweeperAndControlWards,
      minimapRhythm,
      theDangerTriangle,
      wardingAsATeam,
      visionBeforeObjectives,
    ],
  },
  {
    id: "macro",
    title: "Macro",
    tagline: "Being somewhere else, on purpose",
    description:
      "One question asked all game: something is happening elsewhere — do I get to go? Priority and what to spend it on, the minute before an objective, who takes which side lane, when to trade instead of contest, and the four ways a won game gets thrown.",
    level: "advanced",
    lessons: [
      tempoAndPriority,
      objectiveSetup,
      sideLaneAssignment,
      tradingObjectives,
      towerPriorityAndPlates,
      closingTheGame,
    ],
  },
  {
    id: "teamfighting",
    title: "Teamfighting",
    tagline: "Decided before anyone presses anything",
    description:
      "Where you stand ten seconds early, who you are actually allowed to press, the three cooldowns that decide whether a fight exists, who owns the engage, when peeling is the losing play, and why a hole in the ground beats most of your items.",
    level: "advanced",
    lessons: [
      positioningBasics,
      targetSelection,
      cooldownTracking,
      engageAndDisengage,
      peelingAndProtecting,
      fightingAroundObjectives,
    ],
  },
  {
    id: "mental",
    title: "Mental & Consistency",
    tagline: "The games around the game",
    description:
      "Tilt is not a mood, it is a measurable change in the decisions you make — and it costs you the next game, not the one you are angry about. What to do about that, plus dodging, warming up, playing from behind, and the session length nobody sets on purpose.",
    level: "core",
    lessons: [
      tiltAndTheNextGame,
      theDodgeDecision,
      warmUpAndFirstGame,
      playingFromBehind,
      communicationAndMute,
      sessionDiscipline,
    ],
  },
];
