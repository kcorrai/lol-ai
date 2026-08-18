import type { Lesson } from "@/domains/academy/types";

export const dyingForTheRightReason: Lesson = {
  slug: "dying-for-the-right-reason",
  trackId: "support",
  title: "Dying for the Right Reason",
  summary:
    "You are the one champion whose death can be the correct play. Which makes it worth knowing exactly when it is — because most support deaths are not that, they are just deaths.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Trade your life only for something that was going to be lost anyway",
    "Tell a deliberate death apart from a careless one in your own games",
    "Stop paying with your life for objectives that were not contestable",
  ],
  fixes: ["high_deaths", "late_game_throw"],
  blocks: [
    {
      kind: "prose",
      text: "Almost every guide in the game says the same thing: do not die. The support is the exception, and it is a real one — there are moments where your death is the cheapest way to buy something the team needed. But 'my death is allowed to be worth something' turns very quickly into 'my death did not matter', and those are opposite claims.",
    },
    {
      kind: "keyPoint",
      title: "The trade has to be for something that was already leaving",
      text: "Your life is worth spending on a carry who was going to die, an objective that was going to be lost, or a retreat that was going to cost two people instead of one. It is not worth spending on a chance, a chase, or a fight that had not started. The test is simple: name the thing that was already on its way out. If you cannot, this was not a trade.",
    },
    {
      kind: "table",
      caption: "Worth it, or not",
      head: ["Situation", "Trade?", "Why"],
      rows: [
        ["Your fed ADC is about to be caught in a fight you are winning", "Yes", "One death instead of the one that loses the fight"],
        ["Body-blocking a chase during a retreat", "Yes", "You are the cheapest thing in the corridor"],
        ["Contesting a Baron your team cannot fight for", "No", "Nothing is being saved; you are adding a body to a loss"],
        ["Going in first to 'start something' at 34 minutes", "No", "Nothing was leaving — you created the loss"],
        ["Warding deep at 30 minutes with no team nearby", "No", "The ward is not worth a death and never was"],
      ],
    },
    { kind: "drill", drillId: "trade-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "The death that buys the ward",
      text: "Baron is coming up, so you walk deep into their jungle to place a control ward with nobody near you. You get caught. Now they have a free Baron because your team is a player down for the next ninety seconds — and the ward you died for is swept twenty seconds later.",
      fix: "Vision late in the game is placed with a team nearby, or from the safe side, or not at all. A support alive with no ward is worth much more than a ward with no support, because you are one of the five bodies that decide whether the objective happens at all. Deep wards are an early-game habit that gets people killed in the late one.",
    },
    {
      kind: "keyPoint",
      title: "Look at your own deaths and label them",
      text: "After a game, go through your deaths and put each one in a category: bought something, or bought nothing. It is uncomfortable and it is the fastest feedback available in the role, because the two feel identical while they are happening. Supports who improve quickly are the ones who stopped counting deaths and started counting which ones were purchases.",
    },
    { kind: "drill", drillId: "trade-decision" },
    {
      kind: "checklist",
      title: "Before spending your life",
      items: [
        "Name the thing that was already leaving — if you cannot, do not go",
        "Is my team winning this fight? Then my death has to be what keeps it that way",
        "Am I dying for a chance, or for something certain",
        "Late game: is there anybody near me at all",
      ],
    },
  ],
  drills: [
    {
      id: "trade-quiz",
      kind: "quiz",
      prompt: "Which of these support deaths is a purchase rather than a mistake?",
      options: [
        {
          id: "a",
          label: "Body-blocking the chase so your low ADC gets out of a fight your team is winning",
          explain:
            "Correct. The carry was already leaving the fight one way or another, and you swapped the expensive death for the cheap one while keeping the advantage the fight had produced.",
          correct: true,
        },
        {
          id: "b",
          label: "Dying to place a deep ward before Baron",
          explain:
            "The ward gets swept, and the ninety seconds your team spends a body down is exactly the window the objective happens in. Nothing was already leaving.",
          correct: false,
        },
        {
          id: "c",
          label: "Engaging first at a standoff to make something happen",
          explain:
            "This creates the loss rather than limiting one. Nothing was on its way out until you pressed the button.",
          correct: false,
        },
        {
          id: "d",
          label: "Contesting a Baron your team has already decided not to fight for",
          explain:
            "Adding one body to an objective four people walked away from does not contest it. It gives the enemy the buff and the pick.",
          correct: false,
        },
      ],
    },
    {
      id: "trade-decision",
      kind: "decision",
      situation:
        "31:00. A fight has gone well — you are three kills up in it and their team is retreating. Your ADC, at 25% health, has chased two of them into the enemy jungle and is about to be cut off.",
      facts: [
        "The fight is already won on kills",
        "Your ADC is at 25% and chasing, past your vision",
        "Two enemies are turning back on them",
        "You are at 70% with your engage available and Baron is up",
      ],
      options: [
        {
          id: "a",
          label: "Go in, use the engage on whoever is closest, and take the death instead of them",
          explain:
            "Correct. Your ADC is on the way out whether you act or not, so their death is the one already leaving. Trading yours for it keeps the fed carry alive for the Baron that is about to be taken, and that is what the trade bought.",
          correct: true,
        },
        {
          id: "b",
          label: "Ping them back and stay safe — they chose to chase",
          explain:
            "Correct about whose mistake it was and wrong about what to do next. Their death costs your team the Baron; yours does not. Being right is not worth a carry.",
          correct: false,
        },
        {
          id: "c",
          label: "Start Baron with the rest of the team while they fight it out",
          explain:
            "Starting Baron while two enemies are alive and your carry is dying is how a won fight becomes a lost objective. The buff is worth nothing without the champion who was going to use it.",
          correct: false,
        },
        {
          id: "d",
          label: "Follow them in and fight properly — you are ahead in the fight",
          explain:
            "Chasing two champions into their jungle with a 25% carry is how a won fight is handed back. Going in to extract is right; going in to keep fighting is not.",
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
      "Next 3 games: before every death you can see coming, name the thing that was already leaving. After each game, label your deaths as bought something or bought nothing, and place no deep wards alone after 25 minutes.",
  },
};
