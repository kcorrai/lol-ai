import type { Lesson } from "@/domains/academy/types";

export const theClearIsThePlan: Lesson = {
  slug: "the-clear-is-the-plan",
  trackId: "jungle",
  title: "The Clear Is the Plan",
  summary:
    "Junglers think their decisions are the ganks. They are not — the route decides which ganks were ever possible. Camps are a clock, and your clear is how you spend it.",
  minutes: 5,
  access: "free",
  objectives: [
    "Treat time, not gold, as the resource the jungle actually spends",
    "Choose a first clear by where you want to be at 3:15, not by which camp is nearest",
    "Stop leaving camps standing while you wait for something to happen",
  ],
  fixes: ["low_cs", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Every camp in the jungle respawns on a timer that started without you. Whether or not you are there, the clock runs — which means a jungler standing still in a river brush waiting for a gank is not being patient, they are being charged. Junglers who climb are not the ones with better mechanics in ganks. They are the ones whose route already had them standing in the right place when the gank became available.",
    },
    {
      kind: "keyPoint",
      title: "Your currency is time, and camps are how you get paid",
      text: "A laner's decision is 'do I trade'. A jungler's is 'what am I doing for the next ninety seconds', and every answer costs camps that were going to be free. This is why a full clear that ends next to a gankable lane beats a three-camp clear that ends nowhere: the gold is the same, but one of them bought a position and the other bought a walk.",
    },
    {
      kind: "table",
      caption: "Two clears, the same three minutes",
      head: ["", "Full clear", "Three-camp into a gank"],
      rows: [
        ["Level at 3:15", "Level 4", "Level 3"],
        ["Where you finish", "Wherever you planned", "Wherever the gank was"],
        ["If the gank fails", "Nothing lost", "Two camps and a level"],
        ["Best against", "A jungler who invades", "A lane that is already pushed to your turret"],
      ],
    },
    { kind: "drill", drillId: "clear-quiz" },
    {
      kind: "mistake",
      title: "Hovering",
      text: "You finish a camp, see a lane that is nearly gankable, and sit in the brush waiting for the wave to come to your side. Twenty seconds pass. The gank never opens, and you leave with two camps up on your own side and a level behind the enemy jungler, who spent those twenty seconds clearing.",
      fix: "Never wait for a lane. If a gank is not on right now, take the camp next to you and come back — the camp takes ten seconds and the lane will be in a better state when you return. Waiting is the single most expensive thing a jungler can do and it does not feel like it costs anything.",
    },
    {
      kind: "keyPoint",
      title: "The route ends somewhere on purpose",
      text: "Before you take the first camp, know which half of the map you want to be on at three minutes and again at five. Scuttle spawns at 3:15 and the first drake at five — a clear that finishes next to either one is a clear that gets you a free objective, and a clear that finishes on the wrong side gives it to the other jungler for the same effort.",
    },
    { kind: "drill", drillId: "clear-decision" },
    {
      kind: "checklist",
      title: "Before the first camp",
      items: [
        "Which side is my scuttle at 3:15, and does my route end there",
        "Which of my lanes can actually be ganked at level three — pushed, with CC",
        "Where does their jungler start, and does my route walk into theirs",
        "If nothing opens, which camp am I taking instead of waiting",
      ],
    },
  ],
  drills: [
    {
      id: "clear-quiz",
      kind: "quiz",
      prompt: "What does a jungler actually spend when they sit in a brush waiting for a gank?",
      options: [
        {
          id: "a",
          label: "Camp respawn time — the jungle keeps paying whether they collect it or not",
          explain:
            "Correct. Camps are on a clock that runs regardless. Twenty seconds of hovering is twenty seconds of gold and experience that was available and went uncollected, and the enemy jungler collected theirs.",
          correct: true,
        },
        {
          id: "b",
          label: "Nothing — waiting is free if the gank lands",
          explain:
            "It is only free if it lands, and most hovers do not. Pricing a decision by its best outcome is how junglers end laning phase two levels down.",
          correct: false,
        },
        {
          id: "c",
          label: "Vision, because they are not warding while waiting",
          explain:
            "A real cost, but a small one next to the camps. The clock is the thing that never stops.",
          correct: false,
        },
        {
          id: "d",
          label: "Their smite cooldown",
          explain:
            "Smite is not spent by standing still. The resource being burned is time, and it is being burned at full price.",
          correct: false,
        },
      ],
    },
    {
      id: "clear-decision",
      kind: "decision",
      situation:
        "3:05. You have two camps left on your bottom side. Scuttle spawns in ten seconds on the top river. Your mid lane is pushing toward the enemy turret and their jungler started top side.",
      facts: [
        "Two camps up on your bottom side",
        "Scuttle spawns top in 10 seconds; their jungler started top",
        "Your mid is pushing into their turret — not gankable",
        "You are level 3, they are probably level 3 as well",
      ],
      options: [
        {
          id: "a",
          label: "Finish the two bottom camps and take the bottom scuttle instead",
          explain:
            "Correct. Contesting a scuttle on the side their jungler started is a coinflip you did not need, while the two camps and the far scuttle are uncontested gold. Take what nobody is standing next to.",
          correct: true,
        },
        {
          id: "b",
          label: "Walk top now to contest the scuttle",
          explain:
            "You arrive at the same time as a jungler who is closer, at even level, with two camps left standing behind you. Even winning it leaves you down the camps you abandoned.",
          correct: false,
        },
        {
          id: "c",
          label: "Gank mid to make something happen",
          explain:
            "The wave is pushed into their turret, which is the one state where a gank cannot work. You would walk past two camps to arrive at a lane that has nothing for you.",
          correct: false,
        },
        {
          id: "d",
          label: "Wait near the mid river for their jungler to show himself",
          explain:
            "Hovering. Ten seconds of nothing, and the answer you get is one you could have had from your camps by looking at where he was last seen.",
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
      "Next 3 games: never stand still waiting for a lane. If a gank is not available the moment you arrive, take the nearest camp and come back. Plan your first clear to finish on the scuttle side you intend to take.",
  },
};
