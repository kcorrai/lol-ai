import type { Lesson } from "@/domains/academy/types";

export const farmingForTheItem: Lesson = {
  slug: "farming-for-the-item",
  trackId: "adc",
  title: "You Are Farming for an Item, Not a Kill",
  summary:
    "The only role whose early game is measured in item completions. Why thirty minions beat a kill at nine minutes, and what that means for every fight you are offered.",
  minutes: 5,
  access: "free",
  objectives: [
    "Price an early fight against the minions it costs you",
    "Aim your recalls at item breakpoints instead of at full mana",
    "Decline a favourable trade when it costs you a wave",
  ],
  fixes: ["low_cs", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Every other role converts gold into pressure straight away. You do not. An ADC with 1100 gold in their pocket is exactly as strong as an ADC with 0 — the power arrives in one lump when the item is finished, and everything before that is bookkeeping. This is why the role feels weak for fifteen minutes and then does not, and it is why your decisions early are almost entirely about minions.",
    },
    {
      kind: "keyPoint",
      title: "A kill at nine minutes is worth less to you than the wave you gave up for it",
      text: "A kill is around three hundred gold. A wave is a little over a hundred, and there is another one thirty seconds later. Take a fight that costs you two waves and the kill has broken even at best — and you were standing still, out of position, for the whole thing. The ADC who farms through the early game and buys their second item first is ahead of the ADC who is 3/0 and a wave behind.",
    },
    {
      kind: "table",
      caption: "What the gold is actually for",
      head: ["Gold in pocket", "What you can do", "What matters"],
      rows: [
        ["0–800", "Nothing new", "Get to the first component"],
        ["First item done", "Trade in lane, clear faster", "This is your first real spike"],
        ["Two items", "Win a 2v2, threaten a turret", "The number the mid game is decided by"],
        [
          "Three items",
          "Kill anybody you can reach",
          "By now the game has usually chosen a winner",
        ],
      ],
    },
    { kind: "drill", drillId: "farm-quiz" },
    {
      kind: "figure",
      caption: "This is what the first fifteen minutes are for",
      assets: [
        {
          ref: { of: "item", item: "kraken-slayer" },
          label: "One completed item",
          note: "Around 3,400 gold. At a little over a hundred gold a wave, that is roughly thirty waves — fifteen minutes of not missing minions, or eleven kills you are not going to get. The whole argument of this lesson is that the second number is not available and the first one is.",
        },
      ],
    },
    {
      kind: "mistake",
      title: "Recalling with an awkward number",
      text: "You back at 1150 gold because you are low on health, buy a component and two potions, and walk back. Two waves later you have 1300 gold and still no item — you spent the trip and got no spike out of it, and now you have to go again.",
      fix: "Recalls are aimed at breakpoints. If you are 150 gold short of the item that changes your lane, the correct move is usually one more wave and then back, not back now. Know the number your next item costs before you decide to walk to the fountain.",
    },
    {
      kind: "keyPoint",
      title: "Time is on your side, which is why they want the fight",
      text: "The enemy team knows you get stronger every minute. Every early fight they offer is offered because it is good for them right now. When you decline a fight that was not clearly free, you are not playing scared — you are collecting the thing the whole role is built around, which is minutes.",
    },
    { kind: "drill", drillId: "farm-decision" },
    {
      kind: "checklist",
      title: "Early game, every wave",
      items: [
        "How much gold do I need for the next item — the actual number",
        "Does this trade cost me minions? Then it needs to buy something bigger than minions",
        "Am I recalling on a breakpoint, or because I feel low",
        "If nothing is happening, that is fine — nothing is what I want until my second item",
      ],
    },
  ],
  drills: [
    {
      id: "farm-quiz",
      kind: "quiz",
      prompt: "At nine minutes, which of these is worth the most to an ADC?",
      options: [
        {
          id: "a",
          label: "Thirty minions collected without a fight",
          explain:
            "Correct. Thirty minions is roughly six hundred gold — most of a component and a step closer to the spike that actually changes the lane. It also arrives with no risk of the death that costs you three waves.",
          correct: true,
        },
        {
          id: "b",
          label: "One kill on the enemy ADC",
          explain:
            "About three hundred gold and a lot of variance. Worth taking when it is free, but not worth building a plan around — and rarely free at nine minutes.",
          correct: false,
        },
        {
          id: "c",
          label: "A turret plate taken while your opponent is recalling",
          explain:
            "A hundred and sixty gold and useful, but nowhere near a wave and a half of minions. This is a bonus, not a goal.",
          correct: false,
        },
        {
          id: "d",
          label: "Following your support on a roam to mid",
          explain:
            "The one option that produces nothing while costing you minions. Roaming is what your support does; the lane is what you do.",
          correct: false,
        },
      ],
    },
    {
      id: "farm-decision",
      kind: "decision",
      situation:
        "8:40. You have 1180 gold and your next item costs 1300. You are at 55% health, the wave is pushing toward you, and your support has just gone to ward.",
      facts: [
        "1180 gold; the item you want costs 1300",
        "Wave is coming toward you — the next one is easy to collect",
        "You are on 55% health with no immediate threat",
        "Support is off warding for about 20 seconds",
      ],
      options: [
        {
          id: "a",
          label: "Take the incoming wave, then recall with the item bought",
          explain:
            "Correct. You are one wave from the number, the wave is walking to you, and there is no threat on the board. Backing now would mean buying a component and walking back for the same trip a second time.",
          correct: true,
        },
        {
          id: "b",
          label: "Recall now while your support is away anyway",
          explain:
            "You arrive at the shop 120 gold short and buy nothing that changes anything. The trip is the same length whether you leave now or in thirty seconds — only one version comes back with the item.",
          correct: false,
        },
        {
          id: "c",
          label: "Push the wave into the turret first, then back",
          explain:
            "Shoving costs you the safety of a wave that was already coming to you, and it puts you deep with no support for the sake of arriving at the fountain a few seconds earlier.",
          correct: false,
        },
        {
          id: "d",
          label: "Follow your support and look for a play while the wave walks in",
          explain:
            "This is the option that produces nothing. You give up the wave you need for the item and gain a body standing near a ward.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.6,
    games: 3,
    instruction:
      "Next 3 games: know the gold cost of your next item at all times, and only recall on that number or above. Decline every early trade that costs you more than one minion.",
  },
};
