import type { Lesson } from "@/domains/academy/types";

export const gankConditions: Lesson = {
  slug: "gank-conditions",
  trackId: "jungle",
  title: "A Gank Has Three Conditions",
  summary:
    "Ganks fail for the same three reasons every time, and all three are visible before you leave your camp. The lane you want to help is usually the one you should not.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Check wave, crowd control and follow-up before committing to a gank",
    "Stop ganking the losing lane just because it is the loudest",
    "Price a failed gank in camps rather than in flash",
  ],
  fixes: ["high_deaths", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "A gank is not an act of generosity, and the lane asking hardest is usually the lane where it works worst. Three things have to be true at once — the wave has to be in the right place, somebody has to have a way to stop them moving, and your laner has to be strong enough to convert. Two out of three is a coinflip. One out of three is a donation.",
    },
    {
      kind: "table",
      caption: "The three conditions",
      head: ["Condition", "What it means", "What happens without it"],
      rows: [
        [
          "Wave",
          "Pushing toward your side, or frozen near your turret",
          "They walk backwards to their own turret and nothing happens",
        ],
        [
          "Crowd control",
          "You or your laner can stop them for a second",
          "They walk away at 40% health and you spent 30 seconds",
        ],
        [
          "Follow-up",
          "Your laner is even or ahead, with mana and cooldowns",
          "You do all the damage, they get the kill, and you are still level 4",
        ],
      ],
    },
    { kind: "drill", drillId: "gank-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Ganking the lane that is losing",
      text: "Your bot lane is two kills down and pinging constantly. You go. They are pushed to their own turret with no summoners, the enemy is ahead and holding an escape, and your gank turns into a two-for-one. Now the lane is four kills down, and you are the one who paid for it in camps and levels.",
      fix: "The lane most worth ganking is the one that is even or slightly ahead with a pushed wave, because there the gank converts into a turret plate or a dive that the enemy cannot punish. A lane that is losing needs a wave state and a level, not a body. Say so once, then go and win the other side of the map — the fastest way to help a losing lane is to make their jungler have to answer you somewhere else.",
    },
    {
      kind: "keyPoint",
      title: "The cost of a failed gank is measured in camps",
      text: "Junglers price a bad gank in summoner spells. The real bill is the ninety seconds: the walk there, the wait, the walk back, and the camps that respawned and stood there while you were doing it. That is a level. Losing a level to a jungler who was farming is how the second half of the game gets decided before anybody has fought.",
    },
    { kind: "drill", drillId: "gank-decision" },
    {
      kind: "checklist",
      title: "Before you leave the camp",
      items: [
        "Is the wave moving toward my side, or am I ganking into their turret",
        "Who has the crowd control — me, them, or nobody",
        "Is my laner able to follow up, or am I doing this alone",
        "If it fails, what does it cost me — and is that cheaper than the camp I am standing on",
      ],
    },
  ],
  drills: [
    {
      id: "gank-quiz",
      kind: "quiz",
      prompt: "Which lane state makes a gank most likely to convert into something?",
      options: [
        {
          id: "a",
          label: "The wave is pushing toward your side and your laner is even with cooldowns up",
          explain:
            "Correct. The wave gives you the distance to close, and an even laner with cooldowns is the difference between a kill and a summoner spell. This is also the lane least likely to be asking you to come.",
          correct: true,
        },
        {
          id: "b",
          label: "The wave is pushed into their turret and your laner is behind",
          explain:
            "Both conditions inverted. You have the longest possible walk into turret range against somebody who only has to step backwards, in a lane that cannot punish the retreat.",
          correct: false,
        },
        {
          id: "c",
          label: "Your laner is far behind and asking for help",
          explain:
            "The most common gank in the game and the one with the worst returns. A losing laner has no follow-up, and the gank usually ends up feeding the lane further.",
          correct: false,
        },
        {
          id: "d",
          label: "The lane is frozen in the middle with both players at full health",
          explain:
            "A neutral wave in the middle gives you nothing to work with — no distance to close, no pressure on them, and a clean walk home for whoever is being ganked.",
          correct: false,
        },
      ],
    },
    {
      id: "gank-decision",
      kind: "decision",
      situation:
        "7:20. Your bot lane is 0/3 and pinging for help; the wave is at their turret. Your mid lane is even, has just pushed a wave into the enemy, and the enemy mid is low on mana with no flash.",
      facts: [
        "Bot: 0/3, wave at the enemy turret, both summoners down",
        "Mid: even, wave pushing back toward your side, enemy mid has no flash",
        "You are level 6 with smite and your ultimate up",
        "Drake spawns in 90 seconds",
      ],
      options: [
        {
          id: "a",
          label:
            "Gank mid — the wave, the missing flash and an even laner are all three conditions",
          explain:
            "Correct. Every condition is true at once, and it puts you mid at level six ninety seconds before a drake, which is where you want to be standing anyway. Bot will still be losing either way; this is the gank that changes something.",
          correct: true,
        },
        {
          id: "b",
          label: "Gank bot — they need it most and the pings will not stop",
          explain:
            "The wave is at their turret and your laner has nothing left. This is the gank that turns 0/3 into 0/5 and puts you on the wrong side of the map for the drake.",
          correct: false,
        },
        {
          id: "c",
          label: "Take drake early on your own before it spawns is contested",
          explain:
            "It is not up for ninety seconds, and standing near an empty pit is the most expensive kind of waiting. Use the window on a gank that improves the fight for it.",
          correct: false,
        },
        {
          id: "d",
          label: "Farm your own camps and answer whichever lane collapses first",
          explain:
            "Safe, and it gives away a gank that had all three conditions. Farming is what you do when nothing is available — something is.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 4,
    games: 3,
    instruction:
      "Next 3 games: before every gank, check the wave, the crowd control and whether your laner can follow up. If any one of the three is missing, take the nearest camp instead and gank the next wave.",
  },
};
