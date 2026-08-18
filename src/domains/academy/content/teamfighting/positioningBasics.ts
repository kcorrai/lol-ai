import type { Lesson } from "@/domains/academy/types";

export const positioningBasics: Lesson = {
  slug: "positioning-basics",
  trackId: "teamfighting",
  title: "Where You Stand Before Anything Happens",
  summary:
    "Most teamfights are decided in the ten seconds before they start, by who is standing where. Positioning is not reflexes — it is arriving in the right place with the fight still in front of you.",
  minutes: 6,
  access: "free",
  objectives: [
    "Stand at the distance your champion actually needs, not the distance that feels brave",
    "Arrive at a fight already positioned instead of repositioning inside it",
    "Name who on the enemy team decides where you are allowed to stand",
  ],
  fixes: ["high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Watch your own deaths in teamfights and count how many of them happen in the first two seconds. For most players it is more than half. That is not a reaction speed problem — two seconds is not enough time to make a mistake. It is a standing problem: you were already in the wrong place when the fight started, and the fight simply arrived.",
    },
    {
      kind: "keyPoint",
      title: "Your distance is set by their engage, not by your range",
      text: "The question is not 'how far can I attack from'. It is 'what is the longest thing they can throw at me, and am I outside it'. If their engage tool reaches 600 units and you are standing at 550, your attack range is irrelevant — you are inside the fight whether or not you agreed to be.",
    },
    {
      kind: "table",
      caption: "Who you are in a fight",
      head: ["If you are", "You stand", "Your failure mode"],
      rows: [
        ["The front line", "In their face, first, on purpose", "Arriving second — the engage only works if it is yours"],
        ["A ranged carry", "Behind your front line, outside their engage range", "Walking forward to secure a kill that was already dying"],
        ["A mage", "Range of your longest spell, sideways to the fight", "Standing in the middle so every ability lands on you"],
        ["An assassin", "On the flank, waiting for the front lines to commit", "Going in first, before there is anything to punish"],
      ],
    },
    {
      kind: "prose",
      text: "The word that does the most work there is 'sideways'. Fights collapse toward the middle, so a champion standing directly behind their own front line is standing exactly where every area ability is aimed. Standing off to one side, at the same distance, means the same spells have to choose between you and the front line — and most of the time they choose the front line, because that is where the fight looks like it is.",
    },
    {
      kind: "mistake",
      title: "Repositioning after the fight starts",
      text: "The fight begins, you realise you are too far forward, and you walk backwards. Walking backwards in a fight is how you die twice: once because you are not attacking, and once because you are still inside their range while doing it.",
      fix: "Position before the first ability is cast. Once it has started, your options are commit or leave entirely — the slow shuffle backwards is neither, and it is the single most common way a carry dies with full health bars around it.",
    },
    { kind: "drill", drillId: "positioning-decision" },
    {
      kind: "checklist",
      title: "The ten seconds before",
      items: [
        "Find their engage — who on their team starts fights, and is that ability up?",
        "Stand outside its range, off to one side, before anyone throws anything",
        "Check what is behind you: a wall you can be pinned against is worse than open ground",
        "If you cannot do all three, the fight is not one you should be near yet",
      ],
    },
    { kind: "drill", drillId: "positioning-quiz" },
  ],
  drills: [
    {
      id: "positioning-decision",
      kind: "decision",
      situation:
        "Both teams are standing either side of the mid lane at 28:00, nobody committed. You are the ADC. Their engage is a hook support who is standing behind their front line, and there is a wall on your left.",
      facts: [
        "Five versus five, nobody engaged",
        "You are the ADC; their engage is a hook",
        "Hook support is behind their front line",
        "A wall on your left",
      ],
      options: [
        {
          id: "a",
          label: "Stand at maximum attack range, to the right, with the open ground behind you",
          explain:
            "Correct. Off the wall so you cannot be pinned, off the centre line so area abilities have to choose, and far enough back that the hook has to walk into your team to reach you. This is the whole job before the fight begins.",
          correct: true,
        },
        {
          id: "b",
          label: "Stand near the wall so you can only be approached from one side",
          explain:
            "That is the reasoning for a melee champion holding a corridor. For a carry it means one hook pins you against terrain with nowhere to walk — the wall is not cover, it is a wall.",
          correct: false,
        },
        {
          id: "c",
          label: "Stand directly behind your front line so they body-block the hook",
          explain:
            "It blocks the hook and it puts you in the exact spot every area ability is aimed at. Directly behind is the most contested square metre in a teamfight.",
          correct: false,
        },
        {
          id: "d",
          label: "Move up to threaten damage and back off when the hook is used",
          explain:
            "Reacting to a hook after it is thrown is a coin flip on latency and reflexes. Positioning is the thing that makes the coin flip unnecessary.",
          correct: false,
        },
      ],
    },
    {
      id: "positioning-quiz",
      kind: "quiz",
      prompt: "Why do more than half of carry deaths happen in the first two seconds of a fight?",
      options: [
        {
          id: "a",
          label: "The position was already wrong before the fight started",
          explain:
            "Correct. Two seconds is not enough time to make a positioning mistake, so the mistake was made earlier — standing inside their engage range while the fight had not begun.",
          correct: true,
        },
        {
          id: "b",
          label: "Enemy burst damage is too high to react to",
          explain:
            "Burst is only relevant if it can reach you. It reaches you because of where you were standing, which is the part you control.",
          correct: false,
        },
        {
          id: "c",
          label: "Teammates fail to peel quickly enough",
          explain:
            "Peel matters, and it is the next lesson's problem. But a peel that has to happen in the first two seconds is covering for a position that was wrong before anyone moved.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 1,
    games: 3,
    instruction:
      "Next 3 games: before every teamfight, name the enemy who starts fights and stand outside their engage range, off the centre line, with open ground behind you. Do not walk backwards once a fight has started — commit or leave.",
  },
};
