import type { Lesson } from "@/domains/academy/types";

export const towerPriorityAndPlates: Lesson = {
  slug: "tower-priority-and-plates",
  trackId: "macro",
  title: "Plates, Turrets and the Map They Open",
  summary:
    "Turret gold is the largest untouched pile in most players' games, and the map a fallen turret opens is worth more than the gold. Both have a clock on them.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Price a plate against the wave and the risk it costs to take",
    "Take the first turret for the map it opens, not the gold it drops",
    "Stop trading a turret you could have had for a kill you did not need",
  ],
  fixes: ["objective_neglect", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Turret plates expire at fourteen minutes. Until then each one is 160 gold, they come off in ones and twos, and a laner with priority who never touches them has left about a thousand gold in the middle of the map for nobody. Meanwhile the same player will chase a 300 gold kill across half the lane. The plate is closer, safer and larger, and it does not run away.",
    },
    {
      kind: "keyPoint",
      title: "A plate is a wave you already spent",
      text: "You shoved the wave, which is the risky part, and it is now hitting the turret whether you help or not. Standing there for four seconds and taking a plate is nearly free — the cost was the shove, and you have already paid it. The players who never take plates are the ones who shove and immediately walk back to the middle of the lane.",
    },
    {
      kind: "table",
      caption: "What is worth what, before fourteen minutes",
      head: ["The thing", "Gold", "The catch"],
      rows: [
        ["One plate", "160", "Four seconds of standing under a turret you can see"],
        ["A full wave", "~110", "Thirty seconds of lane, and it comes back"],
        [
          "A solo kill",
          "~300 plus tempo",
          "Requires the enemy to be wrong, and you to survive being right",
        ],
        [
          "First turret bonus",
          "~700 shared",
          "It never comes back — and it opens the map for everyone",
        ],
      ],
    },
    {
      kind: "prose",
      text: "The last row is the one to build a game around. First turret is the biggest single gold event before Baron, and the gold is not even the point: a fallen outer turret means the lane's minions push toward the enemy, the jungle behind it becomes yours to walk through, and the enemy laner has to farm further from home. That is why teams that take first turret win far more often than the gold difference alone explains.",
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Recalling with the wave crashing and the turret at half health",
      text: "You shoved, you are low, and you back with the wave sitting on their turret. Two minutes later you are wondering why the turret is still up and the wave is now under your own.",
      fix: "The recall is right — the timing is not. Take what the crash pays out first: plates while the wave tanks, or the turret itself if it is close, and back on the bounce. Backing a beat too early is how a lane full of good decisions produces no turret.",
    },
    {
      kind: "keyPoint",
      title: "After the turret, the lane changes shape",
      text: "Once the outer turret is gone the lane is longer and there is nothing to hold a wave for you, so a wave you shove is a wave that walks into their second turret and dies unattended. That is the moment to stop laning and start rotating — the turret you just took is the signal to leave, not an invitation to stay and push further.",
    },
    { kind: "drill", drillId: "plates-decision" },
    {
      kind: "checklist",
      title: "Turret discipline before 14:00",
      items: [
        "Every crash you cause: stay four seconds and take at least one plate",
        "Never chase a kill past a plate you could have taken instead",
        "If the turret is under 30% and you have the wave, finish it — first turret gold is shared with everyone",
        "The moment the outer turret dies, rotate. The lane stops paying and the map starts",
      ],
    },
    { kind: "drill", drillId: "plates-quiz" },
  ],
  drills: [
    {
      id: "plates-decision",
      kind: "decision",
      situation:
        "10:30 top lane. Your wave has just crashed into their turret and two plates are still up. You are at 55% health, your opponent recalled ten seconds ago, and the enemy jungler was last seen bottom side twenty seconds ago.",
      facts: [
        "Wave crashing, 2 plates up",
        "55% health, opponent just recalled",
        "Enemy jungler last seen bottom side, 20s ago",
        "Your recall is available",
      ],
      options: [
        {
          id: "a",
          label: "Take the plates while the wave tanks, then recall on the bounce",
          explain:
            "Correct. The opponent is gone, the jungler is a map away and inside the window where that still means something, and the wave is doing the tanking for you. Two plates is 320 gold for standing still — and recalling after means you lose nothing to the reset.",
          correct: true,
        },
        {
          id: "b",
          label: "Recall now while the lane is safe and come back for the next wave",
          explain:
            "The crash you paid for pays out now or never. Backing here means the plates are gone by the next cycle and the wave you shoved bounces back to the middle unharvested.",
          correct: false,
        },
        {
          id: "c",
          label: "Walk into their jungle to look for the enemy jungler",
          explain:
            "Trading a certainty for a coin flip, and doing it at 55% health on the half of the map you have no vision of.",
          correct: false,
        },
        {
          id: "d",
          label: "Push into the second turret while nobody is there",
          explain:
            "Greedy past the point the map supports. The second turret is a two-player job before fourteen minutes, and you are now the deepest player on the map with a jungler unaccounted for.",
          correct: false,
        },
      ],
    },
    {
      id: "plates-quiz",
      kind: "quiz",
      prompt:
        "Why does the team that takes first turret win so much more often than the gold alone would suggest?",
      options: [
        {
          id: "a",
          label:
            "The lane opens: their minions push toward you, the jungle behind it becomes yours, and their laner farms further from home",
          explain:
            "Correct. The gold is shared and pleasant; the map change is structural. A fallen turret converts one lane into permanent pressure and hands you the jungle entrance behind it for the rest of the game.",
          correct: true,
        },
        {
          id: "b",
          label: "The gold bonus is large enough to buy an item outright",
          explain:
            "It is around 700 shared across the team — real, but nowhere near the size of the effect. If it were only gold, the win rate difference would be a fraction of what it is.",
          correct: false,
        },
        {
          id: "c",
          label: "It denies the enemy their plates",
          explain:
            "Plates are already gone by the time a turret falls late, and at any rate this is a small part of it. The map access is the answer.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: every time your wave crashes into a turret before 14 minutes and the lane is safe, stay for at least one plate before doing anything else. Rotate out of the lane within 30 seconds of the outer turret falling.",
  },
};
