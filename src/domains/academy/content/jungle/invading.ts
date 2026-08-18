import type { Lesson } from "@/domains/academy/types";

export const invading: Lesson = {
  slug: "invading",
  trackId: "jungle",
  title: "What a Stolen Camp Actually Costs",
  summary:
    "Invading is not a fight you go looking for. It is a way of spending the enemy jungler's time, and it works best when he is nowhere near you.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Invade for the camp and the tempo, not for the duel",
    "Only enter their jungle when you know which half they are on",
    "Give up your own camps deliberately when the trade is in your favour",
  ],
  fixes: ["high_deaths", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "The word invade makes players think of a 1v1 in somebody else's jungle. That is the rarest and worst version of it. An invade is a camp taken off their timer, and the good ones happen when the enemy jungler is on the opposite side of the map doing something slower than walking — which you already know, because you have been tracking him since the first leash.",
    },
    {
      kind: "keyPoint",
      title: "You are stealing time, not gold",
      text: "The camp is worth a bit under a wave of minions. What it actually costs them is the walk: they arrive at an empty clearing, lose the tempo of their route, and have to decide whether to cross the map to answer. A jungler who is one camp down is annoyed. A jungler who has had his route broken twice is behind in levels, and that is a different game.",
    },
    {
      kind: "table",
      caption: "When the invade is on",
      head: ["Situation", "Invade?", "Why"],
      rows: [
        ["You just watched him gank the far lane", "Yes", "He is committed and cannot answer for forty seconds"],
        ["You have priority in mid and he does not", "Yes", "Your mid can walk in with you; his cannot walk in behind you"],
        ["You have not seen him for a minute", "No", "You are walking into a coinflip in the worst half of the map"],
        ["You are behind in levels and want to catch up", "No", "The invade is a tempo play, and tempo is what you do not have"],
      ],
    },
    { kind: "drill", drillId: "invade-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Invading to find him",
      text: "You have not seen the enemy jungler for ninety seconds, so you walk into their jungle to check. You find him — on his own camp, at full health, next to his mid laner, with a ward that saw you coming. You die, and the two camps you would have taken at home go stale while you walk back.",
      fix: "Invading is what you do with information, not how you get it. If you do not know where he is, the correct move is to take your own camps and let the map tell you. Walking into the enemy jungle to find a jungler is the single most common way a jungler falls two levels behind before ten minutes.",
    },
    {
      kind: "keyPoint",
      title: "Giving up your own camps is sometimes the trade",
      text: "If he is in your bottom jungle and you are in his top jungle, you are not losing — you are trading camps at even value while being further from his team than he is from yours. The mistake is turning around to defend. Two camps are two camps; a jungler who chases his own camps across the map ends up taking neither and arriving at the objective last.",
    },
    { kind: "drill", drillId: "invade-decision" },
    {
      kind: "checklist",
      title: "Before stepping into their jungle",
      items: [
        "Do I know where he is right now, or am I guessing",
        "Do I have lane priority on the side I am entering from",
        "Am I taking a camp and leaving, or am I hoping for a fight",
        "If he shows up with a laner, what is my way out — and is it warded",
      ],
    },
  ],
  drills: [
    {
      id: "invade-quiz",
      kind: "quiz",
      prompt: "What is the main thing a successfully stolen enemy camp costs its owner?",
      options: [
        {
          id: "a",
          label: "The tempo — their route is broken and they walk to an empty clearing",
          explain:
            "Correct. The gold is minor; the broken route is what matters. They lose the time, the position their clear was supposed to end in, and have to make a decision they had not planned on.",
          correct: true,
        },
        {
          id: "b",
          label: "The gold, which is worth about half an item over a game",
          explain:
            "A single camp is worth less than a wave of minions. If gold were the point, farming your own jungle safely would beat every invade ever made.",
          correct: false,
        },
        {
          id: "c",
          label: "Their vision, since they have to re-ward the area",
          explain:
            "A side effect, not the cost. Most junglers do not ward their own camps at all, and the ones who do have already paid for it.",
          correct: false,
        },
        {
          id: "d",
          label: "Their smite, which they usually spend defending",
          explain:
            "Smite is spent on objectives, not camps they arrive at too late. If they are close enough to smite the camp you are taking, this was a fight and not an invade.",
          correct: false,
        },
      ],
    },
    {
      id: "invade-decision",
      kind: "decision",
      situation:
        "9:10. You are in the enemy's top-side jungle taking their raptors. Your minimap shows the enemy jungler has just started your bottom-side camps. Drake spawns in two minutes.",
      facts: [
        "You are taking their top camps; he is taking your bottom ones",
        "Drake spawns in 2 minutes, bottom side",
        "Neither of you has been seen by the other's team",
        "You are even in levels",
      ],
      options: [
        {
          id: "a",
          label: "Finish their top camps, then move down toward the drake side",
          explain:
            "Correct. The camp trade is even, and turning around to defend yours would mean taking neither. Finishing and moving toward the objective converts an even trade into a better position for the thing that actually decides the next two minutes.",
          correct: true,
        },
        {
          id: "b",
          label: "Turn around and rush back to defend your bottom camps",
          explain:
            "You arrive after they are gone, having abandoned camps you were already standing on. Chasing your own jungle across the map is how a jungler ends up down two camps instead of level.",
          correct: false,
        },
        {
          id: "c",
          label: "Go and fight him in your own jungle",
          explain:
            "He is closer to his own team than you are to yours, and you would be fighting on the half of the map his lanes can walk to. An even camp trade does not need to become a coinflip.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall to buy while you are even and reset",
          explain:
            "It gives up the rest of their top-side jungle and puts you further from the drake with two minutes on the clock. Reset after the objective, not before it.",
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
      "Next 3 games: only enter the enemy jungle when you have seen their jungler on the other half of the map within the last twenty seconds. Take the camp and leave — no invading to look for a fight.",
  },
};
