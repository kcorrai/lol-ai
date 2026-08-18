import type { Lesson } from "@/domains/academy/types";

export const wardPlacementsByPhase: Lesson = {
  slug: "ward-placements-by-phase",
  trackId: "vision",
  title: "Where the Ward Actually Goes",
  summary:
    "Foundations told you what vision is for in each phase. This is the map: the exact spots, the question each one answers, and why a ward you cannot name a question for is decoration.",
  minutes: 6,
  access: "free",
  objectives: [
    "State the question a ward is answering before you place it",
    "Place the early-game, objective-setup and late-game ward in the right spot without thinking",
    "Choose a spot by what you are about to do, not by what happens to be nearby",
  ],
  fixes: ["low_vision", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Most players below Platinum already know vision matters. They have been told, they believe it, and their vision score is still 18 at thirty minutes. Knowing that vision matters and knowing where to put a ward are different skills, and only the second one shows up on the scoreboard. This track is the second one.",
    },
    {
      kind: "keyPoint",
      title: "Every ward answers exactly one question",
      text: "Before the trinket leaves your hand you should be able to finish this sentence: 'this ward tells me whether ______'. If you cannot, you are not warding, you are decorating. A ward with no question behind it is a ward you will not look at, and a ward you do not look at may as well be in your inventory.",
    },
    {
      kind: "table",
      caption: "The three wards that carry the game",
      head: ["When", "Where", "The question"],
      rows: [
        [
          "3:00–10:00",
          "River bush on the side the enemy jungler started",
          "Is he coming for me in the next fifteen seconds?",
        ],
        [
          "Before an objective",
          "The enemy's walking route into the pit, not the pit",
          "Are they setting up for this, and from which side?",
        ],
        [
          "20:00+",
          "The chokepoint between your team and where it wants to stand",
          "Can five of us walk here without getting caught one at a time?",
        ],
      ],
    },
    {
      kind: "prose",
      text: "Read the middle row again, because it is the one almost nobody gets right. A ward inside the drake pit tells you the drake is still there — which you already knew, because there is a timer on your screen. A ward on their approach tells you five people are walking toward it right now, which is the only thing you could have acted on. Vision is about the walk, not the destination.",
    },
    {
      kind: "mistake",
      title: "Warding the bush you are already standing in",
      text: "You are at your tri-bush, safe, trinket up. You ward the tri-bush. Nothing that happens in that bush can hurt you, because you can see it with your eyes — you are standing there.",
      fix: "Ward the place you are about to walk to, or the place danger comes from. If you can already see it, the ward is worth nothing. The correct feeling is mild discomfort: a good ward is usually one step further forward than you want to walk.",
    },
    {
      kind: "prose",
      text: "The early-game ward has a timing as well as a place. Level 2 and level 3 ganks come between 3:00 and 4:30 on the side the jungler started; the second wave of pressure comes after their first clear, around 5:30 to 6:30. Those are the two windows where the river ward pays. Between them, if you are not pushing past the middle of the lane, the ward can wait — and holding a charge for the moment you actually commit is worth more than spending it on schedule.",
    },
    {
      kind: "checklist",
      title: "The three-second decision",
      items: [
        "Am I about to walk somewhere I could be caught? Ward the approach first",
        "Is an objective coming up in the next minute? Ward their route to it, not the pit",
        "Is the ward I placed still alive? If not, the map is dark again — behave accordingly",
        "If I cannot spare the four seconds to ward, I cannot spare the twenty seconds the death costs",
      ],
    },
    { kind: "drill", drillId: "ward-phase-map" },
    {
      kind: "prose",
      text: "Late game the job changes again, and the change is easy to miss because the ward looks the same. From twenty minutes on, vision is permission. Your team is grouped, and the question is not 'is someone coming for me' but 'can we stand here'. Those wards go on the chokepoints between you and the thing you want, they go down before the team walks, and they are the reason good teams take Baron without a fight while yours dies one at a time trying to see it.",
    },
    { kind: "drill", drillId: "ward-phase-quiz" },
  ],
  drills: [
    {
      id: "ward-phase-map",
      kind: "map",
      prompt:
        "15:00. Drake spawns in forty seconds and your team is coming bottom for it. You are the first one there with a trinket up. Click where the ward goes.",
      options: [
        {
          id: "approach",
          label: "The enemy's route down into the pit",
          explain:
            "Correct. It answers the only question you can act on: are they coming, and from where. Seen early enough, your team either starts the objective or backs off — both of which are decisions you cannot make blind.",
          correct: true,
          at: { x: 0.84, y: 0.62, r: 0.07 },
        },
        {
          id: "in-pit",
          label: "Inside the pit itself",
          explain:
            "It watches a drake you already know is there, on a timer you can already read. By the time this ward shows you anything, the enemy is on top of the objective and the decision has been made for you.",
          correct: false,
          at: { x: 0.72, y: 0.79, r: 0.07 },
        },
        {
          id: "their-blue",
          label: "Their blue buff",
          explain:
            "A fine ward for hunting a jungler in the early game and the wrong half of the map right now. Whatever it sees is a full screen away from the fight that is about to happen.",
          correct: false,
          at: { x: 0.62, y: 0.22, r: 0.07 },
        },
        {
          id: "own-tri",
          label: "Your own bottom tri-bush",
          explain:
            "This protects the retreat you have not started yet. It is the safe ward, and safe is exactly what it buys you: nothing about whether the objective is contestable.",
          correct: false,
          at: { x: 0.3, y: 0.86, r: 0.07 },
        },
      ],
    },
    {
      id: "ward-phase-quiz",
      kind: "quiz",
      prompt:
        "You place a river ward at 6:00 and it expires at 7:30 without ever showing you anything. Was it a wasted ward?",
      options: [
        {
          id: "a",
          label: "No — it let you push those ninety seconds knowing you were not being collapsed on",
          explain:
            "Correct. A ward that shows nothing has still answered its question, and the answer was 'no, he is not here'. That answer is what let you farm forward instead of standing behind your minions guessing.",
          correct: true,
        },
        {
          id: "b",
          label: "Yes — it saw nothing, so it earned nothing",
          explain:
            "This is the accounting that keeps vision scores low. Vision is insurance, and insurance you did not claim on was not wasted money — you were covered for ninety seconds.",
          correct: false,
        },
        {
          id: "c",
          label: "Yes — it should have been saved for the objective at 8:00",
          explain:
            "Trinket charges regenerate; the ninety seconds you spent pushing safely do not come back. Holding a charge is only right when you are not about to take a risk, and pushing past the middle is a risk.",
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
      "Next 3 games: before every objective that spawns while you are alive, place one ward on the enemy's approach to it — not in the pit — with at least 30 seconds to spare. Say the question out loud before each one.",
  },
};
