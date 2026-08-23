import type { Lesson } from "@/domains/academy/types";

export const damageIsADuration: Lesson = {
  slug: "damage-is-a-duration",
  trackId: "adc",
  title: "Your Damage Is a Duration",
  summary:
    "Assassins get one window. You get every second you stay alive. That difference decides which target you press, when you show up, and why the safe fight is usually the winning one.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Measure your contribution in seconds alive rather than in targets killed",
    "Attack whatever you can reach without moving instead of hunting the carry",
    "Take sieges and objectives as damage-over-time problems, not as fights",
  ],
  fixes: ["late_game_throw", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "An assassin's whole game is one four-second window: get in, kill something, get out or die. Yours is the opposite. You do a fixed amount of damage per second, so the amount you contribute is that number multiplied by how long the fight lets you keep doing it. An ADC who does nothing for eight seconds and survives has done more than one who killed the support and died at second three.",
    },
    {
      kind: "keyPoint",
      title: "The best target is the nearest one you can hit without moving",
      text: "Every step toward a better target costs seconds and buys risk. The tank in front of you is not the target you want, but hitting him from where you already are for the whole fight beats walking around him to find their ADC and dying halfway. In a long fight the front line dies to sustained damage anyway — and the moment it does, the carry you wanted is standing in front of you.",
    },
    {
      kind: "table",
      caption: "Two ways to spend a teamfight",
      head: ["", "Hunting the carry", "Attacking what is in range"],
      rows: [
        ["Seconds of damage", "Three, maybe", "The whole fight"],
        ["Risk", "You are inside their team", "You are behind yours"],
        [
          "If it works",
          "One kill, then you die",
          "The fight is won and you are alive for the next one",
        ],
        ["If it fails", "Fight lost, 5v4 after", "Nothing happens"],
      ],
    },
    { kind: "drill", drillId: "duration-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Being the one who starts it",
      text: "Nobody wants to press first, so you step forward to auto their front line and their whole team turns on you. You have started the fight as the most fragile champion on your team, from the worst position on the map, at the moment your own front line was not looking.",
      fix: "You are never the one who starts the fight. Somebody with health starts it and you arrive a second later, at range, into a fight that is already pointed away from you. If nothing is happening and you are getting impatient, the correct outlet is a side wave or an objective, not an auto-attack into their tank.",
    },
    {
      kind: "keyPoint",
      title: "A siege is the same problem with a turret in it",
      text: "Turrets and objectives are pure damage-over-time and you are the highest number on the map for both. So a siege is not a fight you are waiting through — it is the thing you are there to do. Stand at the back, hit the structure whenever nobody can reach you, and let the enemy team choose between watching it fall and walking into your team to stop you.",
    },
    { kind: "drill", drillId: "duration-decision" },
    {
      kind: "checklist",
      title: "Every fight after twenty minutes",
      items: [
        "I am not the one who starts it — somebody with health goes first",
        "Attack the nearest reachable target; do not walk for a better one",
        "Count seconds alive, not kills — that is the number that decides the fight",
        "Nothing happening? Then I am hitting a structure, not looking for a fight",
      ],
    },
  ],
  drills: [
    {
      id: "duration-quiz",
      kind: "quiz",
      prompt: "In a five-versus-five that lasts twelve seconds, which ADC has contributed more?",
      options: [
        {
          id: "a",
          label: "The one who attacked the front line from range for all twelve seconds",
          explain:
            "Correct. Sustained damage from a safe position is more total damage than a burst that ends in a death, and it leaves the team five-versus-whatever afterwards. The fight is decided by output over its whole length, not by who killed something first.",
          correct: true,
        },
        {
          id: "b",
          label: "The one who killed the enemy support and died at second four",
          explain:
            "One kill on the least valuable target, then eight seconds of nothing while their team is a body up. This is the trade that loses won fights.",
          correct: false,
        },
        {
          id: "c",
          label: "The one who waited safely and joined at second eight",
          explain:
            "Safety with no output. Four seconds of damage in a twelve second fight is a third of what the role was there to provide.",
          correct: false,
        },
        {
          id: "d",
          label: "The one who flashed in to reach their carry and traded one for one",
          explain:
            "An even trade sounds fine and is not: you are the champion whose value grows with every second the fight continues, so trading yourself for anybody is trading the long half of the fight for the short one.",
          correct: false,
        },
      ],
    },
    {
      id: "duration-decision",
      kind: "decision",
      situation:
        "29:00. Both teams are standing around mid, nobody committing. Your team has Baron buff and a wave is pushing into their mid turret. You are three items up on their ADC.",
      facts: [
        "Baron buff active on your team",
        "A wave is hitting their mid turret right now",
        "Neither team has committed to a fight",
        "You out-scale everybody on the map",
      ],
      options: [
        {
          id: "a",
          label: "Hit the turret from the back while your team holds the front",
          explain:
            "Correct. A standoff with a buff and a wave is a siege, and a siege is a damage-over-time problem you are the best at. They must either watch the turret fall or walk into your team — both of which are your win condition, and neither of which requires you to press first.",
          correct: true,
        },
        {
          id: "b",
          label: "Step forward and auto their front line to force something",
          explain:
            "You would be starting the fight as the most fragile champion on the map, at the moment your team is not moving. Impatience is the most expensive thing an ADC can bring to a standoff.",
          correct: false,
        },
        {
          id: "c",
          label: "Go take a side lane while your team holds mid",
          explain:
            "With Baron and a wave already in, mid is the objective. Splitting yourself off puts the highest-damage champion on the map away from the structure it was about to take.",
          correct: false,
        },
        {
          id: "d",
          label: "Back to buy and return with a fourth item",
          explain:
            "The buff and the wave both expire. Trading a live siege for an item you can buy after it is the definition of arriving late to your own advantage.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "kda",
    direction: "increase",
    delta: 0.6,
    games: 3,
    instruction:
      "Next 3 games: never be the champion who starts a fight after 20 minutes. In every fight, attack whatever you can reach without moving forward, and hit structures whenever no fight is happening.",
  },
};
