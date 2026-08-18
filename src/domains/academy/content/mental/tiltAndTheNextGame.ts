import type { Lesson } from "@/domains/academy/types";

export const tiltAndTheNextGame: Lesson = {
  slug: "tilt-and-the-next-game",
  trackId: "mental",
  title: "What Tilt Actually Costs",
  summary:
    "Tilt is not a mood, it is a measurable drop in the decisions you make — and it is almost never the game you are angry about that it costs you. It is the next one.",
  minutes: 6,
  access: "free",
  objectives: [
    "Name what tilt changes about your play, specifically",
    "Catch the three signals before the second bad game starts",
    "Have a rule you follow instead of a decision you make while angry",
  ],
  fixes: ["tilt_prone", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Look at your own match history and find a loss you remember being angry about. Now look at the next three games. For most players the pattern is unmistakable: the loss you are angry about is normal, and the two after it are catastrophic. That is the actual cost of tilt, and it is why this is a track and not a paragraph about staying positive.",
    },
    {
      kind: "keyPoint",
      title: "Tilt is a specific set of changes, not a feeling",
      text: "It shortens your time horizon: you take the fight in front of you instead of the objective in a minute. It raises your risk tolerance while lowering your accuracy, which is the worst possible combination. And it removes the minimap from your attention entirely, because anger is narrow. Those three, in that order, every time.",
    },
    {
      kind: "table",
      caption: "The three signals, and what they look like from inside",
      head: ["Signal", "What you notice", "What it means"],
      rows: [
        ["Typing", "Explaining to a stranger why the last fight was their fault", "Attention has left the game"],
        ["Chasing", "Following a kill past a turret you would normally respect", "Time horizon has collapsed to right now"],
        ["Silence on the map", "You have not looked at the minimap in a minute", "The narrow-attention part has already started"],
      ],
    },
    {
      kind: "prose",
      text: "The reason to name these rather than to 'stay calm' is that calm is not a thing you can do on demand and noticing is. You cannot decide to feel differently about somebody who just stole your jungle. You can absolutely notice that you have typed twice in ninety seconds, and treat that as an instrument reading rather than a personality trait.",
    },
    {
      kind: "mistake",
      title: "Deciding whether to keep playing while you are angry",
      text: "The queue button is right there and the last game was 'not your fault', so one more will fix it. This decision is being made by the part of you that is currently the problem.",
      fix: "Decide in advance, when you are not tilted, and then follow the rule without renegotiating it. Two losses in a row: stand up for five minutes. Three in a row: the session is over. A rule you set while calm is the only rule that survives being angry.",
    },
    { kind: "drill", drillId: "tilt-decision" },
    {
      kind: "keyPoint",
      title: "The five-minute break is not a superstition",
      text: "It works because the three changes above are physiological and they decay. Five minutes away from the screen — actually away, not in champion select — is enough for the time-horizon effect to fade. Queueing immediately after a bad loss is the single most reliably losing decision available in League, and it is available every twenty minutes.",
    },
    { kind: "drill", drillId: "tilt-quiz" },
  ],
  drills: [
    {
      id: "tilt-decision",
      kind: "decision",
      situation:
        "You have just lost two in a row. The second one was a 4v5 after a teammate disconnected at fifteen minutes. You are not shouting at anybody, but you have typed in chat twice in the last two minutes of the game and you feel fine.",
      facts: [
        "Two losses in a row",
        "The second was genuinely a 4v5",
        "You typed twice in the last two minutes",
        "You feel fine",
      ],
      options: [
        {
          id: "a",
          label: "Take the five-minute break your rule says you take after two losses",
          explain:
            "Correct. The rule exists precisely for the games that were not your fault, because those are the ones where you feel entitled to skip it. Typing twice is the instrument reading; 'I feel fine' is the part of you the rule was written to overrule.",
          correct: true,
        },
        {
          id: "b",
          label: "Queue again — the loss was not your fault so there is nothing to reset",
          explain:
            "Whose fault it was has no effect on what tilt does to your time horizon. The 4v5 makes the loss understandable and does nothing to make the next game better.",
          correct: false,
        },
        {
          id: "c",
          label: "Play a different mode to warm down before ranked",
          explain:
            "Better than queueing straight back in, and it still keeps you in front of the screen with a game running. The break works because it is a break.",
          correct: false,
        },
        {
          id: "d",
          label: "Review the replay to work out what you could have done",
          explain:
            "A good habit at the wrong moment — reviewing while angry produces blame, not analysis. Review it tomorrow; take the break now.",
          correct: false,
        },
      ],
    },
    {
      id: "tilt-quiz",
      kind: "quiz",
      prompt: "Which of these is the earliest reliable signal that you are tilted?",
      options: [
        {
          id: "a",
          label: "You have typed an explanation of somebody else's mistake into chat",
          explain:
            "Correct, and it is early because it happens before the play changes. Typing is attention leaving the game, and it reliably precedes the chasing and the minimap going dark.",
          correct: true,
        },
        {
          id: "b",
          label: "You have died more than three times",
          explain:
            "Deaths are an outcome, and plenty of them have nothing to do with your state. By the time deaths are the signal, the earlier ones have been ignored for several minutes.",
          correct: false,
        },
        {
          id: "c",
          label: "You feel angry",
          explain:
            "Feeling angry is real and it is not early — most players notice it well after their play has already narrowed. The behaviours are visible before the feeling is admitted.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 1,
    games: 3,
    instruction:
      "Next 3 games: do not type anything in all chat. After any two consecutive losses, stand up and leave the screen for five minutes before queueing again — including when the loss was not your fault.",
  },
};
