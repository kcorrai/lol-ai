import type { Lesson } from "@/domains/academy/types";

export const theRoleWithNoFarm: Lesson = {
  slug: "the-role-with-no-farm",
  trackId: "support",
  title: "The Role With No Farm",
  summary:
    "Every other role converts minions into power. You convert time into other people's power. What that means for what you buy, when you leave, and how you know a game went well.",
  minutes: 5,
  access: "free",
  objectives: [
    "Name what a support's income actually is and how it is spent",
    "Judge your own game by what your team had, not by your own item count",
    "Stop taking minions your carry needed for an item breakpoint",
  ],
  fixes: ["low_vision", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "There is no farm in this role and that is not a handicap, it is the design. Your gold arrives on a slow timer whatever you do, which means the resource you are actually spending is your time — where you stand, who you walk with, and what you are looking at. Every other player has to choose between farming and doing something. You never do, and that is the whole advantage.",
    },
    {
      kind: "keyPoint",
      title: "Your income is fixed, so your decisions are free",
      text: "An ADC who leaves lane loses minions. A jungler who walks somewhere loses camps. You lose nothing. That makes you the cheapest player on the map to move, which is why the support is the one who wards, roams, checks the brush and stands somewhere uncomfortable — not because it is a chore, but because for you it costs nothing and for everybody else it costs an item.",
    },
    {
      kind: "table",
      caption: "Where the gold goes",
      head: ["Purchase", "What it buys", "When it is wrong"],
      rows: [
        ["Control wards", "Vision that fights back — always the first thing", "Never; you should be buying one every single back"],
        ["Your first item", "The thing your kit actually needs to function", "Delaying it to save for a bigger one"],
        ["Boots early", "Roams that arrive in time", "When the lane is losing and you cannot leave anyway"],
        ["Damage components", "Poke pressure", "When your team needed the utility item three minutes ago"],
      ],
    },
    {
      kind: "figure",
      caption: "The role's entire income, and what it turns into",
      assets: [
        {
          ref: { of: "item", item: "world-atlas" },
          label: "Where the gold comes from",
          note: "You do not farm, so this does it for you: gold on a timer, plus charges that execute minions when your carry is not there to. It is the reason taking CS is a mistake rather than a bonus.",
        },
        {
          ref: { of: "item", item: "runic-compass" },
          label: "It upgrades on its own",
          note: "The quest completes by playing the role properly, and the upgrade hands you free wards on a cooldown. Your vision stops competing with your build at exactly the point the map gets dangerous.",
        },
        {
          ref: { of: "item", item: "bounty-of-worlds" },
          label: "And again",
          note: "The final form, and the honest measure of the role: a support who reached it played twenty-five minutes of a game where nothing they did showed up in the CS column.",
        },
        {
          ref: { of: "item", item: "control-ward" },
          label: "Where the gold goes",
          note: "75 gold on every back. This is the conversion the lesson is about — a support's income does not become damage, it becomes the thing that decides whether the next objective is contestable.",
        },
      ],
    },
    { kind: "drill", drillId: "nofarm-quiz" },
    {
      kind: "mistake",
      title: "Taking the minions your carry was counting",
      text: "The wave is crashing and your ADC is not there, so you clear it. It feels like nothing. But your ADC is 120 gold from the item that decides the lane, and the two waves you have taken over the game are exactly that number — the item lands two minutes late and the fight that was supposed to happen on it does not.",
      fix: "Minions belong to the carry unless the alternative is a turret eating them. If the wave is going to die anyway and your ADC is on the other side of the map, take it — otherwise leave it, and go do the thing only you can do for free.",
    },
    {
      kind: "keyPoint",
      title: "Your game is judged by what your team had",
      text: "A support's scoreboard is a bad measure and everybody knows it. The honest one is a set of questions: did your carry get their items on time, did your team have vision at each objective, and did the fights start when you wanted them to. Those three answers are the whole role, and none of them appear next to your name at the end of the game.",
    },
    { kind: "drill", drillId: "nofarm-decision" },
    {
      kind: "checklist",
      title: "Every back",
      items: [
        "Buy a control ward — every time, no exceptions",
        "Then the component your kit actually needs, not the one that costs more",
        "Am I taking minions my carry is counting on",
        "What can I do for free right now that would cost anybody else an item",
      ],
    },
  ],
  drills: [
    {
      id: "nofarm-quiz",
      kind: "quiz",
      prompt: "Why is the support the player who walks into the river to place a ward?",
      options: [
        {
          id: "a",
          label: "Because it costs them nothing, and it costs everybody else minions or camps",
          explain:
            "Correct. The support's income does not depend on standing anywhere in particular, which makes them the cheapest body on the map to move. It is an economic argument, not a matter of whose job it is.",
          correct: true,
        },
        {
          id: "b",
          label: "Because supports buy the most wards",
          explain:
            "They do, but that is a consequence of the same fact rather than the reason. Anybody can carry a control ward; not everybody can afford the walk.",
          correct: false,
        },
        {
          id: "c",
          label: "Because supports are usually tankier and survive being caught",
          explain:
            "Many supports are extremely fragile. The reason holds regardless of how much health the champion has.",
          correct: false,
        },
        {
          id: "d",
          label: "Because vision is officially the support's responsibility",
          explain:
            "It is not — the core curriculum has a whole lesson on why treating vision as one player's job is how teams end up blind at objectives.",
          correct: false,
        },
      ],
    },
    {
      id: "nofarm-decision",
      kind: "decision",
      situation:
        "10:40. Your ADC recalled with 900 gold and is walking back. A wave is arriving in bot lane and will die to your turret in about fifteen seconds if nobody touches it.",
      facts: [
        "Your ADC is walking back from base, roughly 20 seconds away",
        "The wave will hit your turret and start dying in 15 seconds",
        "The enemy bot lane is also resetting",
        "Drake spawns in 90 seconds",
      ],
      options: [
        {
          id: "a",
          label: "Hold the wave off the turret if you can, and ward the drake approach while you wait",
          explain:
            "Correct. Minions dying to your own turret are minions nobody gets, so keeping them alive for the twenty seconds is real value — and warding the pit in the same twenty seconds is the part only you can do without paying for it.",
          correct: true,
        },
        {
          id: "b",
          label: "Clear the wave yourself so it does not die to the turret",
          explain:
            "Better than letting the turret eat it, and it still takes the gold out of the pocket that needed it. Holding the wave keeps the minions alive for the player they belong to.",
          correct: false,
        },
        {
          id: "c",
          label: "Leave for a mid roam since your ADC is not there anyway",
          explain:
            "The roam is not wrong in general, but with a drake in ninety seconds and a wave about to be lost, you would be spending the one window where staying is worth more.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall as well so you both come back together",
          explain:
            "Backing together is a good habit at the wrong moment: you would be giving up the entire wave and the drake vision to save a walk you were not making.",
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
      "Next 3 games: buy a control ward on every single back without exception, and take no minions your ADC could have collected unless they were going to die to a turret.",
  },
};
