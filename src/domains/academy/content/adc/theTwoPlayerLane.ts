import type { Lesson } from "@/domains/academy/types";

export const theTwoPlayerLane: Lesson = {
  slug: "the-two-player-lane",
  trackId: "adc",
  title: "The Only Two-Player Lane",
  summary:
    "Bot lane is the one place where four people stand in the same grass. What that changes: level two, backing together, and the fact that half your decisions were made by somebody else.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Play the level-two spike deliberately, in both directions",
    "Recall with your support instead of separately",
    "Adapt the lane to the kind of support you have rather than the one you wanted",
  ],
  fixes: ["low_cs", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Everywhere else, one player controls the lane. Bot lane has four, which makes it the loudest and most volatile part of the early game — and it means most of what happens to you was decided by your support half a second before you found out. Playing the lane well is mostly about making those two decisions the same one.",
    },
    {
      kind: "keyPoint",
      title: "Level two is a real spike and it is a race",
      text: "Whoever hits level two first in bot lane has a window of ten or fifteen seconds where they are a whole ability up on two opponents. The first wave has six minions, the second has seven — so the player who takes the melee minions of wave one and the first minions of wave two arrives first. Winning that race is worth more than the next two minutes of farming, and losing it while not noticing is how bot lanes fall apart at three minutes.",
    },
    {
      kind: "table",
      caption: "The lane your support is playing",
      head: ["Support kind", "What the lane wants", "What kills you"],
      rows: [
        [
          "Engage — hooks, charges",
          "Shove and look for the fight at level 2 and 6",
          "Standing back and wasting their cooldowns",
        ],
        [
          "Enchanter — shields, heals",
          "Farm safely, win the long trades, spike on items",
          "Taking early all-ins their kit cannot follow",
        ],
        [
          "Poke — ranged harass",
          "Push, take plates, force the recall",
          "Letting them all-in you while you are pushed",
        ],
      ],
    },
    { kind: "drill", drillId: "botlane-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Backing separately",
      text: "Your support recalls at four minutes. You stay for one more wave, take a bad trade against two, and back thirty seconds later with less gold. Now you are both walking to lane out of sync, and for the next minute the lane is either 1v2 or 2v1 — and it is 1v2 in their favour more often than yours.",
      fix: "Bot lane is a two-player lane on the way to the fountain as well. Back together or hold together. The gold difference from one extra wave is small; the minute of being alone against two is what actually loses lanes.",
    },
    {
      kind: "keyPoint",
      title: "You cannot pick your support, so play the lane you were given",
      text: "An enchanter will not make your all-in work no matter how many times you walk forward, and an engage support standing at the back is a wasted champion. Decide in the first thirty seconds which of the three lanes above you are in, and play that one. Most bot lane losses are two players playing two different lanes in the same grass.",
    },
    { kind: "drill", drillId: "botlane-decision" },
    {
      kind: "checklist",
      title: "The first four minutes",
      items: [
        "Am I racing for level two, or conceding it — decide, do not drift",
        "Which of the three lanes am I in, given the support I actually have",
        "Are we backing together, or is one of us about to be 1v2",
        "If they hit level two first, am I stepping back before it lands",
      ],
    },
  ],
  drills: [
    {
      id: "botlane-quiz",
      kind: "quiz",
      prompt: "Why does hitting level two first matter so much in bot lane?",
      options: [
        {
          id: "a",
          label:
            "For ten or fifteen seconds you are two players with an extra ability against two without one",
          explain:
            "Correct. It is a temporary 2v2 advantage large enough to force a summoner spell or a kill, and it arrives before anybody has items to change the maths. That window is the most reliable advantage of the early game.",
          correct: true,
        },
        {
          id: "b",
          label: "The extra experience compounds over the whole game",
          explain:
            "It does not — levels equalise within a wave or two. The value is entirely in the short window while it exists.",
          correct: false,
        },
        {
          id: "c",
          label: "It lets you take the first turret plate",
          explain:
            "Plates do not appear until fourteen minutes. The level-two spike is about the fight, not the structure.",
          correct: false,
        },
        {
          id: "d",
          label: "It means your support can leave to ward safely",
          explain:
            "A minor benefit, and warding is not what the window is for. Spending a 2v2 advantage on a walk into the river is spending it on nothing.",
          correct: false,
        },
      ],
    },
    {
      id: "botlane-decision",
      kind: "decision",
      situation:
        "5:10. You have an enchanter support. The enemy bot lane is a hook support and a short-range ADC, and they are standing forward, clearly looking for an all-in. Your wave is even in the middle.",
      facts: [
        "Your support heals and shields; no engage tool",
        "They have a hook and are standing aggressively",
        "Wave is even in the middle of the lane",
        "Both lanes are level 5, all summoners up",
      ],
      options: [
        {
          id: "a",
          label: "Farm from the back of the wave and make them come to you",
          explain:
            "Correct. Your lane wins the long fight and loses the short one, so the plan is to be somewhere their short one cannot start. Making them step into your side to force it is how an enchanter lane converts patience into an item lead.",
          correct: true,
        },
        {
          id: "b",
          label: "Shove the wave to force them off it before they can set up",
          explain:
            "Shoving puts you closer to their hook and further from your turret — you have moved yourself into the exact range their lane needs and given up the wave state that was protecting you.",
          correct: false,
        },
        {
          id: "c",
          label: "Trade with the enemy ADC while your support shields you",
          explain:
            "A shield does not make the trade safe when the other player is holding a hook. You are betting your position on them missing a skillshot, in a lane you win by not needing to.",
          correct: false,
        },
        {
          id: "d",
          label: "Ping your jungler and hold the wave until he arrives",
          explain:
            "Holding a neutral wave in the middle while waiting for help is the state they most want you in — standing still, in range, on their half of the decision.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.7,
    games: 3,
    instruction:
      "Next 3 games: in the first minute, decide which of the three bot lanes you are in and tell your support in one message. Never recall separately — back together or hold together.",
  },
};
