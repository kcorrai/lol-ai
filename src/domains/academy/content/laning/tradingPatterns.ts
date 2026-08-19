import type { Lesson } from "@/domains/academy/types";

export const tradingPatterns: Lesson = {
  slug: "trading-patterns",
  trackId: "laning",
  title: "Trading Patterns",
  summary:
    "A good trade is not about dealing more damage. It is about picking a moment where the maths already favours you — cooldowns, minion aggro, and the level spikes at 2, 3 and 6.",
  minutes: 6,
  access: "pro",
  objectives: [
    "List the four conditions that make a trade favourable before it starts",
    "Use minion aggro deliberately instead of accidentally",
    "Recognise the level 2, 3 and 6 windows and act inside them",
  ],
  fixes: ["high_deaths", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Most players trade reactively: the enemy steps forward, you press a button, health bars move, and afterwards you check who lost more. That is gambling. A trade should be decided before it starts, by conditions you can see on the screen, and if none of those conditions are true then the correct trade is no trade.",
    },
    {
      kind: "keyPoint",
      title: "The four conditions",
      text: "1. Their key ability is on cooldown and yours is not. 2. You are a level ahead, or they just leveled into nothing while you leveled into a spike. 3. The minion wave is on your side — their minions will hit you less than yours hit them. 4. You have a summoner spell or item they do not. One condition is a nudge; two is a green light; three is a kill.",
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "Minion aggro is the condition players understand least and it is often the largest one. When you attack an enemy champion, every nearby enemy minion switches to you. Six caster minions hitting you for the length of a trade is real damage — often more than the abilities being thrown. This is why trading while their wave is bigger than yours is a losing trade even when you win the button exchange.",
    },
    {
      kind: "table",
      caption: "The early level spikes",
      head: ["Level", "What changes", "The window"],
      rows: [
        ["2", "Second ability — often two abilities against one", "The biggest raw early edge; lasts until they hit 2"],
        ["3", "Third ability — full basic kit", "A short spike if you got there first"],
        ["6", "Ultimate", "Often the whole all-in; know which of you spikes harder"],
        ["Their 6", "Their ultimate", "The mirror — respect it for the 30 seconds before they get it"],
      ],
    },
    {
      kind: "mistake",
      title: "Trading into a bigger enemy wave",
      text: "You catch the enemy with a clean combo and win the ability exchange, then walk away at 40% health because six of their minions were hitting you the whole time.",
      fix: "Look at the wave before you press anything. If their minions outnumber yours, either wait for the wave to even out or force the trade at the very edge of the minions where fewer of them can reach you.",
    },
    {
      kind: "figure",
      caption: "Your keystone already decided which trade you are allowed to take",
      assets: [
        {
          ref: { of: "keystone", keystone: "electrocute" },
          label: "The short one",
          note: "Pays out on a burst and then stops. It rewards walking up with everything available, spending it, and leaving — a trade that lasts four seconds has already gone wrong.",
        },
        {
          ref: { of: "keystone", keystone: "press-the-attack" },
          label: "The one that needs three hits",
          note: "Nothing happens until the third auto lands, which means the trade has to be long enough to land three. Starting one you intend to walk out of after two is starting one for free.",
        },
        {
          ref: { of: "keystone", keystone: "conqueror" },
          label: "The long one",
          note: "Worth almost nothing at the start of a trade and a great deal at the end of it. It belongs to champions who can stand in one, and it is the reason those champions lose short trades and win the fight anyway.",
        },
      ],
    },
    { kind: "drill", drillId: "trading-quiz" },
    {
      kind: "prose",
      text: "The level 2 spike deserves one more paragraph because it is the most reliably winnable moment in the game. In most lanes the first wave contains six minions; killing the three melee minions plus the first caster gets you to level 2. If you hit that a few seconds before your opponent, you have two abilities against one, full health, and a wave that is on your side. That is three of the four conditions at once, at 1:40, in every single game you play.",
    },
    {
      kind: "checklist",
      title: "Before you press a button",
      items: [
        "Is their key ability down?",
        "Am I level 2 or 3 first, or are they about to hit 6?",
        "Whose minions are winning right now?",
        "Do I have flash and they do not?",
        "If fewer than two are true: do not trade, keep farming",
      ],
    },
    { kind: "drill", drillId: "trading-decision" },
  ],
  drills: [
    {
      id: "trading-quiz",
      kind: "quiz",
      prompt:
        "You win an ability exchange cleanly but end the trade lower than your opponent. What most likely happened?",
      options: [
        {
          id: "a",
          label: "Their minion wave was bigger and their minions were hitting you throughout",
          explain:
            "Correct, and this is the most common invisible tax in laning. Minion aggro routinely decides trades that the ability exchange 'won'.",
          correct: true,
        },
        {
          id: "b",
          label: "Your champion is simply weaker at that level",
          explain:
            "Possible, but if you won the ability exchange the champion matchup was not the deciding factor. Look at the wave.",
          correct: false,
        },
        {
          id: "c",
          label: "You missed a last hit during the trade",
          explain:
            "Missing CS costs gold, not health. The health difference came from somewhere else.",
          correct: false,
        },
      ],
    },
    {
      id: "trading-decision",
      kind: "decision",
      situation:
        "3:10. You are level 3, your opponent is level 3. Their escape ability is on cooldown after they used it to dodge a minion. Your wave is slightly bigger than theirs. You both have flash. They are at 80% health, you are at 90%.",
      facts: [
        "Their escape is on cooldown",
        "Your wave is slightly bigger",
        "Even levels, both have flash",
        "You: 90% health, them: 80%",
      ],
      options: [
        {
          id: "a",
          label: "Trade now — two conditions are true",
          explain:
            "Correct. Their escape is down and the wave favours you: that is two of the four conditions, which is a green light. Even without a level or item edge, a trade taken with the wave and their mobility on cooldown is a trade you are favoured to win.",
          correct: true,
        },
        {
          id: "b",
          label: "Wait until you are level 6",
          explain:
            "Three minutes of waiting throws away a window that exists right now. Their escape will be back up long before either of you hits 6.",
          correct: false,
        },
        {
          id: "c",
          label: "Do not trade — levels and flashes are even",
          explain:
            "Even levels and flashes means those two conditions are neutral, not negative. Two of the four are actively in your favour, which is enough.",
          correct: false,
        },
        {
          id: "d",
          label: "All-in with flash",
          explain:
            "Too much for the edge you have. Flash is a condition you spend when you have three of four and a kill is on the table — not to convert a favourable poke trade.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.8,
    games: 3,
    instruction:
      "Next 3 games: before every trade, count the conditions. Fewer than two, do not press. Also: try to hit level 2 first off the first wave in every game and take a trade the moment you do.",
  },
};
