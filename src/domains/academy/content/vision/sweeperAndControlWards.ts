import type { Lesson } from "@/domains/academy/types";

export const sweeperAndControlWards: Lesson = {
  slug: "sweeper-and-control-wards",
  trackId: "vision",
  title: "Denial: The Sweeper and the Control Ward",
  summary:
    "Placing wards is half the job. Taking theirs away is the half that wins objectives, and it costs 75 gold and a button most players never press.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Sweep a route you are about to walk instead of a bush you are standing in",
    "Buy a control ward on every back you can afford one, and know the two places it goes",
    "Say why a fight started before the enemy could see it is already half won",
  ],
  fixes: ["low_vision", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "There is a number in your post-game screen almost nobody looks at: wards destroyed. In a thirty-minute game a support who is doing this properly clears eight to fifteen of them. Most players clear one or two, by accident, while walking. That gap is not about mechanics — it is about a button and a 75 gold item that never got bought.",
    },
    {
      kind: "keyPoint",
      title: "Denial is worth more than placement at exactly one moment",
      text: "Before a fight your team intends to start. A ward you place tells you what they are doing; a ward you remove stops them knowing what you are doing. Surprise is the cheapest advantage in League, and it is bought with a sweeper on the route in, thirty seconds before anyone walks it.",
    },
    {
      kind: "table",
      caption: "The three tools and their actual jobs",
      head: ["Tool", "Costs", "The job"],
      rows: [
        [
          "Stealth ward (trinket)",
          "A charge, 4 seconds",
          "Answer a question about a place you are about to be",
        ],
        [
          "Control ward",
          "75 gold, lasts until killed",
          "Hold a piece of the map, and make theirs die there",
        ],
        ["Sweeper (oracle lens)", "A cooldown", "Clear the route before you walk it"],
      ],
    },
    {
      kind: "prose",
      text: "The control ward is the most undervalued purchase in the game and the maths is not close. Seventy-five gold is roughly four minions. It stays alive until somebody walks over and kills it, which in a normal game means several minutes of a bush being permanently yours, plus it disables their wards in the same area. Nothing else you can buy for 75 gold does anything for four minutes.",
    },
    {
      kind: "mistake",
      title: "Buying the control ward and then keeping it",
      text: "It sits in your inventory through three fights and a Baron, because there was never an obviously perfect moment. At the end of the game it is worth exactly nothing, and you paid for it.",
      fix: "A control ward in your inventory is a ward that is not working. Place it on the way back to lane, every time. If it dies in ninety seconds, buy another one — you have already had 75 gold of value out of the ninety seconds where they could not walk into that bush safely.",
    },
    {
      kind: "figure",
      caption: "The two that take vision away, and how they differ",
      assets: [
        {
          ref: { of: "item", item: "control-ward" },
          label: "Control ward",
          note: "Stands still and works forever. It denies one place permanently, which is why it belongs somewhere the enemy has to keep coming back to rather than somewhere you happen to be.",
        },
        {
          ref: { of: "item", item: "oracle-lens" },
          label: "Sweeper",
          note: "Walks with you and works for a few seconds. It denies a route, not a place — which is why it is used on the way to an objective and is worth nothing standing in your own lane.",
        },
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "Where it goes depends on which half of the game you are in, and there are only two answers. In lane, the control ward goes in the river bush on your jungler's side — it holds the entrance to your lane and it is the bush their jungler wants to path through. After twenty minutes, it goes wherever your team intends to stand: the pit-side bush before Baron, the mid-lane brush before a siege. Same item, same 75 gold, different question.",
    },
    {
      kind: "keyPoint",
      title: "The sweeper is used on a route, not on a bush",
      text: "The mistake is standing still and turning it on. Sweeper reveals in a radius around you as you move, so it is used by walking the path your team is about to take, thirty seconds early, with the lens on. Sweeping the bush you are already in reveals the ward that was already watching you place your own.",
    },
    { kind: "drill", drillId: "denial-decision" },
    {
      kind: "prose",
      text: "One more thing about vision score, since it is what people chase. Sweeping a ward gives you score, so a player who denies properly ends the game with a higher number than a player who only places. But the number is a proxy — the reason to do it is that Baron went uncontested because they did not see it start. If you find yourself sweeping to raise a stat, you are back to decorating.",
    },
    {
      kind: "checklist",
      title: "The denial habit",
      items: [
        "Control ward in the shop basket on every back where you are not one component away from a spike",
        "Placed before you re-enter lane, never carried",
        "Sweeper on and walking the route thirty seconds before your team commits to an objective",
        "After a fight you won: sweep their side while it is safe — that is the free window",
      ],
    },
    { kind: "drill", drillId: "denial-quiz" },
  ],
  drills: [
    {
      id: "denial-decision",
      kind: "decision",
      situation:
        "You recall at 9:40 with 1,340 gold. Your next item component is 1,300. Baron is not relevant yet, but drake spawns in ninety seconds and your team has started to gather bottom.",
      facts: [
        "1,340 gold, next component costs 1,300",
        "Drake in 90 seconds, team gathering bottom",
        "You have no control ward in your inventory",
        "Enemy support has been placing deep wards all game",
      ],
      options: [
        {
          id: "a",
          label: "Buy the component, and the control ward with what is left if it fits",
          explain:
            "It does not fit — you have 40 gold left. This is the trap: the component is not a spike by itself, and you have traded the objective's vision for a stat stick that changes nothing for two more minutes.",
          correct: false,
        },
        {
          id: "b",
          label: "Buy the control ward and a smaller component, place the ward on the way to drake",
          explain:
            "Correct. The objective is the thing happening in the next ninety seconds, and 75 gold buys you the bush their setup has to walk through. The component keeps until the next back; the drake does not.",
          correct: true,
        },
        {
          id: "c",
          label: "Buy the component and ask your support to ward",
          explain:
            "Vision is not the support's job, it is the job of whoever is nearby with gold. Waiting for someone else is how a team arrives at an objective blind with four people who each assumed the fifth had it.",
          correct: false,
        },
        {
          id: "d",
          label: "Save the whole 1,340 for a bigger item next back",
          explain:
            "Gold sitting in your pocket does nothing at all, and you are about to fight. Saving is only right when the next back is minutes away and the spike is real.",
          correct: false,
        },
      ],
    },
    {
      id: "denial-quiz",
      kind: "quiz",
      prompt:
        "Your team is about to start Baron. What is the highest-value use of the sweeper in the thirty seconds before it?",
      options: [
        {
          id: "a",
          label: "Walk the enemy's approach to the pit with the lens on",
          explain:
            "Correct. It removes the wards that would tell them the pit is being taken, and it does it on the ground they would use to answer. Starting an objective they cannot see is most of how uncontested Barons happen.",
          correct: true,
        },
        {
          id: "b",
          label: "Stand in the pit and turn it on so nothing is watching you",
          explain:
            "Standing still reveals a circle around a place they can already guess you are. The wards that matter are on the paths, and you have to walk them for the lens to reach.",
          correct: false,
        },
        {
          id: "c",
          label: "Sweep your own jungle so they cannot see your rotation",
          explain:
            "Their vision on your jungle is a real problem, but it is the wrong thirty seconds. Right now the only route that matters is the one between them and the pit.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "visionScore",
    direction: "increase",
    delta: 6,
    games: 3,
    instruction:
      "Next 3 games: buy a control ward on every back where you are not one component from a spike, and place it before you re-enter lane. Before every drake or Baron your team commits to, walk their approach with the sweeper on.",
  },
};
