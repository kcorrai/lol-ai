import type { Lesson } from "@/domains/academy/types";

export const walkFirst: Lesson = {
  slug: "walk-first",
  trackId: "support",
  title: "Walk First",
  summary:
    "In the mid game the support's job is to be the first body around every corner. Not bravery — arithmetic, because you are the cheapest thing on the map to catch.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Lead every rotation instead of following your carry into it",
    "Check the corners that are about to matter, not the ones you are already past",
    "Recognise the moments where walking first is not worth what it risks",
  ],
  fixes: ["high_deaths", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Watch a team walk into a fight they lose and rewind ten seconds: almost always, the carry turned a corner before anybody else. The player with the most items found out what was behind the wall by being hit by it. There is a player on that team whose gold is worth a fraction of theirs and who was standing behind them, and that is the whole lesson.",
    },
    {
      kind: "keyPoint",
      title: "You are the cheapest body, so you go first",
      text: "If you get caught walking around a corner, your team loses a support with two items. If your ADC gets caught, they lose the game. Walking first is not courage, it is the same economic argument as warding: the role with no farm is the role that can afford to find things out. Everything else about mid-game positioning follows from it.",
    },
    {
      kind: "table",
      caption: "What to be in front of",
      head: ["Moment", "Who walks first", "What it saves"],
      rows: [
        ["Rotating through the river", "You, one screen ahead", "The carry walking into a waiting team"],
        ["Approaching a pit", "You, into the brush beside it", "Starting an objective on top of five people"],
        ["Sieging a turret", "You, at the front of the wave", "Your carry being the closest target"],
        ["Retreating through your own jungle", "Not you — you are last", "The person being chased is not the cheapest one"],
      ],
    },
    { kind: "drill", drillId: "walkfirst-map" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Following your carry into the fog",
      text: "Your ADC starts walking mid to river. You follow a step behind because you are protecting them. They turn the corner into three champions, and your peel starts a half-second after the damage does — you are now protecting somebody who is already at forty percent health, in a fight nobody chose.",
      fix: "Protecting a carry mostly happens before contact, not after it. Be a screen ahead through anything with a corner in it, and the fights you avoid are worth more than every shield you will cast this game. Your ability to save them once contact starts is small; your ability to stop contact starting is enormous.",
    },
    {
      kind: "keyPoint",
      title: "The exception is the retreat",
      text: "Walking first inverts when the team is leaving. In a retreat the last player through the corridor is the one who gets caught, and it should not be the person being chased. This is the one situation where the support is behind — body between the pursuit and the carry, and the last one out.",
    },
    { kind: "drill", drillId: "walkfirst-decision" },
    {
      kind: "checklist",
      title: "Mid-game movement",
      items: [
        "Am I ahead of my carry, or a step behind them",
        "Which corner is about to matter — walk into that one, not the last one",
        "Sweep before the team commits, not while it is committing",
        "Retreating? Then I am the last one out, not the first",
      ],
    },
  ],
  drills: [
    {
      id: "walkfirst-map",
      kind: "map",
      prompt:
        "21:00. Your team is rotating from mid toward the drake pit. You are ahead of them. Click the spot you check first.",
      options: [
        {
          id: "river-brush",
          label: "The river brush on the approach to the pit",
          explain:
            "Correct. It is the corner your team is about to walk around, and it is the one place a waiting team can be without being seen. Checking it before the group arrives is the difference between a fight you chose and one you found.",
          correct: true,
          at: { x: 0.66, y: 0.66, r: 0.075 },
        },
        {
          id: "in-pit",
          label: "Inside the pit itself",
          explain:
            "The pit is open ground you can already see into. Standing in it tells you nothing about the brush your carry is about to walk past.",
          correct: false,
          at: { x: 0.71, y: 0.78, r: 0.075 },
        },
        {
          id: "own-tri",
          label: "Your own bottom tri-bush, behind the team",
          explain:
            "A corner you have already passed. It protects a retreat you have not started and tells you nothing about the direction everybody is walking.",
          correct: false,
          at: { x: 0.31, y: 0.85, r: 0.075 },
        },
        {
          id: "their-blue",
          label: "Their blue buff, on the top half",
          explain:
            "The wrong half of the map entirely. Whatever it finds is a full screen from the corner your team is about to turn.",
          correct: false,
          at: { x: 0.6, y: 0.24, r: 0.075 },
        },
      ],
    },
    {
      id: "walkfirst-decision",
      kind: "decision",
      situation:
        "27:00. Your team took a bad fight and is retreating through your own jungle toward base. Your ADC is at 30% health and slowest of the group. Two enemies are chasing.",
      facts: [
        "Your team is retreating, not fighting",
        "Your ADC is the slowest and lowest",
        "Two enemies chasing, three unaccounted for",
        "You are at 60% health with your engage available",
      ],
      options: [
        {
          id: "a",
          label: "Be the last one out, between the chase and your ADC",
          explain:
            "Correct. Walking first inverts in a retreat: the last player through the corridor is the one who gets caught, and it should be the two-item support rather than the person being chased. This is peel as a position, before any ability is used.",
          correct: true,
        },
        {
          id: "b",
          label: "Run ahead to check the path home is clear",
          explain:
            "The instinct from every other moment in the game, applied at the one moment it inverts. Scouting ahead leaves the chased player alone with the chasers.",
          correct: false,
        },
        {
          id: "c",
          label: "Turn and engage the two chasers to buy time",
          explain:
            "You would start a fight while your team is at thirty percent and three enemies are unaccounted for. Buying time by dying only works if the time is worth more than the body, and here it is not.",
          correct: false,
        },
        {
          id: "d",
          label: "Split off to draw them toward you",
          explain:
            "It works on somebody who is chasing you and not on somebody who is chasing a kill they can see. Splitting off usually means the ADC dies and so do you, ten seconds apart.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: after 15 minutes, be the first body through every corner your team rotates around — and the last one out of every retreat. Your ADC should never be the one revealing a brush.",
  },
};
