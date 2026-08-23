import type { Lesson } from "@/domains/academy/types";

export const communicationAndMute: Lesson = {
  slug: "communication-and-mute",
  trackId: "mental",
  title: "Pings, Chat and the Mute Button",
  summary:
    "Four strangers will follow information and ignore opinions. What you type changes the game far less than when you type it — and the mute button is a strategic tool, not an admission of anything.",
  minutes: 5,
  access: "pro",
  objectives: [
    "Send information rather than instructions or blame",
    "Use the four pings that actually change what teammates do",
    "Mute early, for the right reason, without it being about the other person",
  ],
  fixes: ["tilt_prone"],
  blocks: [
    {
      kind: "prose",
      text: "Nobody in a solo queue game is going to be persuaded of anything. That sounds cynical until you look at what actually moves teammates: a danger ping moves people, a written explanation of what somebody did wrong moves nobody, and a plan stated once as fact — 'baron after this wave' — moves people surprisingly often.",
    },
    {
      kind: "keyPoint",
      title: "Information moves people, opinions do not",
      text: "'Jungler top' is information. 'Why did you go top' is an opinion, and it costs you attention to type and them attention to read. The test before you press enter: does this sentence tell somebody something they cannot see? If not, it is not communication, it is commentary.",
    },
    {
      kind: "table",
      caption: "The four pings that work",
      head: ["Ping", "Says", "When"],
      rows: [
        ["Danger", "Do not go there", "Before they walk, not after they died"],
        ["Missing", "Somebody is unaccounted for", "The moment you lose sight of them"],
        ["On my way", "I am committing", "When you are actually walking — it is a promise"],
        ["Objective", "This is the plan", "Sixty seconds out, once, then move"],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "Notice that all four are about the next thirty seconds. Pings about the past are noise, and the objective ping has a timing rather than a meaning — the same ping at minus sixty is a plan and at minus five is panic. The single most common communication error in solo queue is correct information sent too late to act on.",
    },
    {
      kind: "mistake",
      title: "Muting as a punishment",
      text: "Somebody is rude, so you mute them with a message announcing it. The mute is right and the announcement is you staying in the argument, which is the part that was costing you the game.",
      fix: "Mute early and silently, and mute for your own attention rather than their behaviour. The correct trigger is not how offensive they are — it is the moment you notice you are reading chat instead of watching the map.",
    },
    {
      kind: "keyPoint",
      title: "Mute all is a strategy, not a surrender",
      text: "Pings still come through. Everything that changes what you do is still visible, and the thing you removed is the only channel through which a stranger can affect your decision-making. Plenty of high-elo players mute all in champion select, every game, as a default.",
    },
    { kind: "drill", drillId: "comms-quiz" },
    { kind: "drill", drillId: "comms-decision" },
  ],
  drills: [
    {
      id: "comms-quiz",
      kind: "quiz",
      prompt:
        "Your team is about to take Baron and you think it is a mistake. What is the useful thing to send?",
      options: [
        {
          id: "a",
          label: "The fact they are missing: 'their mid and jungle unseen 30s'",
          explain:
            "Correct. That is information nobody else has and it is directly about the decision. It leaves the call with the team while giving them the one thing that changes it.",
          correct: true,
        },
        {
          id: "b",
          label: "'don't baron' in chat",
          explain:
            "An instruction with no reason attached, which in solo queue reads as an opinion. Half the team does not see it and the other half starts anyway.",
          correct: false,
        },
        {
          id: "c",
          label: "Nothing — just follow the team",
          explain:
            "Following is often right and staying silent while holding information is not. The information is the part they cannot get themselves.",
          correct: false,
        },
        {
          id: "d",
          label: "Explain in chat why the last Baron attempt failed",
          explain:
            "About the past, during the present. This is the sentence that costs you the four seconds where you should be warding their approach.",
          correct: false,
        },
      ],
    },
    {
      id: "comms-decision",
      kind: "decision",
      situation:
        "At 9:00 your support has started blaming the jungler in all chat. It is unpleasant but not aimed at you, and you have noticed you have read the last four messages while your wave was pushing.",
      facts: [
        "Support arguing in all chat since 9:00",
        "Not aimed at you",
        "You have read the last four messages",
        "Your wave pushed while you read them",
      ],
      options: [
        {
          id: "a",
          label: "Mute the argument now, silently, and go back to the wave",
          explain:
            "Correct, and for the right reason: the trigger was noticing your own attention had moved, not how bad the messages were. Silent because announcing it is another message to write and read.",
          correct: true,
        },
        {
          id: "b",
          label: "Ask them to stop and focus on the game",
          explain:
            "One more message in an argument, from a fourth participant. It has never worked and it costs you the same attention the argument was costing.",
          correct: false,
        },
        {
          id: "c",
          label: "Ignore it — it is not aimed at you",
          explain:
            "You have already demonstrated that ignoring it is not what is happening: four messages read is four messages of attention spent.",
          correct: false,
        },
        {
          id: "d",
          label: "Mute and report at the end",
          explain:
            "Reporting later is fine, and it is not the decision in front of you. The half that matters right now is the mute.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.3,
    games: 3,
    instruction:
      "Next 3 games: send no message that is about the past or about a teammate. Use danger, missing, on-my-way and objective pings only, and mute any argument the moment you notice yourself reading it.",
  },
};
