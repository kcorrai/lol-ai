import type { Lesson } from "@/domains/academy/types";

export const waveStates: Lesson = {
  slug: "wave-states",
  trackId: "laning",
  title: "The Four Wave States",
  summary:
    "Every wave in every lane is in one of four states. Learn to read which one you are in and lane stops being a mystery.",
  minutes: 6,
  access: "free",
  objectives: [
    "Name the four wave states and identify each on sight",
    "Explain why minions push toward whoever is not killing them",
    "Predict where the wave will be in 30 seconds before it gets there",
  ],
  fixes: ["low_cs", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Almost everything that happens in a lane is decided by a wave, and almost no player below Diamond can name the state their wave is in. That is the whole gap. Wave management is not an advanced topic — it is the operating system the lane runs on, and it has exactly four states.",
    },
    {
      kind: "keyPoint",
      title: "The one rule underneath all four",
      text: "Minions push toward whoever kills fewer of them. That is it. If you kill minions faster than your opponent, your minions die faster, theirs survive, their wave grows, and the wave pushes at you. Every state below is a consequence of that single rule.",
    },
    {
      kind: "table",
      caption: "The four states",
      head: ["State", "What it looks like", "What it is for"],
      rows: [
        [
          "Pushing",
          "Your wave is bigger and walking toward their turret",
          "Priority — you can leave lane, roam, or contest an objective",
        ],
        [
          "Crashing",
          "Your wave has arrived at their turret and is dying to it",
          "A free recall, and the wave bounces back toward you afterwards",
        ],
        [
          "Slow push",
          "Your wave is slightly bigger and growing every cycle",
          "Building a big wave to crash later, usually for a dive or a turret",
        ],
        [
          "Freeze",
          "The wave sits still just outside your turret",
          "Starving the enemy of CS while you farm safely",
        ],
      ],
    },
    {
      kind: "prose",
      text: "Read the table again and notice something: none of the four states is 'good' or 'bad'. Each one is a tool with a purpose. Pushing is right when you want to be somewhere else. Freezing is right when you want your opponent to be stuck. The mistake is not choosing the wrong state — it is not choosing at all, and letting the wave do whatever it does while you react to it.",
    },
    {
      kind: "mistake",
      title: "Auto-attacking minions with no plan",
      text: "You hit the caster minions because they are there. The wave shoves into their turret at a random moment, you have no recall ready and no reason to be pushed, and now you are standing in the most dangerous part of the lane with the enemy jungler unaccounted for.",
      fix: "Before you start hitting the wave, decide what you want from it: to leave, to recall, to build a bigger wave, or to hold it still. Then hit minions in the way that produces that.",
    },
    { kind: "drill", drillId: "wave-state-quiz" },
    {
      kind: "prose",
      text: "There is a direct link between the wave state and your safety, and this is the part that fixes deaths. Being pushed toward the enemy turret means you are far from your own, which means the enemy jungler has a long window to reach you and you have a long walk home. Almost every early gank that succeeds happens against a pushed wave. If you cannot see the enemy jungler and you are shoving, you are not farming — you are volunteering.",
    },
    {
      kind: "checklist",
      title: "Reading the wave in three seconds",
      items: [
        "Count the minions on each side. More of yours than theirs means you are pushing.",
        "Is the gap growing or shrinking? Growing slowly means it is a slow push.",
        "Is the wave moving at all? If it is stationary near your turret, it is a freeze — deliberate or accidental.",
        "Whichever state it is: is that the state you actually want right now?",
      ],
    },
    { kind: "drill", drillId: "wave-state-decision" },
    {
      kind: "prose",
      text: "Reading a state is half of it. The other half is putting the wave into the state you want, which is four decisions in a row and no single one of them obvious. The drill below is exactly that: the wave starts even in the middle of the lane, and you have four cycles to park it outside your own turret.",
    },
    { kind: "drill", drillId: "wave-state-sim" },
    {
      kind: "prose",
      text: "The next three lessons take one state each and turn it into something you can do on purpose: building a slow push and cashing it in, holding a freeze, and trading inside a wave you control. This lesson is the vocabulary. The rest is grammar.",
    },
  ],
  drills: [
    {
      id: "wave-state-sim",
      kind: "wave-sim",
      prompt:
        "The wave is even and sitting in the middle of the lane. Freeze it just outside your own turret. Four cycles, one decision each.",
      start: { advantage: 0, position: 0 },
      goal: "freeze",
      cycles: 4,
      explain:
        "A freeze is built in two moves, not one. First you let their wave outnumber yours — leave it alone — so it walks toward your turret. Then, before it arrives, you start killing again to hold the gap at one minion, which is the point where nothing pushes anything. Keep leaving it alone the whole way and it does not freeze, it crashes into your own turret and bounces back at them.",
    },
    {
      id: "wave-state-quiz",
      kind: "quiz",
      prompt:
        "You have 6 minions alive and the enemy has 3. Neither of you is attacking the wave. What happens over the next 20 seconds?",
      options: [
        {
          id: "a",
          label: "Your wave grows and pushes harder toward their turret",
          explain:
            "Correct. Six minions kill three faster than three kill six, so your survivors carry over and meet the next wave. The advantage compounds every cycle — that is exactly what a slow push is.",
          correct: true,
        },
        {
          id: "b",
          label: "The wave evens out and stays in the middle",
          explain:
            "Waves do not self-correct. A minion advantage compounds, because the surviving minions join the next wave and the gap widens.",
          correct: false,
        },
        {
          id: "c",
          label: "Their wave grows because they have fewer minions dying",
          explain:
            "It is the other way around — their minions are the ones dying faster, because they are outnumbered.",
          correct: false,
        },
      ],
    },
    {
      id: "wave-state-decision",
      kind: "decision",
      situation:
        "9:00. Your wave is crashing into the enemy turret. You are at 60% health with 900 gold. The enemy jungler has not been seen for 45 seconds and you have no vision in the river.",
      facts: [
        "Wave: crashing into their turret now",
        "You: 60% health, 900g",
        "Enemy jungler: unseen 45s, no river vision",
        "Enemy laner is under their turret with you",
      ],
      options: [
        {
          id: "a",
          label: "Recall on the crash",
          explain:
            "Correct. The crash is the free-recall moment: nothing dies while you are away, the wave bounces back toward you, and it gets you out of the most dangerous position on the map with a jungler unaccounted for. Two problems solved with one button.",
          correct: true,
        },
        {
          id: "b",
          label: "Stay and try to take plates",
          explain:
            "Plates are valuable, but at 60% health, standing in the deepest part of the lane with an unseen jungler and no vision, this is the exact set-up that produces a death. Recall, then come back with an item and vision.",
          correct: false,
        },
        {
          id: "c",
          label: "Back off toward the river and look for the jungler",
          explain:
            "Walking toward the unwarded river to find a jungler you cannot see is how you find them. The crash gave you a free exit — use it.",
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
      "Next 3 games: every time the wave resets, name its state out loud — pushing, crashing, slow push, or freeze. If you are pushing and cannot see the enemy jungler, stop pushing.",
  },
};
