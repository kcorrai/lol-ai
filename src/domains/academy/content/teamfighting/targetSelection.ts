import type { Lesson } from "@/domains/academy/types";

export const targetSelection: Lesson = {
  slug: "target-selection",
  trackId: "teamfighting",
  title: "Who You Actually Press",
  summary:
    "\"Kill the carry\" is the most repeated advice in League and it is wrong about half the time. The target is whoever you can kill without leaving the place you are allowed to stand.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Choose a target from where you are allowed to stand, not from the scoreboard",
    "Say when killing the tank in front of you is the correct play",
    "Stop trading your life for a carry that was going to die anyway",
  ],
  fixes: ["high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Every guide tells you to kill the enemy carry. Then you watch a professional ADC spend an entire fight auto-attacking a tank, and the tank dies, and they win the fight. Both things are true, and the rule that reconciles them is not about who is squishiest — it is about what you can reach without giving up your position.",
    },
    {
      kind: "keyPoint",
      title: "The target is the best thing you can hit from where you are standing",
      text: "Not the best thing on their team. The best thing reachable from a position you are allowed to hold. If reaching their ADC means walking through their front line, then their ADC is not a target, it is a trap — and the tank in your face is worth killing because killing it is what eventually opens the door.",
    },
    {
      kind: "table",
      caption: "Reading the fight in one question",
      head: ["Situation", "Target", "Because"],
      rows: [
        ["Their front line is between you and everyone", "The front line", "It is the only thing you can hit while staying alive"],
        ["Their carry steps forward alone", "The carry, immediately", "The position you are allowed to hold now includes them"],
        ["Their assassin dives your backline", "The assassin", "It is next to you, and it is the fight's biggest threat to you"],
        ["Everyone is in melee range of everyone", "Whatever dies fastest", "Damage in a blender is measured in kills, not in intentions"],
      ],
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Flashing in to finish a carry that was already dead",
      text: "Their ADC is at 15% and backing away. You use your escape as a gap closer to finish them, land the kill, and die to the three people you just walked into. The fight becomes four-versus-four with your carry gone.",
      fix: "A kill you take by giving up your position costs the rest of the fight. If somebody else on your team can finish it, they will — and if nobody can, the trade you are making is your whole fight for one of theirs.",
    },
    {
      kind: "prose",
      text: "There is one exception, and it is worth naming precisely because it looks like the mistake: when the kill ends the fight. If their carry dying means the remaining four cannot win the fight and have to disengage, then spending your escape is correct — you are not buying a kill, you are buying the fight. The test is whether their team can continue after it. Usually they can, which is why the exception is rarer than it feels.",
    },
    { kind: "drill", drillId: "target-decision" },
    {
      kind: "keyPoint",
      title: "Tanks are not immortal, they are slow",
      text: "The reason killing a tank feels pointless is that it takes six seconds. But a fight lasts about eight, and a tank that dies at second six is a tank that stopped protecting anybody at second six. Meanwhile every one of those six seconds you were alive and attacking is damage their team had to answer.",
    },
    { kind: "drill", drillId: "target-quiz" },
  ],
  drills: [
    {
      id: "target-decision",
      kind: "decision",
      situation:
        "A fight starts in the Baron pit. You are the ADC, behind your front line. Their tank is in your face, their mage is throwing spells from the far side, and their ADC is behind their tank at full health. Your escape is up.",
      facts: [
        "You are behind your front line, tank in your face",
        "Their ADC is behind their tank, full health",
        "Their mage is on the far side",
        "Your escape is available",
      ],
      options: [
        {
          id: "a",
          label: "Attack the tank in front of you and keep your escape",
          explain:
            "Correct. It is the only target reachable from a position you can hold, every second of damage into it is real, and your escape is still there for the moment their assassin or their engage actually arrives.",
          correct: true,
        },
        {
          id: "b",
          label: "Escape past the tank to reach their ADC",
          explain:
            "That is walking into four people to attack the one who is furthest from you. Even if you land the kill, you are standing in the middle of their team without an escape.",
          correct: false,
        },
        {
          id: "c",
          label: "Focus the mage — it is squishy and doing the most damage",
          explain:
            "Doing the most damage is true and unreachable is also true. The mage is on the far side of a fight you would have to cross to touch.",
          correct: false,
        },
        {
          id: "d",
          label: "Hold your attacks until a better target appears",
          explain:
            "A fight lasts eight seconds. Damage you did not do because you were waiting is damage that never happens, and the tank you did not chip is the tank still standing at second six.",
          correct: false,
        },
      ],
    },
    {
      id: "target-quiz",
      kind: "quiz",
      prompt: "When is spending your escape to kill the enemy carry the right call?",
      options: [
        {
          id: "a",
          label: "When their team cannot continue the fight without that champion",
          explain:
            "Correct. That is the only version where you are buying the fight rather than buying a kill. If the other four can keep fighting afterwards, you have traded your whole fight for one of theirs.",
          correct: true,
        },
        {
          id: "b",
          label: "When the carry is below 20% health",
          explain:
            "Health is about whether the kill is available, not whether it is worth your position. A carry at 20% is very often one somebody else on your team finishes for free.",
          correct: false,
        },
        {
          id: "c",
          label: "When you are ahead in items and can survive the return damage",
          explain:
            "Being ahead makes the dive survivable more often, which is exactly why it is such a reliable way to lose a won game. Surviving is not the same as the trade being good.",
          correct: false,
        },
        {
          id: "d",
          label: "When your team has already committed to the fight",
          explain:
            "Your team committing tells you a fight is happening, not that walking through their front line is the way to win it.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "kda",
    direction: "increase",
    delta: 0.6,
    games: 3,
    instruction:
      "Next 3 games: in every teamfight, attack the best target reachable without leaving your position, and keep your escape for the threat that comes to you. Only spend it on a kill that ends the fight outright.",
  },
};
