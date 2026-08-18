import type { Lesson } from "@/domains/academy/types";

export const roamingCostsAWave: Lesson = {
  slug: "roaming-costs-a-wave",
  trackId: "mid",
  title: "A Roam Costs a Wave, So It Has to Buy One",
  summary:
    "Every walk out of mid is paid for in minions you will not collect. The arithmetic that tells you whether the roam was worth it — before you leave, not after.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Price a roam against the wave and the plate it costs you",
    "Leave only after a crash, so the lane is not paying for the whole trip",
    "Abort a roam that has gone stale instead of committing to it",
  ],
  fixes: ["low_cs", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Roaming looks free because nothing bad happens at the moment you leave. The bill arrives ninety seconds later, when you come back to a wave under your turret, a plate gone, and an opponent who is a level up. A roam is a purchase, and like every purchase it is only good if what you got is worth more than what you paid.",
    },
    {
      kind: "keyPoint",
      title: "The price is fixed: one wave, sometimes a plate",
      text: "Leaving mid costs about a wave of minions and the tempo of the next one. Before fourteen minutes it can also cost a turret plate, which is a hundred and sixty gold and part of a component. So the question is simple: is what I am walking toward worth a wave and a plate? A kill is. A drake is. A gank that might work on a lane that is pushed to their turret is not.",
    },
    {
      kind: "table",
      caption: "What a roam has to return",
      head: ["Roam", "Worth a wave?", "Condition"],
      rows: [
        ["Drake or herald fight", "Yes, always", "Leave 30–40 seconds before it spawns"],
        ["Gank a lane with a pushed wave", "Yes", "Their wave near your turret and CC available"],
        ["Gank a lane pushed into their turret", "No", "There is nothing to close the distance with"],
        ["Warding the enemy jungle", "Sometimes", "Only on the way to something else"],
        ["Following your jungler because he pinged", "Only if it is one of the above", "A ping is not a reason"],
      ],
    },
    { kind: "drill", drillId: "roam-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Roaming from a wave that was pushing toward you",
      text: "You leave mid with the wave heading to your own turret. The gank does not work. You walk back to find your minions dead under your turret, your opponent sitting on a level lead, and a plate missing — you paid full price for a trip that returned nothing.",
      fix: "Leave *after* you crash the wave into their turret. That way the minions you would have missed are dying to their tower anyway, your opponent has to stay and collect, and the trip costs you a fraction of what it would have. Crashing first also buys you the seconds you need to arrive before the fight starts rather than after.",
    },
    {
      kind: "keyPoint",
      title: "A roam that has gone stale is not a sunk cost",
      text: "You arrive bot and the enemy has backed off, or your jungler has walked away, or the wave has moved. The instinct is to stay because you have already paid for the walk. Turn around. The wave is the same price whether you waste thirty more seconds or not, and a mid laner who commits to dead roams spends half the game walking.",
    },
    { kind: "drill", drillId: "roam-decision" },
    {
      kind: "checklist",
      title: "Before walking out of mid",
      items: [
        "Have I crashed the wave, or am I paying full price for this trip",
        "What is the specific thing I am going to get — name it before you go",
        "Is it worth a wave and, before fourteen minutes, a plate",
        "If it is not there when I arrive, am I willing to turn around immediately",
      ],
    },
  ],
  drills: [
    {
      id: "roam-quiz",
      kind: "quiz",
      prompt: "When is the cheapest moment to leave mid lane?",
      options: [
        {
          id: "a",
          label: "Right after your wave crashes into the enemy turret",
          explain:
            "Correct. The minions you would have missed are dying to their tower regardless, and your opponent has to stay and collect them. Same roam, a fraction of the price, and you leave with a head start on whoever follows.",
          correct: true,
        },
        {
          id: "b",
          label: "When the wave is pushing toward your own turret",
          explain:
            "The most expensive moment there is. Those minions die under your turret while you are away, and the wave resets in a state that gives your opponent the next one as well.",
          correct: false,
        },
        {
          id: "c",
          label: "When the wave is frozen in the middle of the lane",
          explain:
            "A neutral wave keeps its value while you are gone, but your opponent can follow you freely — and if they do not, they take the wave you left standing.",
          correct: false,
        },
        {
          id: "d",
          label: "Immediately after you recall, before walking back to lane",
          explain:
            "Cheap in minions but usually too slow: you arrive from base with the window already closed. The roam that works is the one that starts from lane with a crash behind it.",
          correct: false,
        },
      ],
    },
    {
      id: "roam-decision",
      kind: "decision",
      situation:
        "9:50. You have just crashed your wave into their turret and started walking bot to gank. Halfway there you see the enemy bot lane recall and your jungler turn back toward his own camps.",
      facts: [
        "Wave already crashed — the roam is mostly paid for",
        "Enemy bot lane is recalling; nothing to gank",
        "Your jungler has turned around",
        "Your own wave will bounce back toward mid in about 20 seconds",
      ],
      options: [
        {
          id: "a",
          label: "Turn around immediately and be in mid for the bounce",
          explain:
            "Correct. What you paid for is gone, and the next thirty seconds are a fresh cost with nothing to buy. Getting back for the bounce means the crash you made still works for you.",
          correct: true,
        },
        {
          id: "b",
          label: "Continue and ward their bottom jungle since you are already there",
          explain:
            "A ward is worth something, but not a second wave. This is the roam that has gone stale being justified after the fact — the ward is the excuse, not the reason.",
          correct: false,
        },
        {
          id: "c",
          label: "Wait in the bush for the enemy bot lane to come back",
          explain:
            "You would be standing still for thirty-plus seconds against players who have just bought items. Waiting for a lane to return is the most expensive form of hovering there is.",
          correct: false,
        },
        {
          id: "d",
          label: "Take their bottom-side camps as compensation",
          explain:
            "Camps belong to your jungler and taking them is a real cost to your own team. It is also further from the lane you need to be in when the wave bounces.",
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
      "Next 3 games: never leave mid lane without crashing the wave first, and name the thing you are going to get before you walk. If it is not there when you arrive, turn around immediately.",
  },
};
