import type { Lesson } from "@/domains/academy/types";

export const teleport: Lesson = {
  slug: "teleport",
  trackId: "top",
  title: "Teleport Is a Map Resource, Not a Recall",
  summary:
    "The summoner spell that defines the role, spent by most players on getting back to a lane they already had. What it is actually for, and what holding it is worth.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Name the three uses of teleport that are worth a five-minute cooldown",
    "Recognise the lane states where teleporting back is throwing the spell away",
    "Treat the enemy's teleport timer as information you are allowed to use",
  ],
  fixes: ["objective_neglect", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Teleport does not exist so you can be in top lane. You were already in top lane. It exists because top lane is far away from everything, and it is the game's answer to that: once every few minutes, the island connects to the rest of the map. Spend it on walking back to your own lane and you have paid a five-minute cooldown for about twenty seconds of walking.",
    },
    {
      kind: "keyPoint",
      title: "The spell is worth what it moves you toward",
      text: "Teleporting to a lane you were going to reach anyway buys you seconds. Teleporting into a fight your team is already in, onto a wave you can convert into a turret, or behind an objective the enemy has committed to, buys you an event that would not have happened. One of those wins games and the other saves a walk.",
    },
    {
      kind: "figure",
      caption: "What you are actually holding",
      assets: [
        {
          ref: { of: "summoner", spell: "teleport" },
          label: "Teleport",
          note: "Five-minute cooldown that is worth the wait only when it moves you toward something that could not happen without you, not toward somewhere you would have walked eventually.",
        },
      ],
    },
    {
      kind: "table",
      caption: "What the spell is for",
      head: ["Use", "What it actually buys", "When"],
      rows: [
        ["Into a fight", "A fifth player in a 4v5 your team is already losing", "Only when the fight is still live, never as revenge"],
        ["Onto a crashing wave", "A turret, or two waves of free gold on a side lane", "After a back, when their side laner is dead or elsewhere"],
        ["Flank at an objective", "An angle nobody is warding, from behind their line", "When the pit fight is about to start and they have used vision"],
        ["Back to lane", "Twenty seconds of walking", "Only when losing the wave costs a plate or a turret"],
      ],
    },
    { kind: "drill", drillId: "teleport-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Teleporting back to a lane that was fine",
      text: "You back on a good recall, buy your item, and immediately teleport to your own turret so you do not miss a wave. Two minutes later there is a fight at herald, your team is 4v5, and your teleport has three minutes left on it. You saved eighteen seconds of walking and paid for it with the only objective of the early game.",
      fix: "After you back, walk. If the wave is going to cost you more than a plate in the time it takes, teleport — otherwise the spell stays up, and the whole map knows it. A held teleport is a threat that changes what the enemy team is allowed to do.",
    },
    {
      kind: "keyPoint",
      title: "Their teleport is on the same clock as yours",
      text: "When the enemy top laner uses it, note the minute. For the next five minutes they cannot answer a dive, cannot join a fight from a side lane, and cannot punish you for leaving your lane. That window is the single most reliable piece of information in the role, and it costs nothing to write down.",
    },
    { kind: "drill", drillId: "teleport-decision" },
    {
      kind: "checklist",
      title: "Before you press teleport",
      items: [
        "Is there a fight, an objective or a turret at the other end — or just a wave",
        "Will I arrive while it is still happening, or after it is decided",
        "If I hold it instead, what does the enemy have to stop doing",
        "Have they used theirs? If yes, the next five minutes are mine to spend",
      ],
    },
  ],
  drills: [
    {
      id: "teleport-quiz",
      kind: "quiz",
      prompt: "Which of these is the weakest use of teleport?",
      options: [
        {
          id: "a",
          label: "Teleporting to your own turret after a back so you do not miss a wave",
          explain:
            "Correct — this is the weak one. You were going to reach that lane in twenty seconds anyway. You have converted a five-minute map resource into a handful of minions and taken yourself out of the next objective fight entirely.",
          correct: true,
        },
        {
          id: "b",
          label: "Teleporting into a 4v5 your team is fighting at drake",
          explain:
            "This is one of the strong uses. Arriving mid-fight turns a lost 4v5 into a 5v5 with someone at full health, which is usually the whole fight.",
          correct: false,
        },
        {
          id: "c",
          label: "Teleporting onto a wave crashing into the enemy bot turret",
          explain:
            "Strong. That is a turret, or at minimum two waves of gold their bot lane has to answer for — the classic post-back teleport.",
          correct: false,
        },
        {
          id: "d",
          label: "Teleporting to a ward behind their team as a fight starts at herald",
          explain:
            "Strong, and the hardest one to defend against. A flank from a ward nobody cleared is why teams sweep before they commit.",
          correct: false,
        },
      ],
    },
    {
      id: "teleport-decision",
      kind: "decision",
      situation:
        "14:20. You just backed with 2200 gold and bought. Your wave is bouncing back to the middle of top lane. Drake spawns in 40 seconds and your team is walking toward the pit. The enemy top laner used teleport two minutes ago.",
      facts: [
        "Your teleport is up; theirs is on cooldown for another three minutes",
        "Drake in 40 seconds, your team already moving",
        "Your top wave is neutral in the middle of the lane",
        "You are the strongest 1v1 on the map right now",
      ],
      options: [
        {
          id: "a",
          label: "Walk to top, shove the wave, then teleport to the drake fight when it starts",
          explain:
            "Correct. You collect the wave nobody can punish you for — their teleport is down, so they cannot answer top — and you still arrive at the objective with the spell doing the one thing it is best at. This is the whole role in one rotation.",
          correct: true,
        },
        {
          id: "b",
          label: "Teleport straight to top lane so you do not lose the wave",
          explain:
            "You are burning the spell to save a walk, and then standing in top lane while drake is taken without you. The wave was never going anywhere.",
          correct: false,
        },
        {
          id: "c",
          label: "Walk to drake with your team and leave the top wave",
          explain:
            "Safe and small. Their top laner has no teleport, so the one thing they cannot contest right now is the wave you are giving away for free.",
          correct: false,
        },
        {
          id: "d",
          label: "Walk top and stay there through the drake — you cannot fight anyway",
          explain:
            "Half right and it wastes the good half. Shoving the wave is correct; refusing to join the objective when you are the strongest body on the map and hold a teleport is not.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 4,
    games: 3,
    instruction:
      "Next 3 games: never teleport to your own lane unless a turret or a plate is about to fall. Every other teleport must land on a fight, an objective or a wave crashing into an enemy turret.",
  },
};
