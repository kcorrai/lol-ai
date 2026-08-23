import type { Lesson } from "@/domains/academy/types";

export const ninetySecondsBefore: Lesson = {
  slug: "ninety-seconds-before",
  trackId: "jungle",
  title: "The Ninety Seconds Before a Pit",
  summary:
    "Objectives are the jungler's job and they are decided before the timer hits zero. What to be doing with the minute and a half nobody else on your team is counting.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Start preparing an objective ninety seconds out instead of on the spawn timer",
    "Clear the half of the jungle the fight will happen in, not the half you are on",
    "Judge a smite fight before you are in it, by numbers rather than by reflex",
  ],
  fixes: ["objective_neglect", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Ask a bronze jungler when they start thinking about drake and they say 'when it spawns'. Ask a good one and they say 'about a minute and a half out', because by the time the pit is up everything that decides it has already happened: who has priority in the lanes, who has vision of the approaches, and who is standing on the right side of the map with camps still up. The fight for an objective is the ninety seconds before it, and the smite is the receipt.",
    },
    {
      kind: "keyPoint",
      title: "Clear toward the objective, not away from it",
      text: "Ninety seconds out, every camp you take should be on the half of the map the pit is on. It is the same gold either way, and one version leaves you standing there with vision and a level while the other leaves you sprinting across the river arriving last. This is the single easiest thing a jungler can fix and it costs nothing at all.",
    },
    {
      kind: "table",
      caption: "The countdown",
      head: ["Time to spawn", "What you are doing", "Why"],
      rows: [
        ["90s", "Clearing the camps on that half of the map", "Same gold, better position"],
        [
          "60s",
          "Ward the approaches — theirs, not the pit",
          "You need to know if they are coming, not that the pit exists",
        ],
        [
          "30s",
          "Ask your lanes to push, and make sure you can see two of them",
          "Priority is what decides whether the fight is 5v5 or 5v3",
        ],
        [
          "0s",
          "Start it, or do not — the decision was made at 30s",
          "Deciding at zero means deciding blind",
        ],
      ],
    },
    { kind: "drill", drillId: "pit-map" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Starting an objective because it spawned",
      text: "Drake is up so you walk into the pit and hit it. Two lanes are shoved into your own turrets, nobody has swept the river, and their team arrives twenty seconds in with you at half health and no vision. You smite it under pressure, lose the fight, and give them the next one for free.",
      fix: "A spawn timer is not a decision. The decision is whether you have priority in two lanes and vision on the approaches, and if you do not, the correct play is to take the enemy's camps instead and start the objective on the next window with the map set up. Objectives you take late are worth exactly as much as objectives you take early.",
    },
    {
      kind: "keyPoint",
      title: "The smite fight is arithmetic, not reflex",
      text: "Before their jungler is anywhere near the pit, know two numbers: how much damage your smite does at your level, and how much health the objective has left when it is in that range. If you are contesting into an enemy who arrives first, you are not smiting for the objective — you are smiting for the eight seconds of tempo, and the decision to fight or leave is one you make before your health bar makes it for you.",
    },
    { kind: "drill", drillId: "pit-decision" },
    {
      kind: "checklist",
      title: "Ninety seconds before any pit",
      items: [
        "Am I clearing on the correct half of the map",
        "Is the approach warded — their route in, not the inside of the pit",
        "Do two of my lanes have priority, and have I asked for it early enough to matter",
        "If their jungler shows up first, am I fighting or leaving? Decide now",
      ],
    },
    {
      kind: "mapFigure",
      caption: "Ninety seconds out: clear toward the objective",
      annotations: [
        {
          at: { x: 0.69, y: 0.75, r: 0.055 },
          label: "Drake will spawn here",
          tone: "neutral",
          note: "In ninety seconds. Everything you do before then should be on this half of the map.",
        },
        {
          at: { x: 0.55, y: 0.65, r: 0.055 },
          label: "Bot-side camps",
          tone: "good",
          note: "Same gold as top-side farms, but finishing here leaves you standing next to Drake with vision and a level.",
        },
      ],
    },
  ],
  drills: [
    {
      id: "pit-map",
      kind: "map",
      prompt: "Drake spawns in sixty seconds and you are setting up. Click where the ward goes.",
      options: [
        {
          id: "approach",
          label: "Their route down into the bottom river",
          explain:
            "Correct. The ward has to answer 'are they coming, and from where' with enough warning to act. This one buys you the seconds between finding out and having to decide.",
          correct: true,
          at: { x: 0.83, y: 0.6, r: 0.075 },
        },
        {
          id: "in-pit",
          label: "Inside the pit",
          explain:
            "It watches an objective whose timer you can already read. Whatever it shows you arrives at the same moment as the enemy team, which is far too late to be information.",
          correct: false,
          at: { x: 0.71, y: 0.78, r: 0.075 },
        },
        {
          id: "their-red",
          label: "Their red buff, on the top half",
          explain:
            "A useful ward ten minutes ago and the wrong half of the map right now. It cannot tell you anything about a fight that is going to happen bottom side in sixty seconds.",
          correct: false,
          at: { x: 0.6, y: 0.24, r: 0.075 },
        },
        {
          id: "own-tri",
          label: "Your own bottom tri-bush",
          explain:
            "This guards a retreat rather than informing a decision. Safe, and it tells you they are coming at the moment they are already on top of you.",
          correct: false,
          at: { x: 0.31, y: 0.85, r: 0.075 },
        },
      ],
    },
    {
      id: "pit-decision",
      kind: "decision",
      situation:
        "19:30. Herald is gone and Baron spawns in 90 seconds. You are top side with three camps up on the bottom half. Two of your lanes are pushed into the enemy turrets.",
      facts: [
        "Baron spawns in 90 seconds, top side of the map",
        "Three of your camps are up on the bottom half",
        "Two lanes currently have priority",
        "Nobody has swept the top river yet",
      ],
      options: [
        {
          id: "a",
          label: "Clear the top-side camps and sweep the river approaches while priority holds",
          explain:
            "Correct. The camps are the same gold wherever you take them, so take the ones that leave you standing next to Baron with vision set. Priority is already yours — the work is turning it into a set-up pit before it expires.",
          correct: true,
        },
        {
          id: "b",
          label: "Clear the three bottom camps first — they are worth more right now",
          explain:
            "Identical gold, and it finishes with you on the wrong half of the map with no vision and lanes whose priority has expired by the time you arrive.",
          correct: false,
        },
        {
          id: "c",
          label: "Group with your team at Baron and wait for the spawn",
          explain:
            "Five people standing on an empty pit for ninety seconds is ninety seconds of side waves feeding turrets, and it tells the enemy exactly what you intend to do.",
          correct: false,
        },
        {
          id: "d",
          label: "Invade their bottom-side jungle while your lanes have priority",
          explain:
            "It is a real option at other times, but not with Baron in ninety seconds — it puts you as far as possible from the only objective that matters right now.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "visionScore",
    direction: "increase",
    delta: 4,
    games: 3,
    instruction:
      "Next 3 games: ninety seconds before every drake and Baron, move your clear to that half of the map and ward the enemy's approach — not the pit — before the timer reaches thirty.",
  },
};
