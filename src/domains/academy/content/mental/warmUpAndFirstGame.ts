import type { Lesson } from "@/domains/academy/types";

export const warmUpAndFirstGame: Lesson = {
  slug: "warm-up-and-first-game",
  trackId: "mental",
  title: "The First Game of the Session",
  summary:
    "Your first ranked game of the day is measurably your worst, and everyone treats it like every other game. Ten minutes of warm-up buys back an LP loss you were going to take.",
  minutes: 5,
  access: "pro",
  objectives: [
    "Say what is actually cold at the start of a session",
    "Warm up the two things that matter in under ten minutes",
    "Stop spending your first game learning that you are not warmed up",
  ],
  fixes: ["tilt_prone", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "Pull up your own win rate by game number in a session. For almost every player the first game is the worst one, by a margin that is not noise. Nobody plans for this. The universal ritual is to open the client, queue ranked immediately, and discover somewhere around minute eight that the hands are not there yet.",
    },
    {
      kind: "keyPoint",
      title: "Two things are cold, and only two",
      text: "Last-hitting rhythm, which is timing and lives in your hands. And map attention, which is the habit of looking — the thing this Academy spends a whole track on and which starts every session switched off. Everything else you know is still knowledge; those two are motor patterns and they need five minutes each.",
    },
    {
      kind: "table",
      caption: "A ten-minute warm-up that is worth doing",
      head: ["Minutes", "Do", "Warms"],
      rows: [
        [
          "0–5",
          "Practice tool: last-hit a wave without abilities",
          "The last-hit rhythm, at the exact timing of your champion",
        ],
        [
          "5–8",
          "Practice tool or a normal game: force a minimap look every wave",
          "Map attention, before it costs LP",
        ],
        [
          "8–10",
          "Check the patch notes for your champion and the enemy meta picks",
          "The five seconds of surprise you would otherwise pay in game one",
        ],
      ],
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Warming up in a ranked game",
      text: "The first game is treated as the warm-up, because it feels like the same thing and there is LP on it. You get the rhythm back around fifteen minutes, which is after the lane was decided.",
      fix: "The warm-up has no LP attached to it precisely so that it can be bad. Ten minutes of a practice tool is the cheapest LP you will ever buy back, and it is the one habit on this list that costs nothing but time.",
    },
    {
      kind: "prose",
      text: "There is a second, less obvious reason the first game is bad, and it is that the session has no established rule yet. Whatever happens in game one sets the tone: a bad first game with no warm-up frequently becomes a two-hour session of chasing it back. The warm-up is partly mechanical and partly a way of arriving at game one having already made one decision on purpose.",
    },
    { kind: "drill", drillId: "warmup-quiz" },
    { kind: "drill", drillId: "warmup-decision" },
  ],
  drills: [
    {
      id: "warmup-quiz",
      kind: "quiz",
      prompt: "Why is last-hitting the thing worth warming up rather than, say, combos?",
      options: [
        {
          id: "a",
          label:
            "It is a timing pattern in your hands, and it decides the first ten minutes of every game",
          explain:
            "Correct. Combos are knowledge you still have; last-hit timing is motor memory that decays between sessions, and it is the skill the early game is made of.",
          correct: true,
        },
        {
          id: "b",
          label: "Because CS is the statistic that correlates most with rank",
          explain:
            "It correlates well, but that is a reason to care about CS in general, not a reason this specific thing needs five minutes at the start of a session.",
          correct: false,
        },
        {
          id: "c",
          label: "Because it is the easiest thing to practise in the practice tool",
          explain:
            "Convenience is not the argument. If combos were the thing that went cold, the warm-up would be combos.",
          correct: false,
        },
      ],
    },
    {
      id: "warmup-decision",
      kind: "decision",
      situation:
        "You have ninety minutes to play tonight and you want to climb. You have not played since yesterday afternoon.",
      facts: [
        "90 minutes available",
        "No games played since yesterday",
        "You want to gain LP tonight",
        "Client is open, ranked queue is available",
      ],
      options: [
        {
          id: "a",
          label:
            "Spend ten minutes warming up, then queue — about two and a half games instead of three",
          explain:
            "Correct. You trade a fraction of a game for a first game that is played at your actual level. Three cold games is not more LP than two and a half warm ones — for most players it is considerably less.",
          correct: true,
        },
        {
          id: "b",
          label: "Queue immediately — ninety minutes is only three games as it is",
          explain:
            "This is the arithmetic everyone does, and it counts games rather than LP. The first cold game is the one most likely to be a loss and the most likely to set the tone for the other two.",
          correct: false,
        },
        {
          id: "c",
          label: "Play a normal game first, then queue ranked",
          explain:
            "Better than nothing and expensive: a normal game is twenty-five minutes for a warm-up that takes ten, and it is played at an intensity that warms up neither hands nor attention properly.",
          correct: false,
        },
        {
          id: "d",
          label: "Watch a VOD of your champion while queueing",
          explain:
            "Knowledge is not the part that is cold, and dividing your attention during champion select starts the session by not looking at the game.",
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
      "Next 3 sessions: ten minutes of practice tool before the first ranked game — five last-hitting without abilities, then a wave forcing a minimap look every cycle. No ranked queue before that is done.",
  },
};
