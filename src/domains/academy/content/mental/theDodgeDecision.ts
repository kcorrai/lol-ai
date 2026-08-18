import type { Lesson } from "@/domains/academy/types";

export const theDodgeDecision: Lesson = {
  slug: "the-dodge-decision",
  trackId: "mental",
  title: "The Dodge Decision",
  summary:
    "Dodging costs LP and time, and it is still correct more often than most players think — but for one reason only, and not the reason people usually give.",
  minutes: 5,
  access: "pro",
  objectives: [
    "Price a dodge against the game you would otherwise play",
    "Separate the one good reason to dodge from the four bad ones",
    "Stop dodging as a way of avoiding a feeling",
  ],
  fixes: ["tilt_prone"],
  blocks: [
    {
      kind: "prose",
      text: "A dodge costs a few LP and several minutes. A loss costs more LP and thirty minutes, plus whatever it does to the game after it. So the arithmetic is not automatically against dodging — it is against dodging for the wrong reasons, which is what almost every dodge is.",
    },
    {
      kind: "keyPoint",
      title: "There is one good reason: the game is already over in champion select",
      text: "Not 'someone is toxic'. Not 'I do not like this matchup'. The reason is a composition or a state of the lobby that means the game will be decided by something you cannot influence — a four-way argument that has already started, a player who has announced they are going to feed, or a composition with no front line and no engage against one that has both.",
    },
    {
      kind: "table",
      caption: "Reasons people dodge, priced honestly",
      head: ["Reason", "Verdict", "Why"],
      rows: [
        ["A teammate is already arguing in champion select", "Dodge", "The game is decided; you are buying back twenty-five minutes"],
        ["Bad matchup for your champion", "Do not", "A hard lane is a lane. You have a whole track about surviving them"],
        ["No support / no tank pick", "Usually not", "Compositions are more flexible than the loading screen suggests"],
        ["You are on a losing streak and nervous", "Do not — take the break instead", "This is a tilt decision wearing a strategy costume"],
      ],
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Dodging to avoid feeling bad",
      text: "Champion select looks fine and you dodge anyway, because something about the game feels heavy. Ten minutes later you queue again into a lobby that is exactly as ordinary as the last one, having paid LP for the privilege.",
      fix: "If you cannot name the specific thing that decides the game, the feeling is about you and not about the lobby — and the answer to that is a break, not a dodge. A dodge relieves the feeling and keeps you in the chair, which is the worst combination available.",
    },
    {
      kind: "prose",
      text: "There is one more piece of arithmetic worth knowing. The LP cost of a dodge rises steeply the second time in a session, and the time cost is fixed. So the honest version of the rule is: you get one dodge per session, for a lobby that is genuinely decided, and if you find yourself wanting a second one the session is what needs to end, not the lobby.",
    },
    { kind: "drill", drillId: "dodge-decision" },
    { kind: "drill", drillId: "dodge-quiz" },
  ],
  drills: [
    {
      id: "dodge-decision",
      kind: "decision",
      situation:
        "Champion select, ranked. Your top laner has locked in a champion nobody expected, and your jungler has typed 'if he goes that I'm afk' followed by two more messages. Everyone else has picked normally and the composition is fine.",
      facts: [
        "Composition is fine",
        "Jungler has threatened to go afk, three messages so far",
        "Top laner has locked in and is not responding",
        "You have not dodged this session",
      ],
      options: [
        {
          id: "a",
          label: "Dodge — the game is decided by something you cannot influence",
          explain:
            "Correct, and this is the shape of the only good reason. It is not that the jungler might be bad; it is that a player who has announced this in champion select has already changed the game more than any of your decisions will.",
          correct: true,
        },
        {
          id: "b",
          label: "Play it — threats in champion select usually come to nothing",
          explain:
            "Sometimes true, and the expected value is still terrible. You are choosing thirty minutes at a large disadvantage over three minutes and a few LP.",
          correct: false,
        },
        {
          id: "c",
          label: "Try to calm the jungler down and then play",
          explain:
            "Worth thirty seconds, and it does not change the calculation if it fails — which by the third message it usually has.",
          correct: false,
        },
        {
          id: "d",
          label: "Play it but plan to avoid the jungler's side of the map",
          explain:
            "Planning around a teammate you expect to grief is not a plan, it is playing four-versus-five on purpose.",
          correct: false,
        },
      ],
    },
    {
      id: "dodge-quiz",
      kind: "quiz",
      prompt: "You want to dodge for the second time in an hour. What does the rule say?",
      options: [
        {
          id: "a",
          label: "End the session — a second dodge means the problem is you, not the lobbies",
          explain:
            "Correct. Two decided lobbies in an hour is unlikely; two dodges is a reliable sign that the thing you are avoiding is a feeling. The break is the move, and it is cheaper than either the dodge or the loss.",
          correct: true,
        },
        {
          id: "b",
          label: "Dodge — the LP cost is worth avoiding a bad game",
          explain:
            "The second dodge costs far more LP and does nothing about the state that produced it. You are paying an escalating price to stay in the chair.",
          correct: false,
        },
        {
          id: "c",
          label: "Play it out and dodge the next one if it is worse",
          explain:
            "Splits the difference in the least useful way: you play a game you have already decided you do not want to play, in the state that made you want to dodge.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "kda",
    direction: "increase",
    delta: 0.4,
    games: 3,
    instruction:
      "Next 3 games: dodge only for a lobby you can name the deciding factor in, and never more than once per session. If you want a second dodge, stop playing for the day instead.",
  },
};
