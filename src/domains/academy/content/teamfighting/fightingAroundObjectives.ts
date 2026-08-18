import type { Lesson } from "@/domains/academy/types";

export const fightingAroundObjectives: Lesson = {
  slug: "fighting-around-objectives",
  trackId: "teamfighting",
  title: "Fighting Around a Pit",
  summary:
    "Almost every teamfight that decides a game happens next to a drake or a Baron, and the pit changes the geometry. Which side you stand on is worth more than most of your items.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Take the near side of a pit, and know what it is worth",
    "Say when the objective is the win condition and when the fight is",
    "Stop walking into a pit to contest something you were never going to take",
  ],
  fixes: ["objective_neglect", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "The games you lose in one moment almost always end at a pit. Not because objectives are worth so much, but because a pit is a hole in the ground with two entrances, and a fight in a hole is decided by who is standing at the top of it. That geometry is learnable in one lesson and most players have never thought about it once.",
    },
    {
      kind: "keyPoint",
      title: "Stand on your own side of the pit",
      text: "The side nearest your base. It means every retreat is toward help and every one of theirs is away from it, it means the enemy engage has to cross the pit to reach you, and it means when the fight goes wrong you walk out instead of dying in a hole. Teams that lose Baron fights are almost always standing on the wrong side when it starts.",
    },
    {
      kind: "table",
      caption: "Which thing is the win condition",
      head: ["Situation", "You are fighting for", "So you"],
      rows: [
        ["You are ahead, objective is up", "The objective", "Take it fast, refuse the fight, walk away with it"],
        ["You are behind, they start it", "The fight", "Contest from your side and hope for a mistake — the objective alone does not save you"],
        ["Even, soul point drake", "Both, and the fight first", "Win the fight before the pit, not inside it"],
        ["They are set up and you are not", "Neither", "Leave. Take the other half of the map"],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The third row is the one that gets misplayed most. At a soul point drake both teams know the fight is happening, so the winner is decided by who forces it *before* anyone is standing in the hole. A team that starts drake with everyone alive and nobody engaged is inviting a fight where half their team is in a pit and the other half is climbing into it — take the fight in the open river first, then take the drake with the corpses still on the ground.",
    },
    {
      kind: "mistake",
      title: "Walking into the pit to check",
      text: "Somebody walks down to see whether the drake is still there or how much health it has. They are alone, in a hole, on the far side of a wall from their team, and the fight starts with a four-versus-five and a free kill.",
      fix: "The pit is the last place anyone walks and the first place people die. Vision answers 'is it still there'; a body answers it once, expensively. If you need to know, ward it — this is what the setup in the Vision track is for.",
    },
    { kind: "drill", drillId: "pit-decision" },
    {
      kind: "keyPoint",
      title: "Smite range is not a plan",
      text: "Two junglers staring at a health bar is the most famous coin flip in League, and the teams that win objectives consistently are the ones who make the flip irrelevant: they take the objective when the enemy cannot physically be there. If your entire plan is that your jungler's smite lands, you have not set up an objective — you have entered a raffle.",
    },
    { kind: "drill", drillId: "pit-quiz" },
  ],
  drills: [
    {
      id: "pit-decision",
      kind: "decision",
      situation:
        "Soul point drake, 29:00, both teams alive and even in gold. Nobody has started it. Your team is in the river on your side of the pit; theirs is on the far side, also in the river.",
      facts: [
        "Soul point drake, both teams alive, even gold",
        "Nobody has started the objective",
        "Your team is on your side of the pit",
        "Their team is on the far side, in the open",
      ],
      options: [
        {
          id: "a",
          label: "Take the fight now, in the open river, before anyone climbs into the pit",
          explain:
            "Correct. At soul point the fight is the win condition and the drake is the prize afterwards. Fighting in the open, on your side, means no one on your team is standing in a hole and every retreat goes toward your base.",
          correct: true,
        },
        {
          id: "b",
          label: "Start the drake and let them come to you",
          explain:
            "Starting it puts half your team in the pit with their backs to a wall and hands them the engage from above. This is the most common way a soul point drake is lost.",
          correct: false,
        },
        {
          id: "c",
          label: "Wait for them to start it and contest with smite",
          explain:
            "A raffle. It also gives them the choice of when the fight begins, which at even gold is the entire advantage.",
          correct: false,
        },
        {
          id: "d",
          label: "Send two to a side lane to force a rotation first",
          explain:
            "Splitting at a soul point drake with everyone alive means the fight happens four-versus-five while your two are in a lane. The pressure play is right ninety seconds earlier, not now.",
          correct: false,
        },
      ],
    },
    {
      id: "pit-quiz",
      kind: "quiz",
      prompt: "What does standing on your own side of a pit actually buy you?",
      options: [
        {
          id: "a",
          label: "Retreats toward help, their engage has to cross, and nobody on your team is in the hole",
          explain:
            "Correct — three separate advantages from one piece of ground. It is the cheapest thing in a teamfight to get right and the most reliably decisive.",
          correct: true,
        },
        {
          id: "b",
          label: "A faster start on the objective when the timer comes up",
          explain:
            "Marginal at best, and the side you stand on is chosen for the fight, not for the head start.",
          correct: false,
        },
        {
          id: "c",
          label: "Better vision of the pit itself",
          explain:
            "Vision comes from wards, not from where your feet are. The value here is geometric — retreat lines and who has to cross.",
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
      "Next 3 games: at every drake and Baron, stand on your own side of the pit and never walk into it to check. At soul point, take the fight in the open river before anyone starts the objective.",
  },
};
