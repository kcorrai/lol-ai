import type { Lesson } from "@/domains/academy/types";

export const jungleTracking: Lesson = {
  slug: "jungle-tracking",
  trackId: "laning",
  title: "Jungle Tracking From Lane",
  summary:
    "You do not need a ward to know where the enemy jungler is. Their first clear tells you, and every sighting after that narrows it down to a few seconds of guesswork.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Deduce the enemy jungler's starting side from the first 90 seconds",
    "Convert a single sighting into a 30-second window of safety",
    "Decide when to push based on where the jungler cannot be",
  ],
  fixes: ["high_deaths", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Every death to a gank you did not see coming is a piece of information you had and did not use. The enemy jungler is not invisible — they are on a route, that route takes a predictable amount of time, and the game tells you where it started if you are watching for the first thirty seconds.",
    },
    {
      kind: "keyPoint",
      title: "The first clear tells you everything",
      text: "At the start of the game, watch which side of the map the enemy laners leash on, or which of your camps gets invaded. A jungler who starts bottom side will reach the bottom lanes first and the top lane last. Their full clear takes roughly three and a half minutes, which means the far side of the map is safe for you for about that long.",
    },
    { kind: "gate" },
    {
      kind: "table",
      caption: "Turning a sighting into a window",
      head: ["What you saw", "What it means for the next 30 seconds"],
      rows: [
        ["Enemy jungler on the opposite side of the map", "You are safe — push freely, take plates"],
        ["Enemy jungler showed on your side 20s ago", "Assume they are still near. Do not push past the river."],
        ["Enemy jungler died", "You have their full respawn timer plus the walk. This is your window to take everything."],
        ["A camp of theirs is missing on the minimap", "They cleared it — you know where they were, count forward from there"],
        ["You have seen nothing for 60+ seconds", "Treat every bush as occupied until proven otherwise"],
      ],
    },
    {
      kind: "prose",
      text: "The last row is the one that matters most, because it is the state you are usually in. 'I have not seen the enemy jungler in a minute' is not neutral information — it is a warning. Most players treat it as neutral, keep shoving, and die. The correct response is to either place the ward that answers the question or to stop doing the thing that requires the answer.",
    },
    {
      kind: "mistake",
      title: "Pushing on a hunch",
      text: "You think their jungler is probably top because that is where they were a while ago, so you shove bot. They arrive from the river 15 seconds later, because 'a while ago' was 70 seconds and a jungler crosses the map in 25.",
      fix: "Convert time into distance. A jungler covers most of the map in about 25–30 seconds. Any sighting older than that is not a sighting, it is a memory.",
    },
    {
      kind: "mapFigure",
      caption: "Their jungler starts on one of two sides, and the first camp tells you which",
      annotations: [
        {
          at: { x: 0.75, y: 0.65, r: 0.055 },
          label: "Started bottom side",
          tone: "neutral",
          note: "He clears away from top lane, so top is safe for roughly three minutes and bottom is not. You did not need to see him to know this — you needed to see which camp died first.",
        },
        {
          at: { x: 0.4, y: 0.2, r: 0.055 },
          label: "Started top side",
          tone: "neutral",
          note: "The mirror. The clear runs toward the bottom half, so the lane that gets the first visit is the one furthest from where he began.",
        },
        {
          at: { x: 0.55, y: 0.32, r: 0.055 },
          label: "The crossing",
          tone: "bad",
          note: "Whichever side he started, this is the ground he covers to reach the other half, and it takes him about thirty seconds. That number is the whole lesson: a sighting is worth something for thirty seconds and nothing at all after.",
        },
      ],
    },
    { kind: "drill", drillId: "tracking-quiz" },
    {
      kind: "prose",
      text: "There is a second use for this that most players never reach: tracking tells you when to push, not only when not to. If you know the enemy jungler just started their bottom-side camps, you have a free minute in the top lane. That is a free wave, free plates, and a free deep ward — and you can take it without a ward of your own, because you already know the answer.",
    },
    {
      kind: "checklist",
      title: "Tracking routine",
      items: [
        "First 60 seconds: work out which side the enemy jungler started",
        "Every time you see them, note the clock — the sighting expires in 30 seconds",
        "Before every shove: where were they last, and how long ago?",
        "If the answer is 'no idea', ward first or do not push",
        "When they die, immediately take the most valuable thing on the map",
      ],
    },
    { kind: "drill", drillId: "tracking-decision" },
  ],
  drills: [
    {
      id: "tracking-quiz",
      kind: "quiz",
      prompt:
        "You saw the enemy jungler top side 45 seconds ago and you are bot lane. How should you treat that information?",
      options: [
        {
          id: "a",
          label: "As expired — 45 seconds is more than enough time to cross the map",
          explain:
            "Correct. A jungler crosses most of the map in 25–30 seconds. At 45 seconds the sighting tells you nothing about where they are now, only where they are not still standing.",
          correct: true,
        },
        {
          id: "b",
          label: "As safe — they are still on the top side",
          explain:
            "This is the assumption that produces most avoidable deaths. Junglers move; 45 seconds is a long time.",
          correct: false,
        },
        {
          id: "c",
          label: "As a guarantee they are ganking top again",
          explain:
            "Overcorrecting the other way is also a guess. The honest answer is that you no longer know, which means ward or do not push.",
          correct: false,
        },
      ],
    },
    {
      id: "tracking-decision",
      kind: "decision",
      situation:
        "4:00. The enemy jungler was leashed on the bottom side at the start and you are top lane. You have not seen them since. Your wave is even and you have the option to shove for plates.",
      facts: [
        "Enemy jungler started bottom side",
        "It is 4:00 — a full clear takes about 3:30",
        "You are top lane with an even wave",
        "You have not warded the river",
      ],
      options: [
        {
          id: "a",
          label: "Ward the river now, then shove",
          explain:
            "Correct. A bottom-side start means the jungler has been clearing away from you, but at 4:00 the clear is finishing and top lane is exactly where they arrive next. This is the moment the free window closes — so the ward goes down before the shove.",
          correct: true,
        },
        {
          id: "b",
          label: "Shove freely — they started bottom, you are safe",
          explain:
            "You were safe. A full clear takes about 3:30 and it is 4:00, so the window has just closed and the top side is the natural next stop.",
          correct: false,
        },
        {
          id: "c",
          label: "Freeze and give up the plates",
          explain:
            "Too passive. The ward costs a trinket charge and turns the shove into a safe one; giving up plates for free is a real cost.",
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
      "Next 3 games: in the first 90 seconds, work out which side the enemy jungler started and say it out loud. Before every shove, ask when you last saw them. Older than 30 seconds means ward or do not push.",
  },
};
