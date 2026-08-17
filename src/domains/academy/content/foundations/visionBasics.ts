import type { Lesson } from "@/domains/academy/types";

export const visionBasics: Lesson = {
  slug: "vision-basics",
  trackId: "foundations",
  title: "Vision Basics: The Three Phases",
  summary:
    "Wards are not decoration. Each phase of the game has one job for your vision, and most deaths in low elo are a ward that was never placed.",
  minutes: 5,
  access: "free",
  objectives: [
    "Name the one job vision has in each phase of the game",
    "Place a ward for a reason instead of on cooldown",
    "Explain why a ward that has expired is worse than no ward at all",
  ],
  fixes: ["low_vision", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Vision is the cheapest defensive item in the game. It costs a trinket charge and four seconds of walking, and it prevents the single most expensive event in League: dying to something you could not see. If you are dying more than four times a game and cannot say why, this lesson is the one that moves your number.",
    },
    {
      kind: "keyPoint",
      title: "One job per phase",
      text: "Early game (0–14): vision is a jungler alarm. Mid game (14–20): vision is objective setup. Late game (20+): vision is permission to move. Three different jobs, three different places on the map. Placing an early-game ward at minute 30 is the same mistake as placing a late-game ward at minute 3.",
    },
    {
      kind: "table",
      caption: "Where the ward goes and why",
      head: ["Phase", "Where", "The question it answers"],
      rows: [
        ["0–14 min", "The river bush or tri-bush on your jungler-facing side", "Is the enemy jungler coming for me right now?"],
        ["14–20 min", "The enemy approach to the next drake or Baron pit", "Can we start this objective safely?"],
        ["20+ min", "Chokepoints between you and the objective you want", "Is it safe for five people to walk here?"],
      ],
    },
    {
      kind: "prose",
      text: "The early-game ward is the one that changes ranks. It goes down before you push past the middle of the lane, not after — a ward placed while you are already overextended is a ward that tells you about a gank you cannot escape. Place it on the side the enemy jungler started, and refresh it when your trinket comes back and you are about to push again.",
    },
    {
      kind: "mistake",
      title: "Warding on cooldown instead of on intent",
      text: "The trinket comes up, you throw the ward at the nearest bush without looking, and it expires 90 seconds later having shown you nothing. Your vision score goes up. Your deaths do not go down.",
      fix: "Ward before you do something risky, not after the cooldown notification. The trigger is 'I am about to push past the river', not 'my trinket is up'.",
    },
    {
      kind: "prose",
      text: "There is a subtler point about expired wards. A ward you placed two minutes ago and have forgotten about is actively dangerous, because you are playing as if you have vision when you do not. This is why the ward timer on your minimap matters and why control wards — which stay until killed — are worth the 75 gold in exactly the places you cannot afford to be guessing.",
    },
    { kind: "drill", drillId: "vision-decision" },
    {
      kind: "checklist",
      title: "The vision habit that fixes deaths",
      items: [
        "Before pushing past the middle of the lane, ward the river on the jungler's side",
        "Buy a control ward on every recall where you can afford it without dropping an item threshold",
        "When your ward expires, treat the map as dark again — do not keep playing off a memory",
        "If you cannot ward, do not push. Those are the only two options.",
      ],
    },
    { kind: "drill", drillId: "vision-quiz" },
  ],
  drills: [
    {
      id: "vision-decision",
      kind: "decision",
      situation:
        "5:20. You have priority in lane and want to shove the wave to set up your recall. The enemy jungler started on the bottom side and has not been seen for 50 seconds. Your trinket is up.",
      facts: [
        "You have wave priority and want to push",
        "Enemy jungler started bottom side, unseen for 50s",
        "Trinket available",
        "Your jungler is on the top side of the map",
      ],
      options: [
        {
          id: "a",
          label: "Ward the river bush on the bottom side, then push",
          explain:
            "Correct. The ward answers the exact question that matters — is the jungler coming from the side they started on — and it goes down before you commit, not after. This is the single highest-value ward in the early game.",
          correct: true,
        },
        {
          id: "b",
          label: "Push first, ward if you see something",
          explain:
            "By the time you see something you are already deep with a wave pushed against you. The ward is only useful before the risk, which is why 'warding after' is the same as not warding.",
          correct: false,
        },
        {
          id: "c",
          label: "Ward your own tri-bush and push",
          explain:
            "Your tri-bush protects the retreat, not the approach — and the jungler is coming from the river side. Right instinct, wrong 40 metres.",
          correct: false,
        },
        {
          id: "d",
          label: "Do not push at all until your jungler comes bottom",
          explain:
            "Too passive. Giving up wave priority for 50 seconds costs real gold, and the ward makes the push safe enough that you do not need to.",
          correct: false,
        },
      ],
    },
    {
      id: "vision-quiz",
      kind: "quiz",
      prompt: "Why is a forgotten expired ward worse than never having warded at all?",
      options: [
        {
          id: "a",
          label: "Because you keep playing as if the area is safe when it is no longer covered",
          explain:
            "Correct. The danger is not the missing vision, it is the false confidence. A player who knows the map is dark plays carefully; a player who thinks they have a ward walks straight in.",
          correct: true,
        },
        {
          id: "b",
          label: "Because it wasted a trinket charge",
          explain:
            "The charge regenerates and costs nothing. The problem is behavioural, not economic.",
          correct: false,
        },
        {
          id: "c",
          label: "Because it lowers your vision score",
          explain:
            "It does the opposite — the ward still scored while it was alive. Vision score is a proxy, not the goal.",
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
      "Next 3 games: place a river ward on the enemy jungler's side before every push past the middle of the lane. Buy at least one control ward per game. Do not push without one of the two.",
  },
};
