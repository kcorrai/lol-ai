import type { Lesson } from "@/domains/academy/types";

export const tradingObjectives: Lesson = {
  slug: "trading-objectives",
  trackId: "macro",
  title: "Trading Objectives",
  summary:
    "You do not have to contest everything. The strongest macro move in League is taking something else while they take theirs — and knowing which trades are actually in your favour.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Price an objective against what you could take instead",
    "Recognise the moment contesting is a coin flip you are paying to enter",
    "Say the trade out loud so four strangers make it with you",
  ],
  fixes: ["objective_neglect", "late_game_throw"],
  blocks: [
    {
      kind: "prose",
      text: "Something happens in silver and gold games that never happens in professional ones: both teams fight over every single objective, every time it spawns, regardless of who is set up. It feels like the correct competitive instinct. It is the single most expensive habit on this list, because half of those fights were unwinnable before anyone walked into the pit.",
    },
    {
      kind: "keyPoint",
      title: "An objective is not worth more than what you give up to contest it",
      text: "The question is never 'is drake good'. It is 'is drake better than the two turrets and three waves I could take in the ninety seconds they spend standing at it'. Sometimes yes — the soul point, a Baron with a wave coming. Very often no, and the answer changes with a timer nobody looks at.",
    },
    {
      kind: "table",
      caption: "What is actually worth a fight",
      head: ["Objective", "Contest when", "Trade instead when"],
      rows: [
        ["Early drakes (1st, 2nd)", "You are set up and they are not", "Anything at all is off — they are worth less than a turret"],
        ["Soul point drake", "Almost always", "You are three players down in items and have no front line"],
        ["Herald", "It is free, or it is nearly free", "It costs a fight — a herald is a turret, not a game"],
        ["Baron", "You won the last fight, or you are set up first", "They set up first with vision — take two turrets instead"],
      ],
    },
    {
      kind: "prose",
      text: "The middle row is the exception worth memorising. A soul point drake is not a drake; it is a permanent team-wide buff that decides every fight for the rest of the game, and that is the one objective where the coin flip is correct. Everything above it in the table is a resource. Everything about the fourth row is timing.",
    },
    { kind: "gate" },
    {
      kind: "mapFigure",
      caption: "The trade only exists because the two pits are in opposite corners",
      annotations: [
        {
          at: { x: 0.34, y: 0.27, r: 0.055 },
          label: "Baron",
          tone: "neutral",
          note: "Top corner. A team standing here is five champions who are not anywhere else, and they cannot be anywhere else for the next thirty seconds.",
        },
        {
          at: { x: 0.69, y: 0.75, r: 0.055 },
          label: "Drake",
          tone: "neutral",
          note: "The far corner from it. This is the whole reason a trade is possible: the map is not big, but it is big enough that nobody can answer both.",
        },
        {
          at: { x: 0.78, y: 0.85, r: 0.055 },
          label: "What you take instead",
          tone: "good",
          note: "Their bottom turrets, while they are in the Baron pit. This is what the key point means by 'two turrets and three waves' — it is on the map, it is undefended for exactly as long as they are committed, and nobody has to fight for it.",
        },
      ],
    },
    {
      kind: "mistake",
      title: "Trading badly and calling it macro",
      text: "They take Baron. You take their bottom turret. That sounds like a trade until you count it: a Baron is five empowered pushes and a free run at your base, and a bottom turret is 500 gold split five ways. You did not trade, you conceded with extra steps.",
      fix: "A trade is only a trade if what you take is defensible and roughly the same size. Baron trades for Baron, an inhibitor, or two turrets plus a drake — not for one outer turret. If the only thing available is small, the honest options are contest properly or defend properly, not pretend.",
    },
    { kind: "drill", drillId: "trade-decision" },
    {
      kind: "keyPoint",
      title: "Say it, because nobody is reading your mind",
      text: "Four strangers will follow a plan if there is one. 'Trade bot' or 'they baron, take top' in chat, once, at the moment the enemy commits, is the difference between four people taking a turret together and four people running at a Baron pit one at a time. You are not asking permission — you are naming the thing so it can happen.",
    },
    {
      kind: "checklist",
      title: "Before you walk into a pit",
      items: [
        "Do we have vision on their approach? If no, this is a coin flip",
        "Are we all here, and are they? Count champions, not health bars",
        "What is the biggest thing available to us on the other half of the map right now?",
        "If that thing is bigger than the objective, say the trade in chat and go take it",
      ],
    },
    { kind: "drill", drillId: "trade-quiz" },
  ],
  drills: [
    {
      id: "trade-decision",
      kind: "decision",
      situation:
        "31:00. The enemy team has started Baron with all five, and you have no vision inside the pit. Your team is grouped bottom, everyone alive, two of their outer turrets already down and their bottom inhibitor turret at half health.",
      facts: [
        "Enemy: all five on Baron, no vision for you",
        "Your team: five alive, grouped bottom",
        "Their bottom inhibitor turret at 50%",
        "Baron will take them roughly 25 more seconds",
      ],
      options: [
        {
          id: "a",
          label: "Take the inhibitor turret and the inhibitor if it opens, say 'trade bot' in chat",
          explain:
            "Correct. An inhibitor is the one thing on the map that trades evenly with a Baron — it forces them to defend for the next three minutes and it feeds a super minion wave into the lane they wanted to push. Twenty-five seconds is exactly enough if you start now.",
          correct: true,
        },
        {
          id: "b",
          label: "Run to Baron and contest with smite range",
          explain:
            "Into five people, with no vision, arriving from one side. Even the smite steal leaves you standing in their whole team with no escape — this is the coin flip you paid an entry fee for.",
          correct: false,
        },
        {
          id: "c",
          label: "Back off and defend your own base before the Baron push arrives",
          explain:
            "Conceding the objective and gaining nothing for the time. Defending is what you do when the trade is not available; here it is available and it is half a turret away.",
          correct: false,
        },
        {
          id: "d",
          label: "Split up — two defend, three take the turret",
          explain:
            "The trade only works if it lands before they finish. Three players on an inhibitor turret with twenty-five seconds is not enough, and now the fight you did not want happens at your inhibitor with two people.",
          correct: false,
        },
      ],
    },
    {
      id: "trade-quiz",
      kind: "quiz",
      prompt:
        "At 14:00 the enemy takes the second drake uncontested while your team pushes their mid turret and takes it. Who won that exchange?",
      options: [
        {
          id: "a",
          label: "You did, slightly — a mid turret opens the map and an early drake is a small buff",
          explain:
            "Correct. Early drakes are the cheapest objective on the map, and a mid turret is map access plus gold for everyone. The trade only flips later, when their drake stack approaches soul.",
          correct: true,
        },
        {
          id: "b",
          label: "They did — drakes stack and turrets come back",
          explain:
            "Turrets do not come back. The drake stack matters at soul point, which is two more drakes away and not guaranteed; the open mid lane is permanent.",
          correct: false,
        },
        {
          id: "c",
          label: "Neither — objective for objective is always even",
          explain:
            "Objectives are not interchangeable. Pricing them against each other, at the timing they happen, is the whole skill this lesson is about.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 5,
    games: 3,
    instruction:
      "Next 3 games: never walk into an objective pit without vision on the enemy approach. When they commit and you are not set up, name the trade in chat once and take the biggest thing on the other half of the map.",
  },
};
