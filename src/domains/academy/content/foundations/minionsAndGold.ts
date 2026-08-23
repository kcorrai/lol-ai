import type { Lesson } from "@/domains/academy/types";

export const minionsAndGold: Lesson = {
  slug: "minions-and-gold",
  trackId: "foundations",
  title: "Minions, Gold & Why CS Beats Kills",
  summary:
    "A wave is worth more than a kill and it arrives every 30 seconds. Learn what a wave is actually worth and why missing CS is the most expensive habit in the game.",
  minutes: 5,
  access: "free",
  objectives: [
    "Know roughly what one full wave is worth in gold",
    "Compare the gold value of a wave against the gold value of a kill",
    "Diagnose your own CS number against a realistic target instead of a pro's",
  ],
  fixes: ["low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Minions are the only income in League that arrives on a schedule, costs nothing, and cannot fight back. Every 30 seconds a new wave walks down each lane and offers you gold in exchange for one skill: hitting a low-health minion at the right moment. Players who are bad at that skill are permanently poorer than players who are good at it, and no amount of kills fixes it, because kills are random and waves are not.",
    },
    {
      kind: "table",
      caption: "What a wave is worth (early game, approximate)",
      head: ["Minion", "Gold", "Per wave"],
      rows: [
        ["Melee minion (×3)", "~21g", "~63g"],
        ["Caster minion (×3)", "~14g", "~42g"],
        ["Siege / cannon (every 3rd wave)", "~60g+", "~60g"],
        ["Full wave, no cannon", "—", "~105g"],
        ["Full wave with cannon", "—", "~165g"],
      ],
    },
    {
      kind: "keyPoint",
      title: "The exchange rate",
      text: "An early kill is worth 300g. A full wave is worth roughly 105–165g. So one kill is about two waves — one minute of farming. If you die trying to force a kill and lose the next two waves walking back to lane, you have paid for the kill twice and got nothing.",
    },
    {
      kind: "prose",
      text: "That is the whole argument for CS, and it is worth sitting with. Missing 5 CS per minute for 20 minutes is 100 CS. At roughly 20g a minion that is 2,000 gold: a full legendary item you never bought, in a game where you may have died four times. The four deaths feel like the reason you lost. The missing item is the reason.",
    },
    {
      kind: "mistake",
      title: "Watching the enemy instead of the minions",
      text: "In the first five minutes most low-CS players are staring at the enemy champion, waiting to react. Minions die untouched two inches away.",
      fix: "For the first 5 minutes, look at minion health bars, not the enemy. Your peripheral vision and the minimap will tell you if something is coming. Trade only when a minion is not about to die.",
    },
    {
      kind: "prose",
      text: "The second thing to understand is that CS is not only gold — it is position. The side of the lane your minions die on decides where you are standing, and where you are standing decides whether the enemy jungler can reach you. That relationship is what the whole Laning track is built on, and it starts with a simple observation: minions push toward whoever is not killing them.",
    },
    { kind: "drill", drillId: "cs-value-quiz" },
    {
      kind: "checklist",
      title: "Realistic CS targets by 10 minutes",
      items: [
        "Iron–Silver: 55–65 CS is a real improvement over where most players are",
        "Gold–Platinum: 70–80 CS by 10 minutes in a normal lane",
        "Diamond+: 80–90 CS, and consistently, not on your best game",
        "Support and most junglers: CS is not the metric — ignore this list, use vision and objectives instead",
      ],
    },
    {
      kind: "prose",
      text: "Notice those targets are per 10 minutes, not per game. CS per minute is the number that survives comparison between a 22-minute stomp and a 40-minute slog, which is why it is the number the Academy tracks for you.",
    },
    { kind: "drill", drillId: "cs-or-kill-decision" },
  ],
  drills: [
    {
      id: "cs-value-quiz",
      kind: "quiz",
      prompt:
        "You can either recall now with a crashed wave, or stay for 30 more seconds to catch the incoming cannon wave and then recall. Roughly what is that 30 seconds worth?",
      options: [
        {
          id: "a",
          label: "About 165 gold, half a kill",
          explain:
            "Correct. A cannon wave is roughly 165g. That is half an early kill for zero risk — but only if the timing does not cost you the next wave under your own turret.",
          correct: true,
        },
        {
          id: "b",
          label: "About 60 gold, not worth it",
          explain:
            "60g is the cannon alone. The rest of the wave dies with it — six other minions worth another ~105g.",
          correct: false,
        },
        {
          id: "c",
          label: "About 300 gold, the same as a kill",
          explain: "That would be roughly two waves. One cannon wave is about half of that.",
          correct: false,
        },
      ],
    },
    {
      id: "cs-or-kill-decision",
      kind: "decision",
      situation:
        "6:10. Your opponent is at 35% health and standing just out of your range. Your wave has four minions about to die under your tower. Killing them requires you to stay; chasing requires you to leave.",
      facts: [
        "Enemy at 35% health, out of range, walking toward their turret",
        "4 minions dying under your turret in the next few seconds",
        "Enemy jungler last seen 40 seconds ago, unwarded",
        "You have no dash and no summoner spell advantage",
      ],
      options: [
        {
          id: "a",
          label: "Stay and take the four minions",
          explain:
            "Correct. Four minions is guaranteed gold with zero risk. The chase costs you those minions, gives you a coin flip on a champion who is already retreating toward safety, and puts you deep in an unwarded lane with a jungler unaccounted for.",
          correct: true,
        },
        {
          id: "b",
          label: "Chase — 35% is nearly dead",
          explain:
            "35% of an enemy walking toward their own turret with a jungler off the map is not nearly dead, it is bait. And the four minions die either way, so the chase already costs ~70g before anything goes wrong.",
          correct: false,
        },
        {
          id: "c",
          label: "Back off and recall",
          explain:
            "Not terrible, but you are giving up guaranteed gold that is seconds away. Take the minions, then decide about the recall on the next wave.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: for the first 5 minutes, do not look at the enemy champion. Watch minion health bars only. Check your CS at 10:00 and compare it to the target for your rank.",
  },
};
