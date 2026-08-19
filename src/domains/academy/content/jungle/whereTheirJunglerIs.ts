import type { Lesson } from "@/domains/academy/types";

export const whereTheirJunglerIs: Lesson = {
  slug: "where-their-jungler-is",
  trackId: "jungle",
  title: "Where Their Jungler Has to Be",
  summary:
    "You do not need to see the enemy jungler. You need to know which half of the map he is allowed to be on, and that is arithmetic you can do from the first thirty seconds of the game.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Read the enemy's starting side from what their lanes did at 1:30",
    "Keep a rolling estimate of where they are instead of a binary seen or unseen",
    "Use a known jungler position to take something, not just to avoid something",
  ],
  fixes: ["low_vision", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "There is one enemy jungler and he is doing exactly what you are doing: clearing camps in an order that takes a known amount of time. That makes him the most predictable champion on the map. Everything you need to track him is visible without a single ward — which lanes leashed, when they arrived, and where he showed up first.",
    },
    {
      kind: "keyPoint",
      title: "The first clear is a straight line",
      text: "A jungler who starts bottom side finishes bottom side around 3:15 and takes the bottom scuttle. A jungler who starts top does the mirror. Nobody crosses the map mid-clear because it costs a camp. So at 3:15, the enemy jungler is on the side their bot or top lane arrived late from — and you knew that at ninety seconds.",
    },
    {
      kind: "table",
      caption: "What you saw, and what it means",
      head: ["Evidence", "Read", "What you do with it"],
      rows: [
        ["Their bot lane arrived late", "He started bottom side", "Your top-side camps and scuttle are free"],
        ["He appears mid at 3:30", "He is crossing — his own side is empty", "Invade behind him, or gank the lane he left"],
        ["No sign of him at 4:00", "He is farming, not ganking", "Your lanes can push safely; take an objective"],
        ["He ganks your bot at 4:30", "He is bottom side for the next 40s", "Take his top camps or set up your own drake"],
      ],
    },
    {
      kind: "mapFigure",
      caption: "He started on one of these two, and their lanes told you which at 1:30",
      annotations: [
        {
          at: { x: 0.42, y: 0.20, r: 0.055 },
          label: "He started their top side",
          tone: "neutral",
          note: "Their bottom lane arrived late, so he leashed up here. For the next three minutes he is somewhere in the top half of the map, and the bottom half of your jungle is nobody's.",
        },
        {
          at: { x: 0.80, y: 0.58, r: 0.055 },
          label: "He started their bottom side",
          tone: "neutral",
          note: "The mirror, and the more common one. Your top-side camps are unguarded until his first clear finishes — which is a fact you owned at 1:30 and most players do not use until they see him.",
        },
      ],
    },
    { kind: "drill", drillId: "tracking-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Tracking him only to run away",
      text: "You correctly work out that the enemy jungler is bottom side. So you avoid bottom side. You farm your own top camps carefully, keep your distance, and nothing happens for two minutes — you have used real information to have a quieter game.",
      fix: "Knowing where he is means knowing where he is not, and the second half is the valuable one. If he is bottom, his top camps are unguarded, your top lane cannot be punished, and the herald has nobody watching it. Information is only worth what you take with it.",
    },
    {
      kind: "keyPoint",
      title: "Keep the estimate rolling, not binary",
      text: "Most players track the jungler as 'seen' or 'not seen'. The useful version is a moving estimate: last seen at 4:10 bottom, so at 4:40 he is somewhere between his own bottom camps and the mid river, and by 5:10 he could be anywhere. Say the time out loud when you see him and the estimate keeps itself.",
    },
    { kind: "drill", drillId: "tracking-decision" },
    {
      kind: "checklist",
      title: "Reading the enemy jungler without vision",
      items: [
        "At 1:30, which of their lanes was late? That is his starting side",
        "At 3:15, which scuttle did he take? He is on that half",
        "Every time you see him, note the minute — the estimate is only as good as its last timestamp",
        "When you know where he is, name the thing on the other side of the map you are taking",
      ],
    },
  ],
  drills: [
    {
      id: "tracking-quiz",
      kind: "quiz",
      prompt:
        "Their bot lane arrived in lane about eight seconds late and their top lane arrived on time. What do you know?",
      options: [
        {
          id: "a",
          label: "Their jungler started bottom side and will be bottom side at 3:15",
          explain:
            "Correct. A late lane is a leash, and nobody crosses the map mid-clear because it costs a camp. That single observation tells you which scuttle is contested and which half of their jungle is empty for the next three minutes.",
          correct: true,
        },
        {
          id: "b",
          label: "Their bot lane is going to be aggressive early",
          explain:
            "The arrival time says nothing about how they intend to play the lane — it says where their jungler was standing at fifteen seconds.",
          correct: false,
        },
        {
          id: "c",
          label: "They are planning an early invade on your bottom camps",
          explain:
            "A leash is the most ordinary start in the game. Reading it as an invade makes you play scared on the one side you already have information about.",
          correct: false,
        },
        {
          id: "d",
          label: "Nothing reliable — lanes arrive late for lots of reasons",
          explain:
            "They arrive late for one reason often enough that it is the strongest free read of the early game. Treat it as evidence, not proof, and it is right most games.",
          correct: false,
        },
      ],
    },
    {
      id: "tracking-decision",
      kind: "decision",
      situation:
        "5:40. You just watched the enemy jungler gank your bot lane and walk back into his own bottom-side jungle. You are top side with a full clear available and herald spawns at 8:00.",
      facts: [
        "Enemy jungler committed to bottom side 15 seconds ago",
        "His top-side camps are unguarded",
        "Your top lane is pushing toward the enemy turret",
        "You are even in level, smite up",
      ],
      options: [
        {
          id: "a",
          label: "Take his top-side camps and set vision for herald while he is bottom",
          explain:
            "Correct. This is the whole point of tracking him: not the forty seconds you avoid him, but the forty seconds you spend somewhere he cannot answer. You come out of it up two camps with the herald side already yours.",
          correct: true,
        },
        {
          id: "b",
          label: "Rotate bottom to punish him for the gank",
          explain:
            "You would arrive after it is over, on his half of the map, into a bot lane that just lost the fight. Revenge rotations are how a jungler ends up behind in both halves.",
          correct: false,
        },
        {
          id: "c",
          label: "Clear your own top camps and stay safe",
          explain:
            "Not wrong, just small. Your camps will still be there in a minute; his will not, and the window where he cannot contest them is closing.",
          correct: false,
        },
        {
          id: "d",
          label: "Gank your top lane while their jungler is far away",
          explain:
            "Reasonable if the wave were right, but your top lane is pushing toward their turret — the one state a gank cannot work in. Take the camps and gank on the next wave.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.4,
    games: 3,
    instruction:
      "Next 3 games: every time you see the enemy jungler, say the minute out loud. Within the next thirty seconds, take something on the opposite half of the map — a camp, a ward, or an objective.",
  },
};
