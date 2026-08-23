import type { Lesson } from "@/domains/academy/types";

export const priorityIsTheJob: Lesson = {
  slug: "priority-is-the-job",
  trackId: "mid",
  title: "Priority Is the Whole Job",
  summary:
    "Mid lane is the shortest lane on the map and the only one within reach of both halves. Everything the role is worth comes from one thing: the right to leave.",
  minutes: 5,
  access: "free",
  objectives: [
    "Define priority as the right to leave the lane, not as being ahead",
    "Take priority before an objective window rather than during it",
    "Recognise the games where farming mid is the correct use of priority",
  ],
  fixes: ["objective_neglect", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Mid lane is short. That is the entire reason the role matters: from the middle of the map you are thirty seconds from the drake pit and thirty seconds from the herald, and no other laner is close to both. Whoever can leave mid first gets to decide what happens at either end, and the thing that decides who can leave is called priority.",
    },
    {
      kind: "keyPoint",
      title: "Priority is the right to leave, not the state of being ahead",
      text: "You have priority when the wave is heading into their turret and they cannot walk away from it without losing minions. That is it. A player who is three kills up but standing under their own turret with a wave crashing in has no priority — and the even player who just shoved has all of it. Priority is a wave state, and it is temporary, and it is the only thing your team is actually asking you for.",
    },
    {
      kind: "table",
      caption: "What priority buys, by minute",
      head: ["Minute", "What is happening", "What priority is worth"],
      rows: [
        [
          "0–8",
          "Scuttle and first ganks",
          "Your jungler wins the river fight because you can arrive",
        ],
        [
          "8–14",
          "Herald, first turrets",
          "The herald is taken by whoever can put four bodies near it",
        ],
        [
          "14–25",
          "Drakes, plates, first rotations",
          "You are the fourth player at every objective, on time",
        ],
        ["25+", "Baron, sieges", "The team with mid priority chooses where the fight happens"],
      ],
    },
    { kind: "drill", drillId: "priority-quiz" },
    {
      kind: "mistake",
      title: "Getting priority after the objective started",
      text: "Drake spawns, your jungler starts hitting it, and only then do you begin shoving your wave. By the time you arrive the fight is already twenty seconds old and has been a 4v5 the whole way — you brought priority to a fight that was decided before you had it.",
      fix: "Priority has to exist *before* the objective, which means the shove starts thirty to forty seconds early. That is the whole skill: reading the timer, not the fight. If you are shoving when the pit is already being hit, you are late by design.",
    },
    {
      kind: "keyPoint",
      title: "Sometimes the right use of priority is to farm",
      text: "Having the right to leave does not mean you have to. If there is no objective in the next minute, no gank available, and your side lanes are safe, the correct thing to do with priority is take the next three waves and be two levels up when the next window opens. Roaming into nothing is the most common way a mid laner turns an advantage into a deficit.",
    },
    { kind: "drill", drillId: "priority-decision" },
    {
      kind: "checklist",
      title: "The mid laner's clock",
      items: [
        "What is the next objective, and how long until it spawns",
        "Am I shoving forty seconds before it, or during it",
        "If I leave right now, does my turret take plates for it",
        "No objective in the next minute? Then farm — priority you spend on nothing is priority wasted",
      ],
    },
  ],
  drills: [
    {
      id: "priority-quiz",
      kind: "quiz",
      prompt: "Which of these players has priority in mid lane?",
      options: [
        {
          id: "a",
          label: "The even player who has just shoved the wave into the enemy turret",
          explain:
            "Correct. Priority is a wave state: their opponent has to stay and collect minions or lose them, while this player is free to walk. Kills and levels have nothing to do with it.",
          correct: true,
        },
        {
          id: "b",
          label:
            "The player who is three kills ahead but under their own turret with a wave incoming",
          explain:
            "Ahead and stuck. If they leave now they give up a whole wave and probably a plate, which means they cannot leave — which means no priority, whatever the scoreboard says.",
          correct: false,
        },
        {
          id: "c",
          label: "The player with a level advantage and a full mana bar",
          explain:
            "Levels and mana are what you use to *get* priority. They are not priority itself; the wave decides that.",
          correct: false,
        },
        {
          id: "d",
          label: "Whichever player has flash up",
          explain:
            "Flash is an escape, not a right to leave. A player with flash and a wave crashing into their turret still cannot go anywhere useful.",
          correct: false,
        },
      ],
    },
    {
      id: "priority-decision",
      kind: "decision",
      situation:
        "11:40. Herald spawns in 40 seconds on the top side. Your wave is in the middle of the lane, even. Your jungler is clearing top-side camps and has pinged the herald.",
      facts: [
        "Herald in 40 seconds, top side",
        "Wave is neutral in the middle of mid lane",
        "Your jungler is already top side",
        "Your opponent is even with you in level and health",
      ],
      options: [
        {
          id: "a",
          label: "Shove the wave now so you can walk top the moment it crashes",
          explain:
            "Correct. Forty seconds is exactly the window a shove needs. You arrive with the herald still uncontested, having given up nothing — which is what priority is for.",
          correct: true,
        },
        {
          id: "b",
          label: "Walk top now to be there early",
          explain:
            "You arrive first and give your opponent a free wave plus the option to follow you with the lane behind them. Leaving without shoving is how a mid laner ends up down thirty CS for a herald they would have reached anyway.",
          correct: false,
        },
        {
          id: "c",
          label: "Stay in lane and farm — the jungler can take it alone",
          explain:
            "Herald is decided by numbers, and their mid will rotate whether yours does or not. Farming through an objective window is the one time farming is the wrong answer.",
          correct: false,
        },
        {
          id: "d",
          label: "Shove and then recall to buy before rotating",
          explain:
            "The shove is right and the recall wastes it. You would arrive at the herald with the priority you built already expired.",
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
      "Next 3 games: start shoving mid 40 seconds before every drake and herald spawn, and be moving before the timer hits zero. If there is no objective within a minute, stay and take the waves instead.",
  },
};
