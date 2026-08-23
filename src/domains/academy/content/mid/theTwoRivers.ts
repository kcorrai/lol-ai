import type { Lesson } from "@/domains/academy/types";

export const theTwoRivers: Lesson = {
  slug: "the-two-rivers",
  trackId: "mid",
  title: "The Most Gankable Lane on the Map",
  summary:
    "Mid is short, which is why you can leave it. It is also open on both sides, which is why everybody can arrive. One ward, and a position that makes the gank not worth attempting.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Ward the river the enemy jungler is actually on, not both by habit",
    "Stand on the side of the wave that faces the danger you know about",
    "Give up a wave rather than a summoner spell when you have no vision",
  ],
  fixes: ["high_deaths", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Every advantage in mid lane comes from being close to everything. So does every death. Two rivers open onto the lane, the walk from either one is a few seconds, and there is no long path home the way there is in a side lane. The role's defining risk is that you are always in range — and the defence is not caution, it is information.",
    },
    {
      kind: "keyPoint",
      title: "One ward, on the side you already suspect",
      text: "Warding both rivers is a habit, not a plan; you do not have the trinket charges for it and half of them are watching an empty river. Ward the side their jungler started, or the side he was last seen on, and play the other one by respecting it. The ward is not there to make you safe — it is there to let you push a wave you would otherwise have to give up.",
    },
    { kind: "drill", drillId: "rivers-map" },
    { kind: "gate" },
    {
      kind: "table",
      caption: "Where to stand while you farm",
      head: ["What you know", "Where you stand", "What it costs"],
      rows: [
        [
          "Their jungler is top side",
          "The bottom half of the wave",
          "Nothing — you can still last-hit everything",
        ],
        ["No idea where he is", "Behind the wave, nearer your turret", "A few minions"],
        [
          "He is bottom side and your wave is pushed",
          "Take what you can reach and leave",
          "Half a wave, instead of a flash",
        ],
        [
          "He just appeared bottom on the minimap",
          "Push, immediately — this is your window",
          "Nothing; this is the free one",
        ],
      ],
    },
    {
      kind: "mistake",
      title: "Standing in the middle of the lane with no vision",
      text: "You have no wards, you have not seen their jungler for a minute, and you are standing in the centre of the lane to last-hit a caster minion. He comes out of the river brush behind you, and the two seconds it takes to turn and run are the whole gank.",
      fix: "With no information, farm from the back of the wave. You lose one or two minions per wave and you become almost impossible to gank, because every route to you is now long enough to see coming. Minions are the cheapest thing you own — flash is not, and a death in mid at nine minutes gives the enemy team the next objective.",
    },
    {
      kind: "keyPoint",
      title: "The seconds after a jungler appears elsewhere are yours",
      text: "When their jungler shows up on the bottom lane minimap, you have roughly twenty-five seconds in which mid lane cannot be ganked. That is a whole wave shoved for free, or a roam, or a dive. Most mid laners keep playing carefully through the one window where caution costs them everything and buys them nothing.",
    },
    { kind: "drill", drillId: "rivers-decision" },
    {
      kind: "checklist",
      title: "Mid lane safety, in order of what it costs",
      items: [
        "Ward the river you have a reason to suspect — one, not both",
        "No information? Stand behind the wave and lose a minion instead of a summoner",
        "Their jungler visible elsewhere? Push immediately, the window is short",
        "Never push past the middle of the lane while both rivers are dark",
      ],
    },
  ],
  drills: [
    {
      id: "rivers-map",
      kind: "map",
      prompt:
        "9:00. Their jungler started top side and you have not seen him since. You want to push this wave. Click where the ward goes.",
      options: [
        {
          id: "top-river",
          label: "The top-side river entrance into mid",
          explain:
            "Correct. It watches the route he is actually on, and it buys the exact thing you wanted — permission to push a wave you would otherwise have had to give up.",
          correct: true,
          at: { x: 0.33, y: 0.37, r: 0.075 },
        },
        {
          id: "bot-river",
          label: "The bottom-side river entrance",
          explain:
            "The river you have no reason to suspect. It is not a bad ward in general, and right now it is watching a path he would have to cross the whole map to use.",
          correct: false,
          at: { x: 0.66, y: 0.64, r: 0.075 },
        },
        {
          id: "their-blue",
          label: "Their blue buff",
          explain:
            "This tells you where he was, not whether he is coming. By the time it lights up he has already left, and you are still standing in a lane you did not dare push.",
          correct: false,
          at: { x: 0.6, y: 0.24, r: 0.075 },
        },
        {
          id: "own-turret",
          label: "The brush by your own mid turret",
          explain:
            "A ward that sees the gank as it lands. It protects nothing you could not already see, and it does not give you permission to do anything.",
          correct: false,
          at: { x: 0.42, y: 0.58, r: 0.075 },
        },
      ],
    },
    {
      id: "rivers-decision",
      kind: "decision",
      situation:
        "10:30. You have no wards and have not seen the enemy jungler in ninety seconds. The wave is even in the middle of the lane and you could shove it before the next one arrives.",
      facts: [
        "No vision on either river",
        "Enemy jungler unseen for 90 seconds",
        "Wave is neutral in the centre",
        "You are even in level, flash up",
      ],
      options: [
        {
          id: "a",
          label: "Farm from behind the wave and give up the minions you cannot reach safely",
          explain:
            "Correct. Ninety seconds unseen means he could be either river, and a lane you cannot see both sides of is a lane you do not push. Two minions is a much cheaper price than the flash — or the death — that the alternative usually costs.",
          correct: true,
        },
        {
          id: "b",
          label: "Shove the wave quickly and back off before he can arrive",
          explain:
            "The shove itself is the window. Standing in the middle of the lane for the eight seconds it takes is exactly when a jungler you cannot see arrives.",
          correct: false,
        },
        {
          id: "c",
          label: "Push and trade with your opponent — you have flash if it goes wrong",
          explain:
            "Spending flash to survive a gank you chose to walk into is not a plan, it is a refund. And you spend the next five minutes unable to leave the lane.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall to buy a control ward and walk back",
          explain:
            "The ward is right and the timing is not: you give up the whole wave and the level. Buy it on your next natural back and farm carefully until then.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.7,
    games: 3,
    instruction:
      "Next 3 games: when you have no vision and have not seen the enemy jungler for 30 seconds, farm from behind the wave and give up the minions you cannot reach. Push only when you have a ward or have just seen him elsewhere.",
  },
};
