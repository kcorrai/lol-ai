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

import { theIsland } from "./top/theIsland";
import { teleport } from "./top/teleport";
import { losingMatchups } from "./top/losingMatchups";
import { splitPushing } from "./top/splitPushing";
import { arrivingLate } from "./top/arrivingLate";

import { theClearIsThePlan } from "./jungle/theClearIsThePlan";
import { whereTheirJunglerIs } from "./jungle/whereTheirJunglerIs";
import { gankConditions } from "./jungle/gankConditions";
import { ninetySecondsBefore } from "./jungle/ninetySecondsBefore";
import { invading } from "./jungle/invading";

import { priorityIsTheJob } from "./mid/priorityIsTheJob";
import { roamingCostsAWave } from "./mid/roamingCostsAWave";
import { theTwoRivers } from "./mid/theTwoRivers";
import { comingBackToTheLane } from "./mid/comingBackToTheLane";
import { whichObjectiveHappens } from "./mid/whichObjectiveHappens";

import { farmingForTheItem } from "./adc/farmingForTheItem";
import { theTwoPlayerLane } from "./adc/theTwoPlayerLane";
import { oneStepBack } from "./adc/oneStepBack";
import { aloneInLane } from "./adc/aloneInLane";
import { damageIsADuration } from "./adc/damageIsADuration";

import { theRoleWithNoFarm } from "./support/theRoleWithNoFarm";
import { roamingIsYourFarm } from "./support/roamingIsYourFarm";
import { youChooseTheFight } from "./support/youChooseTheFight";
import { walkFirst } from "./support/walkFirst";
import { dyingForTheRightReason } from "./support/dyingForTheRightReason";

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

  // Role paths. Everything above is the same job in every role; these five cover only what is
  // left over once you know where the player stands (ADR-028). Five lessons rather than six,
  // deliberately — a role path that repeats the curriculum is padding.
  {
    id: "top",
    role: "top",
    title: "Top Path",
    tagline: "The island, and the two ways off it",
    description:
      "The lane furthest from everything that wins the game. Why nobody comes to help, what teleport is actually for, how to survive a matchup you cannot win, and the trade a split push is really making at twenty-eight minutes.",
    level: "core",
    lessons: [theIsland, teleport, losingMatchups, splitPushing, arrivingLate],
  },
  {
    id: "jungle",
    role: "jungle",
    title: "Jungle Path",
    tagline: "Time is the resource, camps are the clock",
    description:
      "The role where the decisions are the route, not the ganks. What a clear is actually buying, how to know which half of the map their jungler is allowed to be on, the three conditions a gank needs, the ninety seconds that decide a pit, and what a stolen camp really costs.",
    level: "core",
    lessons: [
      theClearIsThePlan,
      whereTheirJunglerIs,
      gankConditions,
      ninetySecondsBefore,
      invading,
    ],
  },
  {
    id: "mid",
    role: "mid",
    title: "Mid Path",
    tagline: "The right to leave, and what it costs",
    description:
      "The shortest lane and the only one in reach of both halves of the map. What priority actually is, the arithmetic behind every roam, surviving the most gankable lane in the game, coming back to a wave worth returning to, and deciding which objective your team gets.",
    level: "core",
    lessons: [
      priorityIsTheJob,
      roamingCostsAWave,
      theTwoRivers,
      comingBackToTheLane,
      whichObjectiveHappens,
    ],
  },
  {
    id: "adc",
    role: "adc",
    title: "ADC Path",
    tagline: "Range is a stat, and seconds are the score",
    description:
      "The role that is weak until it is not. Farming toward an item rather than a kill, the only lane with four people in it, the spacing that is worth more than any defensive item, the window where your support leaves, and why your damage is measured in seconds alive.",
    level: "core",
    lessons: [
      farmingForTheItem,
      theTwoPlayerLane,
      oneStepBack,
      aloneInLane,
      damageIsADuration,
    ],
  },
  {
    id: "support",
    role: "support",
    title: "Support Path",
    tagline: "The cheapest body on the map",
    description:
      "The only role with no farm, which is exactly what makes it free to move. What your income is really for, why roaming is your version of CS, the fights that exist because you pressed something, walking first through every corner, and the deaths that are purchases rather than mistakes.",
    level: "core",
    lessons: [
      theRoleWithNoFarm,
      roamingIsYourFarm,
      youChooseTheFight,
      walkFirst,
      dyingForTheRightReason,
    ],
  },
];
