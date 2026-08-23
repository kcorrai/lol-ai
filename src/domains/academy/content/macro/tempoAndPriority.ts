import type { Lesson } from "@/domains/academy/types";

export const tempoAndPriority: Lesson = {
  slug: "tempo-and-priority",
  trackId: "macro",
  title: "Tempo and Priority",
  summary:
    "Priority is the right to be somewhere else. Tempo is what you spend it on. Almost every macro mistake below Diamond is having one and not converting it into the other.",
  minutes: 6,
  access: "free",
  objectives: [
    "Say who has priority in a lane at any moment, and why",
    "Convert priority into a second action instead of standing in lane with it",
    "Recognise the two moments where giving up priority is correct",
  ],
  fixes: ["objective_neglect", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Macro sounds like a subject you study. It is not. It is one question asked over and over: I am here, and something is happening somewhere else — do I get to go? Everything with a name in this track is machinery for answering that faster than the enemy laner answers it.",
    },
    {
      kind: "keyPoint",
      title: "Priority is the permission to leave",
      text: "You have priority when leaving your lane costs you less than it costs your opponent. That is all it means. Not who is winning, not who has more CS — who can walk away right now and lose less by walking. A pushed wave, a shoved wave, a health lead: these matter only because of what they do to that one sentence.",
    },
    {
      kind: "table",
      caption: "Reading priority in one look",
      head: ["The lane looks like", "Who has priority", "What it is worth"],
      rows: [
        [
          "Your wave is crashing into their turret",
          "You",
          "Ten to fifteen seconds anywhere on the map",
        ],
        [
          "The wave is frozen outside your turret",
          "Them",
          "You are stuck; the freeze is doing that on purpose",
        ],
        [
          "Both waves even in the middle",
          "Whoever shoves first",
          "A race — and shoving costs you a wave if they answer",
        ],
        [
          "You are behind and under turret",
          "Them, badly",
          "Do not leave; farm and wait for the wave to reset",
        ],
      ],
    },
    {
      kind: "prose",
      text: "The reason this matters more than raw CS is that priority is the only currency that buys objectives. A drake is not taken by five people deciding to take it. It is taken by two lanes having shoved thirty seconds earlier, which meant four players could arrive and the enemy could only send two. The drake was decided in the lanes, before anyone walked.",
    },
    {
      kind: "mistake",
      title: "Winning priority and then standing in it",
      text: "You shove the wave into their turret at 8:30, then walk back to the middle of your lane and wait for the next one. You had ten seconds of the map and you spent it standing still.",
      fix: "Shoving is only half a move. Before the wave crashes, decide what the second half is: the river ward, the crab, the roam to mid, or the recall you were about to need anyway. If you cannot name the second half, do not spend the wave shoving in the first place — hold it instead.",
    },
    { kind: "drill", drillId: "tempo-decision" },
    {
      kind: "prose",
      text: "There are exactly two moments where giving up priority is right. The first is when you are behind and the wave sitting near your turret is protecting you — leaving is what turns a bad lane into a lost one. The second is when you want a freeze, which is priority spent deliberately to make the enemy laner stand in a place where nothing happens. Both are choices. Neither is what most players are doing when they lose priority, which is nothing.",
    },
    {
      kind: "checklist",
      title: "Converting priority, every wave",
      items: [
        "Before you shove: name the thing you will do with the ten seconds",
        "If the answer is 'nothing happening on the map', hold the wave instead — a held wave keeps its value",
        "If an objective is under a minute away, the answer is always 'shove and go'",
        "After you spend it, check the minimap before walking back in — priority you spent is priority they now have",
      ],
    },
    { kind: "drill", drillId: "tempo-quiz" },
  ],
  drills: [
    {
      id: "tempo-decision",
      kind: "decision",
      situation:
        "9:20. You are mid with even CS and full health. Drake spawns at 10:00. Your wave is even in the middle of the lane and your jungler has just started the enemy blue side camp on your half of the map.",
      facts: [
        "Drake at 10:00, currently 9:20",
        "Wave even in the middle",
        "Full health, even CS",
        "Your jungler is on the drake side of the map",
      ],
      options: [
        {
          id: "a",
          label: "Shove the wave now so you are free when the drake timer comes up",
          explain:
            "Correct. Forty seconds is exactly one shove and a walk. Doing it now means you arrive with the wave already spent; doing it at 9:55 means you arrive late, or arrive on time having given the enemy mid a free crash into your turret.",
          correct: true,
        },
        {
          id: "b",
          label: "Farm evenly until 9:50, then walk down",
          explain:
            "This is the single most common macro error: leaving on the timer instead of before it. You show up with your wave un-shoved, which means their mid arrives too — and the four-versus-four you wanted was supposed to be four-versus-three.",
          correct: false,
        },
        {
          id: "c",
          label: "Hold the wave and let them come to you",
          explain:
            "Holding is the right call when nothing is happening. Something is happening in forty seconds, and a held wave has no value at an objective you did not attend.",
          correct: false,
        },
        {
          id: "d",
          label: "Roam to help your jungler with the camp first",
          explain:
            "It spends the same tempo on the smaller prize, and it does it before shoving — so your wave is still sitting there waiting for the enemy mid to take it while you help with a camp your jungler had.",
          correct: false,
        },
      ],
    },
    {
      id: "tempo-quiz",
      kind: "quiz",
      prompt:
        "Your opponent has frozen the wave outside your turret and you cannot break it. Nothing is up on the map for ninety seconds. What has actually happened to you?",
      options: [
        {
          id: "a",
          label: "They spent their priority to take yours away, and you are paying it in CS",
          explain:
            "Correct. A freeze is priority spent as a weapon — they gave up going anywhere in exchange for you being unable to. The counterplay is not to fight it but to make the ninety seconds cost them: call your jungler, or accept the CS loss and take the wave that follows the reset.",
          correct: true,
        },
        {
          id: "b",
          label: "Nothing much — you are even in CS so the lane is even",
          explain:
            "The CS is even now and will not be in ninety seconds, because a freeze bleeds you slowly. Even more importantly, they can leave the lane and you cannot.",
          correct: false,
        },
        {
          id: "c",
          label: "You are safe — a wave near your turret is a defensive position",
          explain:
            "Safe and stuck are different things. A freeze is safe from ganks and useless for everything else, which is the trade they chose for you rather than one you chose.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.4,
    games: 3,
    instruction:
      "Next 3 games: before every shove, say out loud what you are spending the ten seconds on. If the answer is nothing, hold the wave instead. Shove and leave 40 seconds before every drake, not on the timer.",
  },
};
