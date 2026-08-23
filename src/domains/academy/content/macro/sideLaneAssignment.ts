import type { Lesson } from "@/domains/academy/types";

export const sideLaneAssignment: Lesson = {
  slug: "side-lane-assignment",
  trackId: "macro",
  title: "Who Goes to the Side Lane",
  summary:
    "After twenty minutes the gold is in the side lanes and your team is standing in mid poking at a turret. Who walks, which side, and what they are supposed to be doing there.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Assign a side lane by what the player can survive alone, not by their role",
    "Read which side is safe from where the last objective happened",
    "Break the five-man-mid pattern that donates two waves a minute",
  ],
  fixes: ["objective_neglect", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Open any of your losses at the twenty-five minute mark and look at where everyone is standing. Five champions in a clump in mid lane, poking at a turret they are not going to take, while two side waves walk into empty lanes and die to towers. That is four hundred gold a minute leaving the game, and everybody on your team believes they are 'grouping'.",
    },
    {
      kind: "keyPoint",
      title: "Side lanes are the mid game's gold mine",
      text: "A side wave is 200-odd gold plus the turret pressure it applies. Two side lanes running unattended for four minutes is a full item nobody bought. This is why professional games look like three people mid and two people spread out — not because it is safer, but because the map is where the money is.",
    },
    {
      kind: "table",
      caption: "Who is a side laner",
      head: ["What they have", "Which lane", "What they do there"],
      rows: [
        [
          "Can win a 1v1 outright",
          "The dangerous side",
          "Push, threaten the turret, force two of them to answer",
        ],
        [
          "Has teleport up",
          "Either — teleport is the safety net",
          "Push and rotate on the objective when it starts",
        ],
        [
          "Fast wave clear, no duel",
          "The safe side, nearest your own turrets",
          "Clear and leave; never fight for it",
        ],
        [
          "The carry with no escape",
          "Nowhere alone",
          "Mid, with the team, farming behind the front line",
        ],
      ],
    },
    {
      kind: "prose",
      text: "Notice that the table never says 'the top laner takes top'. Roles stop mattering the moment the laning phase ends; what matters is who survives being alone. A fed toplaner takes the side the enemy would have to send two people to, an immobile mage takes the side with the shortest walk home, and the ADC does not take a side lane at all unless the enemy is dead or on the other side of the map.",
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Side laning by inertia",
      text: "You walk to the lane you laned in, because that is your lane. It is the far side from the drake that just spawned, the enemy has vision of the entire path, and you die there for the third time, alone, while your team fights four-versus-five.",
      fix: "Pick the side from the map, not from the loading screen. The safe side is the one where your team just took an objective, because that is where their vision died and their team is not. Walk that one, and rotate as the map flips.",
    },
    {
      kind: "keyPoint",
      title: "The side laner's actual job is threat, not damage",
      text: "You are not there to take the turret alone. You are there so that ignoring you costs a turret, which forces one or two of them to walk away from mid — and the fight your team wanted becomes four-versus-three. If you die, you have done the opposite: your team is now fighting four-versus-five and you have given them the tempo you were supposed to be taking.",
    },
    {
      kind: "mapFigure",
      caption: "Three in the middle, one on each side — and the two sides are not the same job",
      annotations: [
        {
          at: { x: 0.48, y: 0.5, r: 0.055 },
          label: "The three",
          tone: "good",
          note: "Mid, holding the objective and the fight that might happen at it. This is the part everybody already does — the lesson is that it is three people and not five.",
        },
        {
          at: { x: 0.7, y: 0.15, r: 0.055 },
          label: "The side they are near",
          tone: "bad",
          note: "Whichever side lane is closest to where the enemy is standing. It goes to the player who wins a 1v1 outright, because he is the only one for whom two of them walking over is a good outcome rather than a death.",
        },
        {
          at: { x: 0.55, y: 0.85, r: 0.055 },
          label: "The side they are far from",
          tone: "good",
          note: "The other one, nearest your own turrets. Fast wave clear and no duel goes here: clear it, take what is free, and leave before anyone can arrive. Never fight for this lane.",
        },
      ],
    },
    { kind: "drill", drillId: "side-lane-decision" },
    {
      kind: "checklist",
      title: "Every time an objective ends",
      items: [
        "Two go to side lanes, three hold mid — never five anywhere for more than thirty seconds",
        "The side you just fought on is the safe one; take it with whoever is weakest alone",
        "Push until they send two, then leave — the second one arriving is the payout, not the fight",
        "If you cannot see two of them and you are alone in a side lane, you are already late",
      ],
    },
    { kind: "drill", drillId: "side-lane-quiz" },
  ],
  drills: [
    {
      id: "side-lane-decision",
      kind: "decision",
      situation:
        "26:00. Your team has just taken drake bottom and everyone is walking back to mid. You are the top laner, even in gold, with teleport up. Baron spawns in three minutes.",
      facts: [
        "Drake just taken bottom, enemy team retreated top side",
        "You are even in gold, teleport up",
        "Baron in 3 minutes",
        "Both side waves are pushing toward your turrets",
      ],
      options: [
        {
          id: "a",
          label: "Take the bottom side lane — where the fight just was — and push it",
          explain:
            "Correct. Their vision on that half just died with the drake fight and their team walked the other way. Teleport means you can pressure it and still be at Baron when it matters. This is the cleanest three minutes on the map.",
          correct: true,
        },
        {
          id: "b",
          label: "Go back to top lane, because that is your lane",
          explain:
            "Inertia. Top is the side they just retreated toward — you are walking into their five with the least vision and the longest way home.",
          correct: false,
        },
        {
          id: "c",
          label: "Group mid with everyone and set up Baron early",
          explain:
            "Three minutes of five people standing near a pit is three minutes of side waves feeding your turrets. Set up Baron at minus sixty, not minus one-eighty.",
          correct: false,
        },
        {
          id: "d",
          label: "Clear your own jungle camps to catch up on gold",
          explain:
            "Safe and small. The camps will still be there; the window where their team is on the wrong side of the map will not.",
          correct: false,
        },
      ],
    },
    {
      id: "side-lane-quiz",
      kind: "quiz",
      prompt:
        "You are pushing a side lane alone and two enemies rotate to stop you. What is the correct response?",
      options: [
        {
          id: "a",
          label: "Leave immediately — two of them walking to you is the payout",
          explain:
            "Correct. The moment two of them are committed to your lane, your team is four-versus-three somewhere that matters. Staying to fight throws away the advantage you just created, and dying hands it back with interest.",
          correct: true,
        },
        {
          id: "b",
          label: "Fight — you can probably win a 2v1 with turret help",
          explain:
            "Even if you win it, you took the fight the map did not need. And 'probably' in a 2v1 is how a side laner becomes a shutdown bounty for the team that was losing.",
          correct: false,
        },
        {
          id: "c",
          label: "Keep pushing under the turret and force them to dive",
          explain:
            "You are betting your life on their discipline. The correct read is that you have already won this exchange — collect it by walking away.",
          correct: false,
        },
        {
          id: "d",
          label: "Ping your team to come help you",
          explain:
            "That converts your advantage into a five-versus-five in the worst place on the map. The point of a side lane is that your team does not come.",
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
      "Next 3 games after 20 minutes: never stand with four teammates for more than 30 seconds. Take the side lane on whichever half of the map the last objective happened, push until two enemies answer, then leave.",
  },
};
