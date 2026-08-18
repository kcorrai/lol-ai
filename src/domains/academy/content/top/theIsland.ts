import type { Lesson } from "@/domains/academy/types";

export const theIsland: Lesson = {
  slug: "the-island",
  trackId: "top",
  title: "The Island",
  summary:
    "Top lane is the furthest point on the map from everything that wins the game. That one fact decides how you farm, when you fight, and why nobody is coming to help you.",
  minutes: 5,
  access: "free",
  objectives: [
    "Explain why a gank in top lane is the most expensive gank on the map",
    "Judge a trade by whether you can survive the follow-up, not by who won it",
    "Set the wave before you need it, because help arrives late in this lane",
  ],
  fixes: ["high_deaths", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Every other lane is a short walk from an objective. Bot lane sits on top of the drake pit. Mid is thirty seconds from either. Top is the far end of the map from the drake, the herald spawns on your side but the fight for it happens without you, and the only thing you are close to is the enemy jungler's red buff. Players call top an island as a joke about being ignored. It is not a joke — it is the constraint the whole role is built around.",
    },
    {
      kind: "keyPoint",
      title: "Distance is why nobody comes",
      text: "A jungler who ganks top spends around forty seconds walking, in the half of the map where their own camps are not. A jungler who ganks bot spends fifteen and is standing next to the drake when it is over. The gank that helps you is the most expensive one they can make, so it is the one they make least. Both junglers know this, which is why top lanes are decided by two people far more often than any other lane.",
    },
    {
      kind: "table",
      caption: "What the distance actually changes",
      head: ["In bot lane", "In top lane", "So you"],
      rows: [
        ["Help arrives in 15s", "Help arrives in 40s, or not at all", "Play the wave, not the fight"],
        ["Dying costs the drake", "Dying costs a wave and a plate", "Can afford to lose, cannot afford to lose repeatedly"],
        ["Two people, four hands", "One person, and a jungler who is elsewhere", "Own the whole lane state yourself"],
        ["Roams are short", "Roams cost you the lane", "Leave only with a wave that survives without you"],
      ],
    },
    { kind: "drill", drillId: "island-quiz" },
    {
      kind: "mistake",
      title: "Winning the trade and losing the lane",
      text: "You take a good trade at level four — you land your combo, they walk away at forty percent, you are at seventy. Fifteen seconds later their jungler walks out of the tri-brush and kills you, because a trade you won is a trade that left you standing in the middle of a lane with a big wave and no cooldowns.",
      fix: "In top lane a trade is not finished when the health bars settle. It is finished when you are back in a position you can be ganked in and survive. Before you press anything, check the wave — if it is on their side and you are pushing, the trade you win is the one that kills you.",
    },
    {
      kind: "keyPoint",
      title: "The lane is decided by the wave more than by the matchup",
      text: "You will lose lanes you were favoured in because the wave sat in the wrong place for ten minutes, and you will survive lanes you were counterpicked in because it sat in the right one. Being alone means the wave is the only teammate you have. Whoever is worse at moving it loses the island, whatever the champions say.",
    },
    { kind: "drill", drillId: "island-decision" },
    {
      kind: "checklist",
      title: "Before you press a button in top lane",
      items: [
        "Where is the wave going to be in eight seconds, not where is it now",
        "Is their jungler top-side — and if you do not know, assume the answer is yes",
        "Do you have an escape after the combo, or only during it",
        "If this trade goes badly, do you lose health or do you lose the wave as well",
      ],
    },
  ],
  drills: [
    {
      id: "island-quiz",
      kind: "quiz",
      prompt:
        "Why is a jungler far less likely to gank top than bot, even when the top laner is winning?",
      options: [
        {
          id: "a",
          label: "The walk costs them their own farm and puts them far from the next objective",
          explain:
            "Correct. It is forty seconds of pathing away from their camps and away from the drake. The gank has to be worth all of that, not just worth the kill — which is why it usually happens once, on a timer you can predict.",
          correct: true,
        },
        {
          id: "b",
          label: "Top laners are usually tankier and harder to kill",
          explain:
            "Sometimes true and not the reason. Junglers gank squishy top laners just as rarely; it is the distance that decides, not the target.",
          correct: false,
        },
        {
          id: "c",
          label: "Top lane matters less to the outcome of the game",
          explain:
            "It does not — a top laner who takes over a side lane ends games. The jungler's problem is the cost of getting there, not the value once they arrive.",
          correct: false,
        },
        {
          id: "d",
          label: "The lane is too short for a gank to work",
          explain:
            "Top is the same length as bot. The difference is what is on either side of it: their camps and the drake are both on the other half of the map.",
          correct: false,
        },
      ],
    },
    {
      id: "island-decision",
      kind: "decision",
      situation:
        "8:00. You are 20 HP ahead in a mirror matchup and your combo is up. The wave is four minions in their favour and slowly pushing toward you. You have not seen their jungler since the first camp.",
      facts: [
        "You are slightly ahead on health, cooldowns up",
        "Wave is pushing toward you — you are on the safer side",
        "Their jungler has been missing for 90 seconds",
        "Your own jungler is bot side, doing drake",
      ],
      options: [
        {
          id: "a",
          label: "Take the trade — the wave coming to you means you can back off after it",
          explain:
            "Correct. A wave moving toward you is the one condition that makes a top-lane trade safe: after the combo you are near your own turret, not stranded past the river brush. This is what 'trade on your own half' means in practice.",
          correct: true,
        },
        {
          id: "b",
          label: "Shove the wave in first so you can trade with minion help",
          explain:
            "That hands away the exact thing that makes the trade safe. Shoving puts you at their turret with a jungler you have not seen for a minute and a half — the health you win is worth less than the position you lose.",
          correct: false,
        },
        {
          id: "c",
          label: "Do nothing until you see their jungler on the map",
          explain:
            "Too passive. You will not see him, and the wave state you have right now is temporary. Waiting for perfect information in top lane means never pressing anything.",
          correct: false,
        },
        {
          id: "d",
          label: "Back off and give up the wave to be safe",
          explain:
            "Safety you do not need. The wave is walking toward your turret on its own; giving it up costs you the CS and the health lead you built for exactly this moment.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: before every trade in the first fifteen minutes, check which way the wave is moving. Only commit when it is moving toward your own turret. Count the trades you skip — that is the habit, not the ones you take.",
  },
};
