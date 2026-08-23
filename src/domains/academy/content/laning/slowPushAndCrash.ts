import type { Lesson } from "@/domains/academy/types";

export const slowPushAndCrash: Lesson = {
  slug: "slow-push-and-crash",
  trackId: "laning",
  title: "Slow Push & Crash",
  summary:
    "The slow push is the strongest tool in laning: you build a wave that does the work for you, then cash it in for a turret, a dive, or a free recall.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Build a slow push deliberately instead of by accident",
    "Time a crash so it arrives when you want it, not when the wave decides",
    "Choose the right payout for the wave you built",
  ],
  fixes: ["low_cs", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "A slow push is a wave you are deliberately growing. You kill only what you must, let your minions outnumber theirs, and every 30 seconds the gap widens as your survivors join the next wave. Three cycles later you have a wave big enough to take a turret on its own — and the enemy has to choose between losing the turret and standing under it while you and your jungler arrive.",
    },
    {
      kind: "keyPoint",
      title: "How to build one, precisely",
      text: "Last-hit only. Do not use abilities on the wave and do not auto-attack minions that are not about to die. Kill the enemy casters last, since they do the most damage to your minions. Your wave will grow by two or three minions per cycle. Two cycles is a decent push; three is a wave the enemy cannot ignore.",
    },
    { kind: "gate" },
    {
      kind: "table",
      caption: "What to cash a slow push in for",
      head: ["Situation", "The payout"],
      rows: [
        [
          "Your jungler is nearby and the enemy is low",
          "A dive — the wave tanks the turret while you kill them",
        ],
        [
          "Enemy turret is low or plates are still up",
          "A turret or 2–3 plates while they cannot clear",
        ],
        [
          "You need to reset with an item threshold hit",
          "A free recall — the biggest wave you will ever crash",
        ],
        [
          "An objective is spawning on the other side",
          "Crash, then walk to the objective with the enemy stuck clearing",
        ],
        [
          "You have none of the above",
          "Do not build it — a big wave with no plan is a gank magnet",
        ],
      ],
    },
    {
      kind: "prose",
      text: "That last row is the one people skip. A slow push is a commitment: while you are building it you are standing in the middle of the lane with a growing wave and a shrinking escape. If you do not know what you are cashing it in for, you are just building a reason for the enemy jungler to visit.",
    },
    {
      kind: "mistake",
      title: "Building a slow push and then recalling before the crash",
      text: "You spend 90 seconds carefully growing the wave, then back at the wrong moment. The wave crashes without you, dies to the turret, and bounces back as a huge wave that the enemy now farms under their own turret.",
      fix: "The recall comes after the crash, never before. If you need to recall mid-push, shove the whole thing in instead and take the smaller payout — an early crash beats a wasted one.",
    },
    { kind: "drill", drillId: "slow-push-decision" },
    {
      kind: "prose",
      text: "Timing the crash matters as much as building it. A crash is not instantaneous: a big wave takes 10–20 seconds to chew through a turret's attention. If you want the wave to be crashing exactly when drake spawns, you have to start the last shove roughly half a minute earlier. Good laners are always working backwards from a moment they have already picked.",
    },
    {
      kind: "checklist",
      title: "The slow push routine",
      items: [
        "Decide the payout before you start building — dive, turret, recall, or objective",
        "Last-hit only; kill enemy casters last",
        "Two to three cycles, no more — after that the wave is a liability",
        "Ward before the final shove, because that is when you are deepest",
        "Crash, take the payout, then recall on the bounce",
      ],
    },
    { kind: "drill", drillId: "slow-push-order" },
  ],
  drills: [
    {
      id: "slow-push-decision",
      kind: "decision",
      situation:
        "11:20. You have built a three-cycle slow push and it is about to crash into the enemy turret. Your jungler pings that they are coming to your lane in 15 seconds. The enemy laner is at 55% health under their turret with no flash.",
      facts: [
        "Big wave crashing into their turret now",
        "Your jungler arrives in ~15s",
        "Enemy: 55% health, no flash, under turret",
        "Two plates still up, 2:40 until they expire",
      ],
      options: [
        {
          id: "a",
          label: "Wait for the jungler and dive",
          explain:
            "Correct. This is exactly what a slow push is built for: the wave tanks the turret, the enemy has no flash, and a second body turns a risky dive into a clean one. You get the kill, the plates and the turret pressure out of one wave.",
          correct: true,
        },
        {
          id: "b",
          label: "Take the plates alone right now",
          explain:
            "You will get one plate before the enemy clears the wave and the turret turns on you. Fifteen seconds of patience converts the same wave into a kill plus both plates.",
          correct: false,
        },
        {
          id: "c",
          label: "Crash and recall — you built it for the reset",
          explain:
            "A reset is the payout you take when nothing better is available. A dive with a jungler against a flashless enemy is much better, and you can still recall afterwards.",
          correct: false,
        },
        {
          id: "d",
          label: "Back off and let the wave crash on its own",
          explain:
            "This throws away 90 seconds of work. The wave crashes, the enemy farms it under turret, and the bounce comes back to them.",
          correct: false,
        },
      ],
    },
    {
      id: "slow-push-order",
      kind: "order",
      prompt: "Put the steps of a deliberate slow push in order.",
      items: [
        { id: "a", label: "Decide what you are cashing the wave in for" },
        { id: "b", label: "Last-hit only for two to three cycles, casters last" },
        { id: "c", label: "Ward the river before the final shove" },
        { id: "d", label: "Shove the whole wave into the turret" },
        { id: "e", label: "Take the payout — dive, plates, turret or recall" },
      ],
      correctOrder: ["a", "b", "c", "d", "e"],
      explain:
        "The plan comes first, because the plan decides how many cycles you build. The ward goes down before the final shove, not after, because the shove is the moment you are deepest and most gankable. And the payout is taken at the crash, not two waves later.",
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.6,
    games: 3,
    instruction:
      "Next 3 games: build exactly one deliberate slow push per game. Name the payout before you start, ward before the final shove, and take the payout you named.",
  },
};
