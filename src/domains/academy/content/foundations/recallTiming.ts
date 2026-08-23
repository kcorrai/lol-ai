import type { Lesson } from "@/domains/academy/types";

export const recallTiming: Lesson = {
  slug: "recall-timing",
  trackId: "foundations",
  title: "Recall Timing",
  summary:
    "When you go back matters more than what you buy. A good recall costs nothing; a bad one costs a wave, a turret and your tempo.",
  minutes: 5,
  access: "free",
  objectives: [
    "Recognise the two moments when a recall is free",
    "Explain what 'tempo' means in concrete gold terms",
    "Stop recalling on low health as a reflex",
  ],
  fixes: ["low_cs", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "New players recall when their health bar looks scary. Good players recall when the wave says they can. Those are completely different triggers, and the gap between them is worth several hundred gold a game.",
    },
    {
      kind: "keyPoint",
      title: "A recall is free when the wave cannot punish it",
      text: "There are exactly two of those moments in a normal lane. One: the wave has just crashed into the enemy turret, so the next wave will bounce back toward you and nothing dies while you are gone. Two: the wave is slow-pushing toward you and will sit safely under your own turret. Any other recall gives away minions.",
    },
    {
      kind: "prose",
      text: "The cost of a bad recall is easy to underestimate because it does not appear anywhere on the scoreboard. Recall on a wave that is sitting in the middle of the lane and you lose a wave walking back — roughly 105–165g — plus whatever plates the enemy takes with the free shove. Do that four times in a game and you have donated an item.",
    },
    {
      kind: "table",
      caption: "Recall triggers, ranked",
      head: ["Trigger", "Verdict"],
      rows: [
        ["Wave just crashed into their turret", "Best — free, and the bounce comes back to you"],
        ["Wave slow-pushing into your turret", "Good — nothing dies while you are away"],
        [
          "You just hit an item threshold and the wave is neutral",
          "Acceptable — pay the wave, buy the spike",
        ],
        [
          "Low health, wave in the middle of the lane",
          "Bad — you pay the wave and they get the shove",
        ],
        ["Bored / nothing happening", "Worst — a recall with no purchase behind it"],
      ],
    },
    {
      kind: "mistake",
      title: "Recalling at 20% health with a neutral wave",
      text: "Low health feels like an emergency, so you back. The wave is mid-lane, the enemy shoves it in, takes two plates, and recalls on the crash — arriving back in lane before you with more gold.",
      fix: "If you are low but not in danger, push the wave to the turret first and recall on the crash. If you are actually in danger, that is a positioning problem, not a recall problem — cover it with the next lesson on vision.",
    },
    { kind: "drill", drillId: "recall-decision" },
    {
      kind: "prose",
      text: "There is a second, sharper version of this idea called tempo. Tempo is the answer to: 'who gets back to lane first, and with what?' Two players recall at the same moment. One crashed the wave and buys a completed item; the other backed off a mid-lane wave and buys a component. The first player returns to a bouncing wave with an item spike. The second returns to a wave already crashing into their own turret, behind on items. Nothing on the scoreboard changed, and the lane just tilted.",
    },
    {
      kind: "checklist",
      title: "Before you press B",
      items: [
        "Where is the wave, and where will it be in 15 seconds?",
        "Can I afford something that actually changes a fight, or am I buying a control ward and walking back for no reason?",
        "If I leave now, what does my opponent get for free?",
      ],
    },
    { kind: "drill", drillId: "recall-quiz" },
  ],
  drills: [
    {
      id: "recall-decision",
      kind: "decision",
      situation:
        "7:40. You are at 30% health with 1,100 gold. Your wave is three minions strong and slowly pushing toward the enemy turret. The enemy laner is at full health and has just recalled.",
      facts: [
        "You: 30% health, 1,100g",
        "Enemy: full health, recalled 5 seconds ago",
        "Wave: slowly pushing toward their turret, will crash in ~15s",
        "No enemy jungler seen for 30s",
      ],
      options: [
        {
          id: "a",
          label: "Push the wave into the turret, then recall",
          explain:
            "Correct. The enemy is already in base, so the lane is safe for those 15 seconds. Crashing the wave means nothing dies while you are gone and the bounce comes back to you — you return to lane at the same time they do, with a wave in your favour.",
          correct: true,
        },
        {
          id: "b",
          label: "Recall now — you are low and they are in base",
          explain:
            "You would get back to lane at roughly the same time, but the wave crashes without you and they take it under their turret. You paid a wave for 15 seconds you did not need.",
          correct: false,
        },
        {
          id: "c",
          label: "Stay in lane and keep farming at 30%",
          explain:
            "You are giving up an item spike and staying at low health for no gain. The enemy will return at full health with a purchase while you are still at 30% with 1,100g in your pocket.",
          correct: false,
        },
      ],
    },
    {
      id: "recall-quiz",
      kind: "quiz",
      prompt:
        "What is the actual cost of recalling with the wave sitting in the middle of the lane?",
      options: [
        {
          id: "a",
          label: "Roughly a wave of minions plus whatever they take with the free shove",
          explain:
            "Correct — around 105–165g in minions, plus plates or turret damage, plus the fact that they now control where the next wave sits.",
          correct: true,
        },
        {
          id: "b",
          label: "Nothing, as long as you get back quickly",
          explain:
            "Minions die on their own schedule whether you are there or not. Speed of return does not recover the wave you were not present for.",
          correct: false,
        },
        {
          id: "c",
          label: "Only the time spent walking back",
          explain:
            "The walk is the smallest part. The wave and the free shove they get are the real bill.",
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
      "Next 3 games: do not press B unless the wave has just crashed or is slow-pushing to your turret. If you are low with a neutral wave, shove it first. Count how many times you break this rule.",
  },
};
