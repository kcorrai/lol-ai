import type { Lesson } from "@/domains/academy/types";

export const youChooseTheFight: Lesson = {
  slug: "you-choose-the-fight",
  trackId: "support",
  title: "You Choose When the Fight Exists",
  summary:
    "On most teams the support is holding the button that starts everything. That makes the decision yours — including the decision not to, which is the harder half.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Treat your engage as a decision about the whole team, not about your own cooldown",
    "Check that your team can follow before you commit anything",
    "Hold the engage as a threat when starting the fight is the losing move",
  ],
  fixes: ["late_game_throw", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "Most teamfights in most games begin because a support pressed something. Not the jungler, not the toplaner — the player holding the hook, the charge, or the point-and-click stun. Which means the question 'should this fight happen' is being answered, several times a game, by the person with the least gold on the map. Answering it well is worth more than any amount of mechanical accuracy on the ability itself.",
    },
    {
      kind: "keyPoint",
      title: "An engage that nobody follows is a death, not an engage",
      text: "Landing the ability is the easy half. The fight only exists if two or three of your teammates are close enough and awake enough to convert it, and that is something you can check in the second before you press. If your carry is walking back from base, if two of them are recalling, if your team is spread across three screens — the perfect hook is a solo death that starts a fight 4v5.",
    },
    {
      kind: "table",
      caption: "Before you press it",
      head: ["Check", "Good", "Do not press"],
      rows: [
        ["Who is with me", "Two or more, in range, moving", "One, or nobody looking"],
        ["Their cooldowns", "Their key ability is down", "They have everything up"],
        ["What we get", "An objective, or their carry", "A kill on their tank"],
        ["Where we are", "Near our own vision", "Deep in their jungle with no exit"],
      ],
    },
    { kind: "drill", drillId: "engage-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Pressing because it came off cooldown",
      text: "Your engage is back up and there is somebody standing there, so you press it. It lands. Nobody follows, because your team was in the middle of resetting and only you were ready — and the enemy team collapses on the only player who walked forward. The fight you started was a fight your team was not in.",
      fix: "A cooldown coming up is not a reason to use it. Before you press, count the teammates who can act on it right now — not the ones who are technically nearby. If the answer is fewer than two, the correct play is to hold it, because an unspent engage is a threat that keeps their whole team standing further back than they want to.",
    },
    {
      kind: "keyPoint",
      title: "Not starting the fight is a decision you are also making",
      text: "Standing still with your engage available is not passivity — it is the reason their carry will not step forward. Late in a close game, the team that refuses to press first usually wins, because whoever starts it does so into five champions who are all looking. Holding the threat is your second-most powerful play, and it looks like nothing at all.",
    },
    { kind: "drill", drillId: "engage-decision" },
    {
      kind: "checklist",
      title: "The second before you engage",
      items: [
        "How many of my team can act on this right now — two is the minimum",
        "What are we getting: an objective, a carry, or a tank",
        "Is their key defensive ability down",
        "If nobody follows, is this survivable — and if not, hold it",
      ],
    },
  ],
  drills: [
    {
      id: "engage-quiz",
      kind: "quiz",
      prompt:
        "You land a perfect engage on their ADC and nobody on your team follows. What happened?",
      options: [
        {
          id: "a",
          label:
            "You started a fight your team was not in — the engage was a decision, and it was the wrong one",
          explain:
            "Correct. An engage is a call for the whole team, so its quality is measured by what the team does next. Landing it changes nothing on its own; the follow-up is the fight.",
          correct: true,
        },
        {
          id: "b",
          label: "Your team misplayed — they should have followed",
          explain:
            "Sometimes true and never useful. You are the one with the information about who was ready, because you are the one choosing the moment.",
          correct: false,
        },
        {
          id: "c",
          label: "Nothing much — you traded your life for their positioning",
          explain:
            "Your death gives them a body advantage and the tempo to take an objective. There is no version of this trade where a support dying alone is neutral.",
          correct: false,
        },
        {
          id: "d",
          label: "It was still correct because the ability was up",
          explain:
            "Availability is not a reason. An unspent engage forces their team to stand back all fight; a spent one that nobody followed gives them thirty free seconds.",
          correct: false,
        },
      ],
    },
    {
      id: "engage-decision",
      kind: "decision",
      situation:
        "34:00. Both teams are standing at mid, nobody committing. Baron is up. Your ADC is three items ahead and your engage is available. Their front line is standing between you and their carry.",
      facts: [
        "Baron up, neither team has started it",
        "Your ADC is far ahead and out-damages everybody",
        "Their tank is the only thing you can reach",
        "All five of your team are together and healthy",
      ],
      options: [
        {
          id: "a",
          label: "Hold the engage and let your ADC hit whatever comes into range",
          explain:
            "Correct. You out-scale them and the standoff is already winning: an unspent engage is the reason their carry cannot step forward. The only way you lose this is by pressing something and turning a won position into a coinflip.",
          correct: true,
        },
        {
          id: "b",
          label: "Engage onto their tank to start the fight while your team is grouped",
          explain:
            "Your team being ready is one of the checks and the target fails another. Starting a fight by committing your engage to the champion built to absorb it hands their carry a free window on yours.",
          correct: false,
        },
        {
          id: "c",
          label: "Walk around to reach their carry and engage from behind",
          explain:
            "Walking around a front line at thirty-four minutes means arriving alone on their side of the fight. Even if the engage lands, your team is a full second behind you and you are inside five champions.",
          correct: false,
        },
        {
          id: "d",
          label: "Start Baron to force them to press first",
          explain:
            "Closer to right — forcing them to act is the correct idea. But starting Baron in front of five healthy champions gives them the engage instead, which is the one thing you were holding.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.8,
    games: 3,
    instruction:
      "Next 3 games: before every engage after 15 minutes, count how many teammates can act on it. If the answer is fewer than two, hold it — and never spend it on their front line.",
  },
};
