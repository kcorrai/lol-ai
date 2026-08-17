import type { Lesson } from "@/domains/academy/types";

export const theFirstBack: Lesson = {
  slug: "the-first-back",
  trackId: "laning",
  title: "The First Back",
  summary:
    "The first recall of the game sets the tempo for the next five minutes. Hit the right gold number on the right wave and you come back stronger than the player who did neither.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Name a gold threshold worth backing for in your role",
    "Combine a threshold with a wave state instead of choosing between them",
    "Explain why the first back decides the shape of the next two waves",
  ],
  fixes: ["low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "By about six minutes, both laners have gone back once. That single decision — when, on what wave, with how much gold — is one of the largest tempo swings available in the early game, and it is almost entirely under your control. The player who backs on a crash with a threshold hit returns to a bouncing wave with a real purchase. The player who backs on a whim returns behind on both.",
    },
    {
      kind: "keyPoint",
      title: "Two variables, one decision",
      text: "A good first back needs a gold threshold and a wave state at the same time. Threshold without wave state costs you minions and hands over the lane. Wave state without threshold means you walked home to buy nothing. Wait for the two to line up — and they will, because you can steer both.",
    },
    { kind: "gate" },
    {
      kind: "table",
      caption: "Rough first-back thresholds by role",
      head: ["Role", "Aim for", "Why"],
      rows: [
        ["Solo laners", "~1,100–1,300g", "Enough for a real component or a cheap completed item plus a ward"],
        ["ADC", "~1,100g+", "A component that changes your damage, not two longswords"],
        ["Support", "~800g", "Item progress plus a control ward — vision is the job"],
        ["Jungler", "Whatever clears faster", "Tempo matters more than the item; do not lose a camp cycle for 200g"],
      ],
    },
    {
      kind: "prose",
      text: "Now put the two variables together in practice. You are approaching your threshold and the wave is neutral. Do not back. Instead, steer the wave: shove it so it crashes into their turret at roughly the moment you cross the number. You arrive in base with the money, the wave dies to their turret rather than to your absence, and it bounces back toward you so you return to a wave that is walking into your half of the lane.",
    },
    {
      kind: "mistake",
      title: "Backing on the number alone",
      text: "You hit 1,300g mid-wave, back immediately, buy your item, and return to find the enemy has shoved two waves under your turret and taken a plate. You bought an item and paid for it twice.",
      fix: "Hitting the number is the trigger to set up the back, not to take it. Shove first, cross the number on the way, recall on the crash.",
    },
    { kind: "drill", drillId: "first-back-decision" },
    {
      kind: "prose",
      text: "There is a version of this that wins lanes outright: backing slightly early to hit a threshold your opponent cannot match, then returning with an item spike while they are still farming for theirs. That is a deliberate tempo play — you accept a small gold loss to buy a 60-second window where you are strictly stronger. Combine it with a wave that is bouncing back to you, and that window is where plates and kills come from.",
    },
    {
      kind: "checklist",
      title: "First back checklist",
      items: [
        "Know your threshold before the game starts",
        "As you approach it, start steering the wave toward their turret",
        "Recall on the crash, not on the number",
        "Buy the strongest single thing, plus a control ward if it does not break the threshold",
        "Come back to a bouncing wave and look for the trade while your item is fresh",
      ],
    },
    { kind: "drill", drillId: "first-back-order" },
  ],
  drills: [
    {
      id: "first-back-decision",
      kind: "decision",
      situation:
        "5:30. You have 1,050 gold and your component costs 1,100. The wave is neutral in the middle of the lane. Your opponent is at full health and has not backed either.",
      facts: [
        "You: 1,050g, component costs 1,100",
        "Wave: neutral, middle of lane",
        "Opponent: full health, has not backed",
        "No jungler pressure in sight",
      ],
      options: [
        {
          id: "a",
          label: "Shove the wave into their turret, cross 1,100 on the way, recall on the crash",
          explain:
            "Correct — this is the whole lesson in one move. The shove gets you the last 50 gold, nothing dies while you are away because the wave is on their turret, and the bounce brings the next wave back toward you so you return with an item and a favourable wave.",
          correct: true,
        },
        {
          id: "b",
          label: "Back now and buy two smaller items",
          explain:
            "You are 50 gold and about fifteen seconds away from a real component. Backing on a neutral wave also hands your opponent a free shove while you walk.",
          correct: false,
        },
        {
          id: "c",
          label: "Keep farming until 1,500 for a bigger purchase",
          explain:
            "Holding gold in lane is holding power you are not using, and the longer you wait the more likely your opponent backs first and returns with their own spike.",
          correct: false,
        },
        {
          id: "d",
          label: "Freeze the wave and wait for your opponent to back first",
          explain:
            "A reasonable idea in some matchups, but you are giving up your own item timing to react to theirs. Steering your own back is stronger than waiting on theirs.",
          correct: false,
        },
      ],
    },
    {
      id: "first-back-order",
      kind: "order",
      prompt: "Order the steps of a well-executed first back.",
      items: [
        { id: "a", label: "Know your threshold before leaving the fountain" },
        { id: "b", label: "As you approach the number, start shoving the wave" },
        { id: "c", label: "Wave crashes into their turret" },
        { id: "d", label: "Recall and buy the strongest single item you can afford" },
        { id: "e", label: "Return to the bouncing wave and look for a trade on the fresh item" },
      ],
      correctOrder: ["a", "b", "c", "d", "e"],
      explain:
        "The threshold is decided before the game, not discovered mid-lane. The shove starts before you hit the number so the two line up. The recall happens on the crash, and the item is used immediately — an item spike you do not press is an item spike you wasted.",
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: decide your first-back threshold before you leave the fountain. Do not recall until the wave is crashing into their turret and you have the gold. Note what you buy and how the lane feels for the next two waves.",
  },
};
