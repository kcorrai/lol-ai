import type { Lesson } from "@/domains/academy/types";

export const minimapRhythm: Lesson = {
  slug: "minimap-rhythm",
  trackId: "vision",
  title: "The Minimap Rhythm",
  summary:
    "Nobody looks at the minimap more by deciding to look at it more. It is a habit with triggers, it fits in the dead time you already have, and it ends in a decision or it did not happen.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Name the five events that must trigger a look",
    "Use the dead time you already have instead of finding new attention",
    "Turn a glance into a decision rather than a feeling",
  ],
  fixes: ["high_deaths", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Every guide about the minimap says the same useless thing: look at it more often. You have tried that. It works for ninety seconds, and then a trade happens and you are back to watching your own champion until you die to somebody who walked in from a screen away. The problem is not willpower. It is that 'look more' is not a trigger, and habits need triggers.",
    },
    {
      kind: "keyPoint",
      title: "Five triggers, and nothing else",
      text: "Look when you press recall. Look when a minion dies to your last hit and the next one is not in range. Look when you cast an ability on the wave. Look when your health or mana crosses a threshold that changes what you can do. Look the moment anything on the map makes a noise — a ping, a kill, an objective. Those are moments you already have; you do not need new attention, you need to spend the attention you are wasting.",
    },
    {
      kind: "prose",
      text: "The second trigger is the one that does the work. Between last hits there is a gap of one to three seconds where nothing is happening and your eyes are still on the wave, waiting. That gap repeats fifteen times a minute. Fifteen looks a minute is more than a Challenger player needs, and you get it for free without moving your attention away from anything that matters.",
    },
    {
      kind: "mistake",
      title: "The panic glance",
      text: "You feel unsafe, so you look at the minimap, see nothing that resolves the feeling, and go back to farming while still feeling unsafe. Nothing changed. You looked, you did not read.",
      fix: "A look ends in a sentence: 'four visible, jungler missing thirty seconds, last seen bottom — I am fine to push one more wave' or 'I am not'. If no sentence comes out, you glanced at a picture. The sentence is the skill, not the glance.",
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The read itself takes about a third of a second once it is trained, and it always goes in the same order. Count first — how many of them can I see — because a number is faster to notice than five separate absences. Then name who is missing, because 'the jungler' and 'the mid laner' carry completely different threats. Then place them: where were they last, and how long ago. Only then, the decision: does the missing one reach me before my escape does?",
    },
    { kind: "drill", drillId: "minimap-order" },
    {
      kind: "keyPoint",
      title: "Thirty seconds is the number that matters",
      text: "An unseen jungler can be almost anywhere within thirty seconds of the last time you saw them. Under thirty seconds, the danger has a direction — the side they were on. Over thirty seconds, treat the whole map as possible and stop standing anywhere you would not want to be collapsed on. Most deaths that feel unfair are twenty seconds of standing in a place that stopped being safe forty seconds ago.",
    },
    {
      kind: "checklist",
      title: "Building the habit in three games",
      items: [
        "Game one: look every time you recall and every time a ping sounds. Nothing else.",
        "Game two: add the gap between last hits — the free fifteen a minute",
        "Game three: force the sentence out loud on every look until it stops needing forcing",
        "Then stop counting. If you are still counting after three games, the trigger is wrong, not you",
      ],
    },
    { kind: "drill", drillId: "minimap-quiz" },
  ],
  drills: [
    {
      id: "minimap-order",
      kind: "order",
      prompt:
        "Put the one-glance read in the order that makes it fast. The order is not decoration — each step exists to make the next one cheaper.",
      items: [
        { id: "decide", label: "Decide whether where you are standing is still safe" },
        { id: "count", label: "Count how many enemies are visible" },
        { id: "place", label: "Place the missing ones — where and how long ago" },
        { id: "name", label: "Name which enemies are missing" },
      ],
      correctOrder: ["count", "name", "place", "decide"],
      explain:
        "Counting is one perception instead of five, and it is what tells you there is anything to think about at all. Naming comes next because the threat depends entirely on who is missing. Placing them turns a name into a direction, and only then is there a decision to make — a decision attempted before the count is a guess wearing a process.",
    },
    {
      id: "minimap-quiz",
      kind: "quiz",
      prompt:
        "You are mid, farming, and the enemy jungler has been missing for forty seconds. Your wave is about to push to their turret. What does the rhythm say?",
      options: [
        {
          id: "a",
          label: "Stop shoving and hold the wave where you can reach your turret",
          explain:
            "Correct. Past thirty seconds the missing jungler has no direction, so the whole map is possible and a pushed wave puts you at the far end of it. The wave is not worth the coin flip — and if you have a ward, this is what it was for.",
          correct: true,
        },
        {
          id: "b",
          label: "Push it anyway — you would have seen him if he was close",
          explain:
            "You would have seen him if he walked through vision you own, which past thirty seconds you probably do not. Absence of information is not information.",
          correct: false,
        },
        {
          id: "c",
          label: "Ping the jungler and keep pushing while you wait for a response",
          explain:
            "The ping is right and the pushing is not. You are betting your position on a teammate reading a ping inside the two seconds it takes to be collapsed on.",
          correct: false,
        },
        {
          id: "d",
          label: "Back immediately — forty seconds unseen means a gank is happening",
          explain:
            "Too far the other way. Forty seconds unseen means unknown, not incoming, and giving up the wave and your position on every unknown hands the lane over for free.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 1,
    games: 3,
    instruction:
      "Next 3 games: look at the minimap on every recall, every ping and in the gap after every last hit, and finish each look with a sentence naming who is missing and for how long. Do not push past the middle of the lane while anyone is missing over 30 seconds.",
  },
};
