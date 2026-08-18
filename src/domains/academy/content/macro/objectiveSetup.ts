import type { Lesson } from "@/domains/academy/types";

export const objectiveSetup: Lesson = {
  slug: "objective-setup",
  trackId: "macro",
  title: "Setting Up an Objective Without Saying a Word",
  summary:
    "The vision half of a setup is in the Vision track. This is the other half: where the waves have to be, who rotates, who stays, and how one player starts it when nobody is listening.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Put the waves where an objective needs them a minute before it spawns",
    "Say which two lanes rotate and which one stays, and why it is not a preference",
    "Start a setup alone, in a game where nobody reads pings",
  ],
  fixes: ["objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "A drake is taken by numbers, and the numbers are decided by waves. If your bottom and mid waves are crashing into their turrets when the timer comes up, four of you can walk down and only two of them can answer without giving up a whole wave each. Nobody has to communicate. The wave states did the communicating a minute ago.",
    },
    {
      kind: "keyPoint",
      title: "The setup starts at minus sixty, not minus ten",
      text: "A wave takes about thirty seconds to cross a lane and crash. Add the walk and you are at fifty. So the last honest moment to start a setup is a full minute before the objective spawns — after that you are not setting up, you are hurrying, and hurrying is how five people arrive from five directions.",
    },
    { kind: "drill", drillId: "macro-setup-sim" },
    {
      kind: "table",
      caption: "Who moves for what",
      head: ["Objective", "Rotates", "Stays", "Why"],
      rows: [
        ["Drake", "Bot lane, mid, jungle", "Top", "Top is the far side; walking is thirty seconds each way and the lane goes unfarmed"],
        ["Baron", "Top, mid, jungle", "Bot", "Mirror image — and bot has the safest lane to keep pressuring while it happens"],
        ["Herald", "Whoever is nearest with priority", "Everyone else", "It is not worth a rotation; it is worth a wave and a jungler"],
      ],
    },
    {
      kind: "prose",
      text: "The lane that stays has a job, and it is not farming quietly. It is applying enough pressure that the enemy cannot send their far-side laner either. A top laner who shoves into the turret while the drake happens has taken the enemy top laner out of the fight as surely as if they had killed them — that is a four-versus-four instead of a four-versus-five, decided by a wave on the other end of the map.",
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Rotating with your wave still in the middle of the lane",
      text: "You walk to the drake at minus twenty with an even wave sitting in mid. Your turret takes it. Their mid laner arrives at the fight anyway, because his wave was already shoved. You lost a wave and gained nothing.",
      fix: "Shove first, always, even if it means arriving ten seconds later than you would like. A player who arrives on time with an unshoved wave has paid for the fight twice — once in the wave, once in being outnumbered by the person whose wave was shoved.",
    },
    {
      kind: "keyPoint",
      title: "Starting it alone",
      text: "You cannot make four strangers rotate. You can shove your own lane at minus sixty, ping the objective once, and walk. Very often that is enough: the jungler follows the ping, the nearest lane follows the jungler, and a team that arrives at an objective with cleared waves plays the fight correctly without anyone having agreed to anything. The pings that do not work are the ones sent from the pit at zero.",
    },
    { kind: "drill", drillId: "macro-setup-decision" },
    {
      kind: "checklist",
      title: "The minute before",
      items: [
        "Minus 60: shove your own wave, whatever else is happening",
        "Minus 45: one ping on the objective, then move — do not stand still typing",
        "Minus 30: walk through your own jungle, not down the river, so you cannot be picked on the way",
        "Minus 15: be on the objective side of it, with your team, not in front of it",
      ],
    },
  ],
  drills: [
    {
      id: "macro-setup-sim",
      kind: "wave-sim",
      prompt:
        "Drake is up in a minute and you want to be free to rotate. The wave is even in the middle of the lane. Crash it into their turret in three cycles.",
      start: { advantage: 0, position: 0 },
      goal: "crash",
      cycles: 3,
      explain:
        "Clearing hard is right here, and it is the opposite of what the freeze drill asked for. That is the point: the same wave answers to the same rule, and which state you want depends entirely on what you plan to do in the next minute. A crash before an objective buys you the walk; a crash for no reason buys the enemy jungler a target.",
    },
    {
      id: "macro-setup-decision",
      kind: "decision",
      situation:
        "Drake spawns in fifty seconds. You are top with the wave sitting in the middle of your lane. Your team has started to gather bottom without pinging. The enemy top laner is in lane with you.",
      facts: [
        "Drake in 50 seconds",
        "Your wave: even, middle of lane",
        "Team gathering bottom, no ping",
        "Enemy top laner still in lane",
      ],
      options: [
        {
          id: "a",
          label: "Shove your wave into their turret and keep pressuring so their top cannot leave",
          explain:
            "Correct. You are the far lane: rotating costs thirty seconds each way and arrives late. Holding their top laner in lane with a crashing wave turns the objective fight into four-versus-four, which is the biggest thing you can do from here.",
          correct: true,
        },
        {
          id: "b",
          label: "Walk down immediately so your team is not outnumbered",
          explain:
            "You arrive at minus five with your wave feeding your turret, and their top laner — who left when you did — arrives at the same time. You have spent a wave to make it five-versus-five instead of four-versus-four.",
          correct: false,
        },
        {
          id: "c",
          label: "Recall, buy, and teleport down when the fight starts",
          explain:
            "Not wrong in every game, but it spends your teleport on a fight you could have influenced for free — and if they have vision on the drake pit, the teleport arrives into a fight already decided.",
          correct: false,
        },
        {
          id: "d",
          label: "Ping the drake and wait to see what your team does",
          explain:
            "Waiting is the one option that has no version where it works. Whatever the team does, your wave should be shoved — start with the part that is yours.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 6,
    games: 3,
    instruction:
      "Next 3 games: at 60 seconds before every drake and Baron, shove your own wave and ping the objective once, then move. If you are the far lane, stay and keep the enemy laner pinned instead of rotating.",
  },
};
