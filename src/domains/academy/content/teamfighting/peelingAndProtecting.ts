import type { Lesson } from "@/domains/academy/types";

export const peelingAndProtecting: Lesson = {
  slug: "peeling-and-protecting",
  trackId: "teamfighting",
  title: "The Peel Decision",
  summary:
    "Peeling is not loyalty to your carry. It is a calculation about which of two champions is going to produce more damage in the next six seconds, and sometimes the answer is not the one being attacked.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Decide who to protect by output, not by role or by who is shouting",
    "Peel with the ability that buys the most seconds, not the most damage",
    "Recognise the fights where peeling is the losing play",
  ],
  fixes: ["high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Peel gets taught as a duty: the support protects the ADC. That is a fine default and it is why so many fights are lost — the enemy assassin dives a two-item ADC who is nine hundred gold behind, three teammates turn around to help, and the actual carry of the game, your fed mid laner, is left standing alone in the fight everyone just left.",
    },
    {
      kind: "keyPoint",
      title: "Protect whoever is going to do the damage",
      text: "Six seconds of your fed mid laner is worth more than six seconds of a behind ADC, whatever the role names say. Before the fight, decide who your team's damage actually is — the scoreboard tells you — and that champion is the one worth spending abilities and your own life to keep alive.",
    },
    {
      kind: "table",
      caption: "What peel actually buys",
      head: ["Tool", "Buys", "Best against"],
      rows: [
        ["Hard CC on the diver", "2–3 seconds and their whole rotation", "An assassin who has committed with no escape"],
        ["A shield or heal", "One burst, if it lands before it", "Burst you can see coming"],
        ["A knock-back or slow", "Distance, which is time", "Anything melee that has to stay next to your carry"],
        ["Your own body", "One or two attacks", "Almost nothing — it is what you do when everything else is down"],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The last row is deliberately unflattering, because standing in front of your carry is the peel people reach for first and it is the weakest one available. Body-blocking works against single-target attacks and does nothing against abilities, and it usually means the peeler is now also inside the burst. If your peel is 'I stand there', the fight was already lost when the diver got in.",
    },
    {
      kind: "mistake",
      title: "Peeling for a carry who is already dead",
      text: "Their assassin lands everything on your ADC. You turn around, use your crowd control, and your ADC dies half a second later anyway. Now they are dead and you have spent your ability facing the wrong way while their team pushes into your team.",
      fix: "Peel before the burst lands or not at all. If the health bar is already gone, the correct response is to turn the fight into a trade: kill the diver, who is now standing in the middle of your team with nothing left, and win the four-versus-four.",
    },
    { kind: "drill", drillId: "peel-decision" },
    {
      kind: "keyPoint",
      title: "Sometimes the answer is that nobody peels",
      text: "If their engage is committed onto your front line and your carry is safe, turning around to peel a threat that has not arrived is how a team gives up its damage window. Peel is a reaction to a dive, not a formation — a team that plays every fight in a protective crouch never kills anybody.",
    },
    { kind: "drill", drillId: "peel-quiz" },
  ],
  drills: [
    {
      id: "peel-decision",
      kind: "decision",
      situation:
        "A fight starts at drake. Their assassin dives your ADC, who is two items behind. Your mid laner is fed, standing on the other side of the fight, and has just started their damage rotation. You are the support with one hard crowd control ability up.",
      facts: [
        "Their assassin has dived your behind ADC",
        "Your fed mid laner is mid-rotation, unthreatened",
        "You have one hard CC available",
        "Their front line is engaged on your tank",
      ],
      options: [
        {
          id: "a",
          label: "Use the CC on the assassin — it is a committed dive with no escape left",
          explain:
            "Correct, and note why: not because the ADC is your carry, but because an assassin who has already committed is the cheapest kill on the map and stopping them costs you one ability. You save a champion and remove one of theirs in the same action.",
          correct: true,
        },
        {
          id: "b",
          label: "Save the CC for their front line so your mid laner can keep casting",
          explain:
            "Defensible in principle — protect the damage — but their front line is already occupied with your tank, and the assassin is the only thing about to kill anybody.",
          correct: false,
        },
        {
          id: "c",
          label: "Body-block for your ADC and keep the ability",
          explain:
            "The weakest peel available, against the one threat it does nothing about. An assassin's damage is abilities, and abilities do not care what is standing in front of the target.",
          correct: false,
        },
        {
          id: "d",
          label: "Ignore it — the ADC is behind and the mid laner is the real carry",
          explain:
            "Right about who the carry is and wrong about the trade. The assassin is a free kill right now; ignoring them means they finish the ADC and then walk at your mid laner with a reset.",
          correct: false,
        },
      ],
    },
    {
      id: "peel-quiz",
      kind: "quiz",
      prompt: "Their assassin has landed their full rotation and your carry's health bar is already gone. What is the correct response?",
      options: [
        {
          id: "a",
          label: "Kill the assassin — they are standing in your team with nothing left",
          explain:
            "Correct. The peel window closed; the trade window opened. An assassin who has spent everything inside your team is the easiest kill of the fight, and taking it turns a lost carry into an even trade.",
          correct: true,
        },
        {
          id: "b",
          label: "Use your crowd control anyway to try to save them",
          explain:
            "The health bar is gone. The ability spent facing backwards is an ability not spent on the fight that is still winnable.",
          correct: false,
        },
        {
          id: "c",
          label: "Disengage — you are down a carry",
          explain:
            "Sometimes right later, but not in the second when their assassin is standing in your team on cooldown. Take the trade first, then decide whether the fight continues.",
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
      "Next 3 games: before each fight, name which champion on your team is the damage — from the scoreboard, not the role — and spend your protection on that one. If a dive has already landed its burst, turn and kill the diver instead.",
  },
};
