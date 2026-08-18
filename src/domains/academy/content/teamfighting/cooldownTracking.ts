import type { Lesson } from "@/domains/academy/types";

export const cooldownTracking: Lesson = {
  slug: "cooldown-tracking",
  trackId: "teamfighting",
  title: "The Three Cooldowns Worth Counting",
  summary:
    "You cannot track ten champions' abilities and you do not need to. Three cooldowns decide whether a fight is available, and counting those three is a habit anyone can build.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Name the three cooldowns that decide whether a fight happens",
    "Start a count the moment one is used, rather than guessing later",
    "Take the fight that a used cooldown has just made free",
  ],
  fixes: ["high_deaths", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Ask a Diamond player how they knew to fight and they will say 'their engage was down'. Ask how they knew, and they will be slightly surprised by the question — they saw it used ninety seconds ago and have been counting since. That is the whole trick, and the reason it sounds like a superpower is that most players are tracking zero cooldowns rather than three.",
    },
    {
      kind: "keyPoint",
      title: "Three, not thirty",
      text: "Their engage — the ability that starts fights. Their disengage — the ability that ends one you are winning. And flashes, on the two champions who would use one to reach you. Everything else is noise you can afford to be surprised by; those three decide whether a fight is even available.",
    },
    {
      kind: "table",
      caption: "What each one buys you",
      head: ["Cooldown", "Roughly", "The window it opens"],
      rows: [
        ["Their engage ultimate", "80–120s", "Their team cannot start a fight — take objectives freely"],
        ["Their disengage", "60–100s", "A fight you start now cannot be walked away from"],
        ["A carry's flash", "300s", "Five minutes where they can be reached and cannot leave"],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The five-minute number is the one people underuse. A flash is the longest cooldown in the game outside of ultimates, and a carry without one is a carry who has to hold a position with their feet. When their ADC flashes over a wall to escape a skirmish, your team has a five-minute window where a single pick is available — that is not a detail, that is the shape of the next five minutes.",
    },
    {
      kind: "mistake",
      title: "Noticing the cooldown after the fight",
      text: "'Their engage was down, we could have fought.' Said in the post-game screen, after a fight you declined, about a window that closed ninety seconds ago.",
      fix: "Start the count out loud the instant it is used — say the number, or type it once in chat. A cooldown you noticed and did not start counting is a cooldown you do not know, because sixty seconds later 'a while ago' is not information.",
    },
    { kind: "drill", drillId: "cooldown-order" },
    {
      kind: "keyPoint",
      title: "The window is for an objective, not for a hunt",
      text: "A team with no engage is not a team you have to kill. It is a team that cannot stop you taking a drake, a Baron, or a turret. Spending the window walking into their jungle looking for a fight hands it back — they do not need an engage to punish five people wandering into fog.",
    },
    { kind: "drill", drillId: "cooldown-quiz" },
  ],
  drills: [
    {
      id: "cooldown-order",
      kind: "order",
      prompt:
        "Their engage support just used their ultimate in a skirmish that ended with nobody dying. Baron is up. Put your team's next ninety seconds in order.",
      items: [
        { id: "start", label: "Start Baron" },
        { id: "count", label: "Say the cooldown out loud and start counting" },
        { id: "setup", label: "Clear the nearest waves and ward their approach" },
        { id: "group", label: "Gather on the Baron side, together" },
      ],
      correctOrder: ["count", "setup", "group", "start"],
      explain:
        "The count comes first because everything after it is only correct while the window is open — and a window you did not time is a window you will misjudge. Then the ordinary setup, which does not stop being necessary just because their engage is down: waves cleared, vision placed, team gathered. Starting Baron is last, and it is the payout, not the plan.",
    },
    {
      id: "cooldown-quiz",
      kind: "quiz",
      prompt: "Their ADC flashes over a wall to escape a skirmish at 22:00. What has just changed about the next five minutes?",
      options: [
        {
          id: "a",
          label: "They have to hold their position on foot, so a single pick is available on them",
          explain:
            "Correct. Flash is the longest non-ultimate cooldown in the game, and a carry without one cannot leave a bad position. That is the fact that makes a pick — and therefore an objective — available for the whole window.",
          correct: true,
        },
        {
          id: "b",
          label: "Nothing much — they escaped, so the skirmish is over",
          explain:
            "The skirmish is over and the information is not. Treating an escape as an ending is how a five-minute advantage gets thrown away for nothing.",
          correct: false,
        },
        {
          id: "c",
          label: "Your team should force a fight immediately while they are low",
          explain:
            "Immediately is the one timing that ignores the rest of their team. The window is five minutes long; use it to set up something they cannot contest rather than to chase.",
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
      "Next 3 games: whenever the enemy engage ultimate, disengage or a carry's flash is used, say it out loud and start counting. Use the window on an objective, never on a hunt into fog.",
  },
};
