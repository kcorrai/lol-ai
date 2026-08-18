import type { Lesson } from "@/domains/academy/types";

export const sessionDiscipline: Lesson = {
  slug: "session-discipline",
  trackId: "mental",
  title: "How Long to Play, and When to Stop",
  summary:
    "Climbing is decided by how many games you play in a state worth playing in. Session length is the lever almost nobody pulls, and it is the one that costs nothing.",
  minutes: 5,
  access: "pro",
  objectives: [
    "Set a session rule you can follow while losing",
    "Notice the specific point where your games stop being worth playing",
    "Stop measuring a session in LP",
  ],
  fixes: ["tilt_prone"],
  blocks: [
    {
      kind: "prose",
      text: "Everyone knows the eight-hour session that ends fifty LP below where it started. The interesting part is not that it happened — it is that at every single point during it, playing one more game felt correct. That is the thing to plan around, because the judgement that decides when to stop is made by a player who has been degrading for three hours.",
    },
    {
      kind: "keyPoint",
      title: "Rules beat judgement, because judgement is the thing that degrades",
      text: "Set the rule before you start: how many games, and what ends the session early. Then follow it without renegotiating, exactly the way you would follow a rule about not walking into an unwarded bush. Renegotiating a rule at the moment it binds is the same as not having one.",
    },
    {
      kind: "table",
      caption: "A session rule that survives contact",
      head: ["Rule", "Value", "Why this one"],
      rows: [
        ["Games per session", "Three to five", "Beyond five, most players' win rate drops measurably"],
        ["Stop on", "Three losses, or two in a row after a break", "The streak is the signal, not the total"],
        ["Break every", "Two games, five minutes", "Long enough for the tilt effects to decay"],
        ["End the day on", "A game you played well — win or lose", "Ending on a bad one is what makes tomorrow's first game worse"],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The last row is the one that sounds soft and is not. The first game of a session is already your worst, and starting it while still holding the shape of last night's disaster makes it worse again. Ending on a game you played well — even a loss you played well — is how you arrive tomorrow with the useful memory rather than the loud one.",
    },
    {
      kind: "mistake",
      title: "Chasing the LP back",
      text: "You are down forty LP so you keep playing until you get it back. The forty LP is a number in a table; the games you are playing to retrieve it are being played by somebody four hours in, and they will be worse than the ones that lost it.",
      fix: "Measure the session in games played well, not in LP gained. LP is an outcome you do not control on the day; the number of decisions you made properly is one you do. Sessions judged on LP always end at the wrong time — either too late, or on a win that should have been the middle of a session.",
    },
    { kind: "drill", drillId: "session-decision" },
    { kind: "drill", drillId: "session-quiz" },
  ],
  drills: [
    {
      id: "session-decision",
      kind: "decision",
      situation:
        "You set out to play four games. You are three in: a win and two losses, and you are twenty LP down. You have time for two more and you feel fine — the last loss was close and you played it well.",
      facts: [
        "Planned 4 games, played 3",
        "1 win, 2 losses, 20 LP down",
        "Last loss was close and well played",
        "Time available for 2 more",
      ],
      options: [
        {
          id: "a",
          label: "Play the fourth, then stop as planned regardless of the result",
          explain:
            "Correct. The rule was four and nothing has happened that triggers an early stop — two losses but not in a row, and the last one was played well. Stopping at four whatever happens is the part that makes the rule worth having next week.",
          correct: true,
        },
        {
          id: "b",
          label: "Play both remaining games — you have time and you feel fine",
          explain:
            "'I feel fine' at game five is the judgement the rule exists to overrule. The rule was four when you were calm and had no LP on the line.",
          correct: false,
        },
        {
          id: "c",
          label: "Stop now while you can still end on a game you played well",
          explain:
            "Tempting and it is renegotiating in the other direction. A rule you shorten when you are down is a rule that will get lengthened when you are up.",
          correct: false,
        },
        {
          id: "d",
          label: "Play until you are back to even LP",
          explain:
            "The chase. This is exactly the sentence that produces the eight-hour session, and it makes the stopping point depend on an outcome you do not control.",
          correct: false,
        },
      ],
    },
    {
      id: "session-quiz",
      kind: "quiz",
      prompt: "Why measure a session in games played well rather than in LP?",
      options: [
        {
          id: "a",
          label: "LP is an outcome you do not control on the day, so a session judged on it never ends on purpose",
          explain:
            "Correct. Judged on LP, a session ends when a number is reached — which means it ends late on a bad day and early on a good one. Judged on decisions, it ends when you planned, which is the only version that is repeatable.",
          correct: true,
        },
        {
          id: "b",
          label: "LP is not a good measure of skill",
          explain:
            "Over hundreds of games it is a decent one. The problem is using it to decide when to stop today, not what it measures over a season.",
          correct: false,
        },
        {
          id: "c",
          label: "It keeps you positive about losses",
          explain:
            "The point is not comfort. It is that the stopping decision has to be based on something you control, or the session length gets decided by variance.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "kda",
    direction: "increase",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 sessions: decide the number of games before you queue the first one, take five minutes away from the screen every two games, and stop on three losses or two in a row — regardless of LP.",
  },
};
