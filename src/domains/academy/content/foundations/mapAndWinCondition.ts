import type { Lesson } from "@/domains/academy/types";

export const mapAndWinCondition: Lesson = {
  slug: "map-and-win-condition",
  trackId: "foundations",
  title: "The Map & The Actual Win Condition",
  summary:
    "League is not won by kills. It is won by turning gold into map pressure and pressure into a Nexus. Here is the chain, in order.",
  minutes: 4,
  access: "free",
  objectives: [
    "State the real win condition of a game of League in one sentence",
    "Explain why a 10/2 scoreline can still be a losing game",
    "Name what every kill, camp and objective is actually being converted into",
  ],
  fixes: ["objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Every game of League ends the same way: one team walks into the enemy base and hits a building. Nothing else ends a game. Not a pentakill, not a 20-kill lead, not a perfect KDA. If you remember one thing from this entire track, remember that kills are not the point — they are one of several ways to buy the thing that is the point.",
    },
    {
      kind: "keyPoint",
      title: "The conversion chain",
      text: "Gold and XP → a stronger champion → the enemy has to respect you → you take space on the map → space becomes vision and objectives → objectives become turrets → turrets become the Nexus. Every action you take in a game should be a step somewhere on that chain. If it is not, it is a coin flip.",
    },
    {
      kind: "prose",
      text: "This is why a player can go 10/2 and lose. Ten kills is roughly 3,000–4,000 gold. That gold only matters if it gets spent on pressure: taking a turret, forcing the enemy off a drake, holding a wave that lets your jungler invade. A 10/2 player who farms a side lane for twenty minutes and never converts is a player who bought a very expensive item and left it in the bag.",
    },
    {
      kind: "table",
      caption: "What each resource is really for",
      head: ["Resource", "What it looks like", "What it converts into"],
      rows: [
        ["Minions", "CS ticking up", "Steady gold with no risk — the cheapest gold in the game"],
        ["Kills", "Scoreboard", "A window of time where the enemy is not on the map"],
        [
          "Turret plates",
          "Chunks off a turret before 14:00",
          "160g each, plus the turret weakening early",
        ],
        ["Turrets", "A building falls", "Map space — your team can stand further forward safely"],
        [
          "Drakes / Grubs / Herald",
          "Neutral objectives",
          "Permanent stats or a free turret's worth of damage",
        ],
        ["Baron", "20:00+ objective", "A siege window big enough to end the game"],
      ],
    },
    {
      kind: "prose",
      text: "Notice the middle column of that table is never the goal. A kill is not a reward you collect — it is a timer that starts. The enemy laner is gone for 15 seconds early, 45 seconds later on. What you do with those seconds is the only part that shows up on the scoreboard that matters: the Nexus one.",
    },
    {
      kind: "mistake",
      title: "Chasing the kill instead of spending it",
      text: "You win a 2v2 in bot lane, both enemies die, and your team immediately recalls or walks back to lane to farm. The 20 seconds you just bought expire unused.",
      fix: "Ask 'what is free right now?' the instant a fight ends. Turret plates, the wave, drake, deep vision, a recall on a crashed wave — take the most valuable one you can reach before they respawn.",
    },
    {
      kind: "mapFigure",
      caption: "The map layout and where the chain leads",
      annotations: [
        {
          at: { x: 0.07, y: 0.93, r: 0.055 },
          label: "Your base",
          tone: "neutral",
          note: "Where the chain starts. Gold and experience come in, and converted pressure goes out.",
        },
        {
          at: { x: 0.34, y: 0.27, r: 0.055 },
          label: "Baron pit",
          tone: "good",
          note: "The largest objective conversion from 20 minutes on. A completed Baron becomes a siege window large enough to end the game.",
        },
        {
          at: { x: 0.69, y: 0.75, r: 0.055 },
          label: "Drake pit",
          tone: "good",
          note: "The stacking objective. Each drake is a permanent stat; the soul at four stacks can decide games on its own.",
        },
        {
          at: { x: 0.93, y: 0.07, r: 0.055 },
          label: "Their base and Nexus",
          tone: "neutral",
          note: "The only place the chain ends. No scoreboard number ends a game except this one.",
        },
      ],
    },
    { kind: "drill", drillId: "win-condition-quiz" },
    {
      kind: "checklist",
      title: "The 3-second habit",
      items: [
        "After every kill or won fight, name out loud the one thing you are going to take with it",
        "Before you walk toward a fight, ask what you would take if you won it",
        "If the honest answer is 'nothing', the fight is not worth taking",
      ],
    },
    { kind: "drill", drillId: "spend-the-lead-decision" },
    {
      kind: "prose",
      text: "The rest of this track is a tour of the individual links in that chain: how you get gold safely (minions), how gold becomes power at a specific minute (the shop), how you stay on the map long enough to use it (recalls and vision), and what the objectives are actually worth. None of it is a separate skill. It is one chain.",
    },
  ],
  drills: [
    {
      id: "win-condition-quiz",
      kind: "quiz",
      prompt:
        "Your mid laner is 8/1 at 16 minutes. Your team has taken one turret; the enemy has taken three. Who is winning?",
      options: [
        {
          id: "a",
          label: "The enemy team",
          explain:
            "Correct. Turrets are converted pressure — three of them means the enemy team can stand further forward, ward deeper and contest every objective on better terms. Your mid laner has gold in the bag but the map belongs to them.",
          correct: true,
        },
        {
          id: "b",
          label: "Your team, because of the scoreline",
          explain:
            "The scoreline records kills, and kills are only the raw material. 8/1 with one turret means the lead was never spent. The enemy converted less gold into more map.",
          correct: false,
        },
        {
          id: "c",
          label: "Even — kills and turrets cancel out",
          explain:
            "They do not trade one-for-one. A turret is permanent map space; a kill is a 30-second window that has long since closed. Three turrets is a structural lead, eight kills is a spent one.",
          correct: false,
        },
      ],
    },
    {
      id: "spend-the-lead-decision",
      kind: "decision",
      situation:
        "You are bot lane at 8:30. You just won the 2v2 — both enemies are dead with 25 seconds on the clock. Your wave is sitting in the middle of the lane. Drake spawns in 40 seconds and your jungler is on the top side of the map.",
      facts: [
        "Both enemy bot laners are dead for ~25s",
        "Your turret has 4 plates left, theirs has 5",
        "Drake spawns in 40s, your jungler is top side",
        "You are 300g from your first component",
      ],
      options: [
        {
          id: "a",
          label: "Push the wave into their turret and take plates",
          explain:
            "Correct. Plates are 160g each and they are only available before 14:00. With both enemies dead you take them for free, and the wave crashing sets up a clean recall. Drake is 40 seconds out and your jungler is on the wrong side — you cannot get there in time anyway.",
          correct: true,
        },
        {
          id: "b",
          label: "Recall immediately to buy your component",
          explain:
            "Recalling on a lead is throwing the window away. The wave is mid-lane, so you would also hand the enemy a free shove when they respawn. Take the plates first, then recall on the crash.",
          correct: false,
        },
        {
          id: "c",
          label: "Walk to drake and wait for your jungler",
          explain:
            "Standing on an objective that spawns in 40 seconds, with a jungler who is on the far side of the map, wastes the entire window. You would arrive with the enemy respawned and no jungler.",
          correct: false,
        },
        {
          id: "d",
          label: "Go invade the enemy jungle",
          explain:
            "Not wrong in principle — a dead bot lane does open the enemy jungle — but plates are guaranteed value on a timer that expires at 14:00, and they are three seconds away instead of fifteen.",
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
      "For your next 3 games: every time a fight ends in your favour, say the thing you are taking with it before you move. Plates, wave, objective, or recall — one of the four, every time.",
  },
};
