import type { Lesson } from "@/domains/academy/types";

export const wardingAsATeam: Lesson = {
  slug: "warding-as-a-team",
  trackId: "vision",
  title: "Vision Is Not the Support's Job",
  summary:
    "There are five trinkets on your team and one map. The reason your games are dark is not that your support is bad — it is that four people are carrying an unused ward around.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Own the piece of the map your role is actually standing on",
    "Ward the objective you are not at, before you are needed there",
    "Stop reading vision score as a support statistic",
  ],
  fixes: ["low_vision", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Pull up any of your recent losses and look at the vision score column. There will be one number above twenty and four below ten. Now look at where the deaths happened: they will be spread across the whole map, in places the support was never standing. That is the entire argument. One person cannot light a map that five people are standing on.",
    },
    {
      kind: "keyPoint",
      title: "You own the ground you are standing on",
      text: "The rule is not 'everybody wards more'. It is that the vision covering a piece of the map belongs to whoever is nearest to it. Your support cannot ward your top-side river from bottom lane; you can, in four seconds, from where you already are. Every role has a piece, and the piece changes as the game moves.",
    },
    {
      kind: "mapFigure",
      caption: "Five people, five pieces, and one support who can reach one of them",
      annotations: [
        {
          at: { x: 0.24, y: 0.42, r: 0.055 },
          label: "Top's piece",
          tone: "good",
          note: "Your own top-side river. Four seconds from where the top laner is already standing, and a full minute of walking for anybody else.",
        },
        {
          at: { x: 0.48, y: 0.52, r: 0.055 },
          label: "Mid's piece",
          tone: "good",
          note: "Both river entrances. Mid is the only role on the map that reaches both without leaving the lane, which is why mid has no excuse and usually the worst vision score.",
        },
        {
          at: { x: 0.62, y: 0.84, r: 0.055 },
          label: "The jungler's piece",
          tone: "good",
          note: "Whatever he is about to take, before he takes it. A jungler warding the pit he is standing in is warding a thing he can already see.",
        },
        {
          at: { x: 0.32, y: 0.86, r: 0.055 },
          label: "The carry's piece",
          tone: "good",
          note: "The ground behind him, which is the ground he retreats through. Nobody else is ever standing there at the moment it matters.",
        },
        {
          at: { x: 0.85, y: 0.68, r: 0.055 },
          label: "The support's piece",
          tone: "good",
          note: "Their walk into your lane. This is the one piece a support can genuinely own — and it is the piece most teams expect one person to cover all five of.",
        },
      ],
    },
    {
      kind: "table",
      caption: "Whose piece is whose",
      head: ["Role", "Early", "After 20 minutes"],
      rows: [
        ["Top", "Your own side river and the tri-bush behind you", "The flank the enemy would use to catch someone"],
        ["Jungle", "Both entrances to whichever camp you are on", "The pit you are about to take, before you take it"],
        ["Mid", "Both river bushes — you are the only one who reaches both", "The chokepoints either side of mid"],
        ["ADC", "The tri-bush behind you and the lane brush", "Wherever you intend to stand in the next fight"],
        ["Support", "The enemy's approach to your lane, and control wards", "The objective route, and everything you can sweep"],
      ],
    },
    {
      kind: "mistake",
      title: "The ward that stays in the trinket all game",
      text: "You are a mid laner with three charges banked at fourteen minutes. The trinket has been off cooldown almost continuously since the game started. Nothing was ever bad enough to spend it on, so nothing was.",
      fix: "A trinket charge is not a resource you spend, it is a resource that expires. It regenerates whether you use it or not, so a charge sitting at full is pure waste — the correct number of banked charges while you are alive and on the map is zero to one, never three.",
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The highest-value ward a non-support places is on the objective they are not at. You are top, the drake is up in a minute, and the fight will happen bottom without you. The ward you place in their top-side jungle right now tells your team whether the enemy top laner has left — which is the single fact that decides whether your four can contest. That ward costs you nothing and it is worth more than anything your support can place from inside the pit.",
    },
    {
      kind: "keyPoint",
      title: "Ward before you are needed, not when you arrive",
      text: "Vision placed while walking to a fight is late by definition — the information arrives at the same time you do, when the decision has already been made. The useful window is thirty to sixty seconds earlier, when your team is still deciding whether the fight is worth taking.",
    },
    { kind: "drill", drillId: "team-vision-quiz" },
    {
      kind: "checklist",
      title: "The non-support vision habit",
      items: [
        "Never be holding more than one trinket charge while alive",
        "Ward the side of the map you are standing on, not the side that scares you",
        "One minute before an objective you will not attend, ward the route the enemy would take to it",
        "After you recall, place on the way back in — the walk is free time",
      ],
    },
    { kind: "drill", drillId: "team-vision-decision" },
  ],
  drills: [
    {
      id: "team-vision-quiz",
      kind: "quiz",
      prompt:
        "You are the top laner at 18:00. Baron is not up, drake spawns in fifty seconds bottom, and you are pushing a wave into their top turret. Your team is gathering bottom without you. Where does your trinket go?",
      options: [
        {
          id: "a",
          label: "Their top-side jungle, to see whether their top laner has rotated",
          explain:
            "Correct. Whether their fifth player is heading to the fight is the fact your team's decision hinges on, and you are the only one who can find it out. It costs you four seconds of a push you are winning anyway.",
          correct: true,
        },
        {
          id: "b",
          label: "In the drake pit, so your team can see the objective",
          explain:
            "Your team is standing there. They can see it with their eyes, and your ward has spent a charge telling five people something all five already know.",
          correct: false,
        },
        {
          id: "c",
          label: "Your own top river, so you do not get collapsed on while pushing",
          explain:
            "Defensible, and much better than not warding. But everyone on their team who could collapse on you is walking bottom right now — the ward is guarding you against the one threat the map has just removed.",
          correct: false,
        },
        {
          id: "d",
          label: "Hold it — you might need it when you rotate down",
          explain:
            "By the time you rotate, the fight has started and the ward is information for a decision already taken. Charges regenerate; the fifty seconds do not.",
          correct: false,
        },
      ],
    },
    {
      id: "team-vision-decision",
      kind: "decision",
      situation:
        "You are the ADC at 24:00. Your team wants Baron in about a minute. Your support is dead for twenty seconds, and you have both a trinket charge and 800 spare gold in the shop.",
      facts: [
        "Baron attempt in ~60 seconds",
        "Support dead for 20 seconds",
        "One trinket charge, 800 spare gold",
        "Enemy last seen grouped around their mid turret",
      ],
      options: [
        {
          id: "a",
          label: "Buy a control ward, place it in the Baron-side bush on your way there",
          explain:
            "Correct. The support who normally does this is dead, the piece of map is unowned, and 800 gold has 75 to spare. A control ward there both watches the route and kills whatever they placed for the same fight.",
          correct: true,
        },
        {
          id: "b",
          label: "Wait for the support to respawn and let them handle vision",
          explain:
            "Twenty seconds of respawn plus the walk is most of the setup window. The reason teams start Baron blind is everyone waiting for the person whose job it supposedly is.",
          correct: false,
        },
        {
          id: "c",
          label: "Save the gold for your next item and use the trinket in the pit",
          explain:
            "Half right — using the trinket is better than banking it — but the pit is the one place your team will already be looking. And 75 gold is not the reason your item is late.",
          correct: false,
        },
        {
          id: "d",
          label: "Push the bottom wave instead and let the team set up without you",
          explain:
            "Reasonable in a vacuum, but you are the reason the Baron is winnable at all — an ADC who arrives to a fight already in progress is the ADC who dies in it.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "visionScore",
    direction: "increase",
    delta: 5,
    games: 3,
    instruction:
      "Next 3 games, whatever your role: never hold more than one trinket charge while you are alive on the map, and place one ward on the route into every objective you are not going to attend.",
  },
};
