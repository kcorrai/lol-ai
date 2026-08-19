import type { Lesson } from "@/domains/academy/types";

export const splitPushing: Lesson = {
  slug: "split-pushing",
  trackId: "top",
  title: "Splitting Is a Trade, Not a Duel",
  summary:
    "Being alone in a side lane at twenty-five minutes is either the strongest thing on the map or a free kill. The three conditions that decide which, and the trade you are actually making.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Split on the half of the map furthest from the live objective, not the nearest one",
    "Check the three timers that make a split survivable before you walk",
    "Leave the moment the second enemy commits — the rotation is the payout",
  ],
  fixes: ["objective_neglect", "high_deaths", "late_game_throw"],
  blocks: [
    {
      kind: "prose",
      text: "A split push is not you versus the person who comes to stop you. It is your turret against their objective, measured in seconds. You are betting that the turret you take is worth more than whatever they get for the time they let you take it — and the whole skill is in setting that trade up so the answer is yes before you walk into the lane.",
    },
    {
      kind: "keyPoint",
      title: "Split away from the objective, not toward it",
      text: "If Baron is up, you split bottom. If the drake is up, you split top. The point is to be the furthest thing on the map from the thing they want, so that answering you costs them the objective and ignoring you costs them a turret. Splitting on the same side as the live objective gives them both for free — they walk four steps, kill you, and take it.",
    },
    { kind: "drill", drillId: "split-map" },
    { kind: "gate" },
    {
      kind: "table",
      caption: "The three timers, checked before you walk",
      head: ["Timer", "Where you read it", "What it changes"],
      rows: [
        ["Their teleport", "The last time you saw them use it", "Whether one of them can answer instantly or has to walk"],
        ["Your wave", "Which way it is moving right now", "Whether you arrive to a crash or to nothing"],
        ["Their vision", "Whether your team has swept the river", "Whether they see you leave, or find out from a turret"],
      ],
    },
    {
      kind: "mistake",
      title: "Splitting until somebody kills you",
      text: "You push the wave in, they send one, you kill him, you keep pushing. They send two. You are ahead so you fight — and you die, in a lane far from everything, with a two-hundred-gold bounty and no teleport. Your team, who were setting up an objective on the assumption that two of them were busy with you, are now in a 4v5.",
      fix: "The second enemy arriving is the payout, not the fight. The moment two of them commit, you have already won the exchange: leave, and let your team cash it. Staying converts a won trade into a lost fight, and you are the one holding the bill.",
    },
    {
      kind: "keyPoint",
      title: "A split you cannot leave is not a split",
      text: "Before you commit, look at the way home. If the only route back is through the river they have vision of, you are not split pushing, you are standing somewhere convenient to be killed. The exit is part of the plan; a wave that dies to a turret while you walk out is cheaper than a death.",
    },
    { kind: "drill", drillId: "split-decision" },
    {
      kind: "checklist",
      title: "Before you walk into a side lane after twenty minutes",
      items: [
        "Which objective is live, and am I on the other side of the map from it",
        "Have they used teleport, and do I know when",
        "Does my team know I am splitting — one ping, before I go, not after I die",
        "Can I leave this lane without crossing a river they can see",
        "If two of them come, am I leaving, or am I fighting? Decide now, not then",
      ],
    },
    {
      kind: "mapFigure",
      caption: "Split away from the objective",
      annotations: [
        {
          at: { x: 0.69, y: 0.75, r: 0.055 },
          label: "Drake is live",
          tone: "neutral",
          note: "The objective your team is taking. You split on the opposite side of the map to force them into a choice.",
        },
        {
          at: { x: 0.1, y: 0.15, r: 0.055 },
          label: "Where you split",
          tone: "good",
          note: "Top lane is the furthest corner from Drake. Answering you means giving up the objective; ignoring you means a turret.",
        },
      ],
    },
  ],
  drills: [
    {
      id: "split-map",
      kind: "map",
      prompt:
        "28:00. Baron is up and both teams are holding around mid. You are the strongest 1v1 on the map with teleport available. Click the lane you split.",
      options: [
        {
          id: "bot-side",
          label: "The bottom side lane, on their half",
          explain:
            "Correct. Baron is on the top half, so the furthest place from it is the bottom side lane. Answering you means walking away from the objective they want; ignoring you means a turret. That is the trade a split is supposed to create.",
          correct: true,
          at: { x: 0.89, y: 0.62, r: 0.08 },
        },
        {
          id: "top-side",
          label: "The top side lane, on their half",
          explain:
            "This is the lane next door to Baron. They can kill you and start the objective in the same rotation, which means your split has bought them tempo rather than costing them any.",
          correct: false,
          at: { x: 0.1, y: 0.32, r: 0.08 },
        },
        {
          id: "mid",
          label: "Mid lane",
          explain:
            "Mid is thirty seconds from both halves — the one lane where nothing you do forces a choice. Pushing here is farming with extra steps and a shorter path to your body.",
          correct: false,
          at: { x: 0.5, y: 0.5, r: 0.08 },
        },
        {
          id: "own-half",
          label: "The bottom lane on your own half",
          explain:
            "Safe, and worth nothing. A wave cleared in front of your own turret threatens no structure, so there is no reason for anybody to walk away from Baron to deal with it.",
          correct: false,
          at: { x: 0.6, y: 0.9, r: 0.08 },
        },
      ],
    },
    {
      id: "split-decision",
      kind: "decision",
      situation:
        "31:00. You are pushing the bottom side lane into their inhibitor turret. Your team is grouped near Baron. Two enemies have just walked out of mid toward you and you have flash but no teleport.",
      facts: [
        "You are two items ahead and could probably kill one of them",
        "Two enemies rotating to you, arriving in about five seconds",
        "Your team is four strong, standing at Baron",
        "Baron is up and uncontested right now",
      ],
      options: [
        {
          id: "a",
          label: "Leave immediately and ping your team to start Baron",
          explain:
            "Correct. Two of them walking to the far corner of the map is exactly the outcome you were pushing for. Your team is 4v3 on the objective for as long as those two are busy — collect it by walking away, not by fighting.",
          correct: true,
        },
        {
          id: "b",
          label: "Fight the first one before the second arrives",
          explain:
            "You might win it. But the fight costs you the health, the flash and the seconds that made leaving safe, and the second one arrives while you are recovering. Winning a 1v1 you did not need is how a split push turns into a shutdown.",
          correct: false,
        },
        {
          id: "c",
          label: "Keep pushing — the turret is nearly down",
          explain:
            "A turret is worth less than a Baron, and much less than your life at thirty-one minutes. You are trading a structure you might get for a death that hands them the objective and the fight after it.",
          correct: false,
        },
        {
          id: "d",
          label: "Ping your team to rotate bottom and fight there",
          explain:
            "That throws away the advantage you created. The point of splitting is that your team does not come — pulling them across the map turns a 4v3 at Baron into a 5v5 in the worst corner of the map.",
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
      "Next 3 games: after 20 minutes, split only on the half of the map away from the live objective, and leave the lane the moment a second enemy commits to you. Never fight a 1v2 in a side lane, even when ahead.",
  },
};
