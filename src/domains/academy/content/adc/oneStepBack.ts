import type { Lesson } from "@/domains/academy/types";

export const oneStepBack: Lesson = {
  slug: "one-step-back",
  trackId: "adc",
  title: "Spacing: One Step Back",
  summary:
    "The only mechanical skill in the game that is purely about where you stand. Attack range is a resource, and most ADCs spend it before the fight starts.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Attack from the edge of your range instead of from where you are standing",
    "Move between autos rather than after them",
    "Use the range difference against a shorter-ranged opponent on purpose",
  ],
  fixes: ["high_deaths", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "An ADC has one defensive statistic and it is not on the item page. It is the distance between you and the thing that wants to kill you, and it is worth more than any amount of health because it is the only defence that also lets you keep attacking. Almost every ADC death that is not a hard engage is a player who was standing two hundred units too far forward for no reason at all.",
    },
    {
      kind: "keyPoint",
      title: "Every auto has a windup, and the windup is where the free movement lives",
      text: "When you press attack, the damage happens partway through the animation — everything after that is time you are allowed to move without losing anything. Standing still until the animation finishes is giving away a free step every single auto. Over a fight that is several body-lengths of distance you paid nothing for, and it is the whole difference between kiting and standing.",
    },
    {
      kind: "table",
      caption: "Where to stand",
      head: ["Situation", "Where you are", "Why"],
      rows: [
        ["Last-hitting in lane", "The furthest point that reaches the minion", "Their engage has to cross the extra distance"],
        ["Trading with a shorter-ranged ADC", "Just inside your range, outside theirs", "They have to step forward to answer, and that is the trade"],
        ["A fight has started", "Behind your front line, at maximum range", "You are attacking whatever is nearest and still leaving"],
        ["You are being dived", "Moving away first, attacking second", "Damage you do while dying is damage nobody counts"],
      ],
    },
    { kind: "drill", drillId: "spacing-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Walking forward to last-hit",
      text: "The minion is at the far edge of your range so you take two steps toward it and auto. Those two steps are the entire reason the hook lands, or the jungler reaches you, or the trade you did not want happens. You have paid two hundred units of your only defensive stat for a minion you could have had by waiting half a second.",
      fix: "Attack from the edge, and if the minion is out of range, wait for it to walk to you — it will. The one exception is a minion that would otherwise die to your own turret. Everything else is worth less than the distance it costs.",
    },
    {
      kind: "keyPoint",
      title: "Range is only an advantage while you are using it",
      text: "If you out-range your opponent by a hundred units and you stand at the same distance they do, you have thrown the advantage away and are now in a fair fight you did not have to take. The difference between a strong ADC and a weak one in the same matchup is often nothing but the habit of standing at the back of your own range instead of the middle of it.",
    },
    { kind: "drill", drillId: "spacing-decision" },
    {
      kind: "checklist",
      title: "Spacing, every fight",
      items: [
        "Am I at the edge of my range, or somewhere comfortable in the middle of it",
        "Am I moving during the windup, or waiting for the animation to end",
        "Out-ranged? Then I do not step forward for anything smaller than a kill",
        "Being dived? Move first, attack second — always in that order",
      ],
    },
  ],
  drills: [
    {
      id: "spacing-quiz",
      kind: "quiz",
      prompt: "What is the free movement in an auto-attack, and when does it happen?",
      options: [
        {
          id: "a",
          label: "After the damage lands, for the rest of the animation",
          explain:
            "Correct. The damage is applied partway through the attack and everything after that point is yours. Moving in that window costs nothing at all — which is why standing still until the animation finishes is the most common wasted resource in the role.",
          correct: true,
        },
        {
          id: "b",
          label: "Before the attack starts, while you are choosing a target",
          explain:
            "Movement before you attack is normal movement — it delays the attack. The free part is on the other end.",
          correct: false,
        },
        {
          id: "c",
          label: "There is none; moving always cancels the attack",
          explain:
            "Moving before the damage lands cancels it. Moving after does not, and that gap is the entire mechanic behind kiting.",
          correct: false,
        },
        {
          id: "d",
          label: "Only while an attack-speed buff is active",
          explain:
            "Attack speed changes how often the window arrives, not whether it exists. It is there on every attack at every attack speed.",
          correct: false,
        },
      ],
    },
    {
      id: "spacing-decision",
      kind: "decision",
      situation:
        "17:00. A fight has started around the drake pit. Their assassin is not visible. Your front line is engaged and there is a low enemy tank in your range at the edge of the fight.",
      facts: [
        "Their assassin has not shown up yet",
        "A low tank is in range; their carry is not",
        "Your front line is engaged and holding",
        "You are at full health, behind your team",
      ],
      options: [
        {
          id: "a",
          label: "Attack the tank from maximum range and keep moving between autos",
          explain:
            "Correct. The nearest thing you can hit without moving forward is the correct target, and the movement between autos is what keeps you out of reach of the assassin who has not appeared yet. Damage you can do from where you already are is free damage.",
          correct: true,
        },
        {
          id: "b",
          label: "Walk around the fight to reach their carry",
          explain:
            "You are trading your one defensive stat for a better target, into a fight where the champion built to punish exactly that has not been seen. The carry is not worth the walk.",
          correct: false,
        },
        {
          id: "c",
          label: "Hold your attacks until the assassin commits",
          explain:
            "Waiting means doing nothing in a fight your team is already in. You can attack the tank *and* stay ready — the two are not in conflict.",
          correct: false,
        },
        {
          id: "d",
          label: "Step forward to finish the tank before he can retreat",
          explain:
            "Stepping forward for a kill on a tank is the trade the enemy team is hoping for. The kill is worth much less than the distance it costs you against an assassin nobody has located.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.7,
    games: 3,
    instruction:
      "Next 3 games: never step forward to last-hit a minion that is not about to die to your own turret. In every fight, move between autos rather than standing through the animation.",
  },
};
