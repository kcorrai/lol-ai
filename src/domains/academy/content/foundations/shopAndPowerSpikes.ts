import type { Lesson } from "@/domains/academy/types";

export const shopAndPowerSpikes: Lesson = {
  slug: "shop-and-power-spikes",
  trackId: "foundations",
  title: "The Shop & Power Spikes",
  summary:
    "Gold does nothing until it is spent, and it is worth far more at some totals than others. Learn the thresholds that decide when you are stronger than the enemy.",
  minutes: 5,
  access: "free",
  objectives: [
    "Explain what a power spike is and why gold value is not linear",
    "Identify your own first and second spike before the game starts",
    "Choose between a component now and a full item later",
  ],
  fixes: ["low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Gold sitting in your pocket is worth nothing. Gold is only power at the moment it becomes an item, and items do not deliver their value smoothly. 900 gold and 1,300 gold feel almost identical; 1,300 gold and 1,400 gold can be the difference between losing a fight and winning it, because 1,400 completes something.",
    },
    {
      kind: "keyPoint",
      title: "A power spike is a threshold, not a slope",
      text: "A spike is any moment where your effective strength jumps: a completed item, a level with a new or upgraded ability, a summoner spell coming back up, or the enemy's key cooldown going down. Winning lane is largely the art of fighting on your spikes and refusing to fight on theirs.",
    },
    {
      kind: "table",
      caption: "The three kinds of spike, and how to use them",
      head: ["Spike", "When", "What it lets you do"],
      rows: [
        ["Level", "2, 3, 6, 11, 16", "Level 2 first is the single biggest early advantage in lane"],
        [
          "Item",
          "First component, first completed item, first legendary",
          "A completed item usually beats one extra level",
        ],
        [
          "Cooldown",
          "Their flash, their ultimate, their jungler's position",
          "The enemy without flash is a different champion",
        ],
      ],
    },
    {
      kind: "prose",
      text: "Level 2 deserves special attention. In the first minute of the game, the player who hits level 2 first has two abilities against one. That is not a small edge — it is often the largest raw power difference either player will hold all lane. The first wave has six minions in most lanes; the melee minions plus one caster gets you there. Which is to say: level 2 is not luck, it is a CS timing.",
    },
    {
      kind: "mistake",
      title: "Saving gold for the 'good' item",
      text: "You have 900g and your item costs 1,300. You hold the gold, walk back to lane, and die to a champion who bought two components with the same money.",
      fix: "Buy the strongest thing you can afford right now unless you are within roughly one wave of the completion. Gold on your person does not fight.",
    },
    {
      kind: "figure",
      caption: "Three purchases, three different kinds of moment",
      assets: [
        {
          ref: { of: "item", item: "dorans-blade" },
          label: "The 450g start",
          note: "Bought before a minion has died, and already a spike: damage, health and sustain at a point in the game where nobody has any of the three. This is why the shop matters at 0:00, not at 8:00.",
        },
        {
          ref: { of: "item", item: "sheen" },
          label: "A component that is a spike on its own",
          note: "Not everything you buy on the way to an item is a step toward one. This changes how a trade goes the moment it is in your inventory, which is why buying it early beats holding gold for the thing it builds into.",
        },
        {
          ref: { of: "item", item: "kraken-slayer" },
          label: "The completion you were saving for",
          note: "The threshold the whole lesson is about. Worth waiting for only if you are within about one wave of it — and worth nothing at all if you died at 900 gold holding out for it.",
        },
      ],
    },
    { kind: "drill", drillId: "spike-quiz" },
    {
      kind: "prose",
      text: "The mirror image of using your own spike is respecting theirs. If you know the enemy just recalled with 1,400 gold, the next 90 seconds of lane are not the same lane you were playing before. The single most common way a winning laner loses their lead is walking into an even trade against someone who just completed an item.",
    },
    {
      kind: "checklist",
      title: "Before the game starts",
      items: [
        "Know your first completed item and its gold cost",
        "Know your opponent's first completed item and its cost",
        "Decide which of you spikes harder at level 6, and plan the two minutes around it",
      ],
    },
    { kind: "drill", drillId: "spike-order" },
  ],
  drills: [
    {
      id: "spike-quiz",
      kind: "quiz",
      prompt:
        "You have 1,150 gold. Your first item costs 1,300 and its 900g component is available. The wave will crash in about 20 seconds. What do you do?",
      options: [
        {
          id: "a",
          label: "Wait for the crash, then recall — you will have ~1,300",
          explain:
            "Correct, and this is the exception to 'buy what you can afford'. You are one wave away from the completed item, and recalling on a crashed wave costs you nothing in lost minions. Waiting 20 seconds buys a whole item instead of a component.",
          correct: true,
        },
        {
          id: "b",
          label: "Recall now and buy the 900g component",
          explain:
            "This is the right instinct most of the time, but not here — you are 150g away, the crash is 20 seconds out, and recalling before the crash hands the enemy free minions under your turret.",
          correct: false,
        },
        {
          id: "c",
          label: "Stay in lane and keep farming until you have 2,000",
          explain:
            "Gold you are carrying is gold that is not fighting. Holding 2,000g in lane means you spent several minutes weaker than you needed to be, against an opponent who is spending theirs.",
          correct: false,
        },
      ],
    },
    {
      id: "spike-order",
      kind: "order",
      prompt:
        "Put these four moments in the order you would most want to take a fight in a standard lane, strongest window first.",
      items: [
        { id: "a", label: "You just completed your first item; they recalled 10s ago" },
        { id: "b", label: "You hit level 2 first off the first wave" },
        { id: "c", label: "Even levels, even items, both of you have flash" },
        { id: "d", label: "They just completed their first item and you are 600g behind" },
      ],
      correctOrder: ["a", "b", "c", "d"],
      explain:
        "A completed item against an opponent who has just spent their gold is the largest gap you will get. Level 2 first is the biggest raw early edge but it is one ability, not an item. An even lane is a coin flip. And fighting into a fresh enemy item while behind on gold is how leads get handed back.",
    },
  ],
  assignment: {
    metric: "kda",
    direction: "increase",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: before you leave base, say your first item and your opponent's first item out loud. When either of you completes one, note it — and do not take an even fight into their fresh item.",
  },
};
