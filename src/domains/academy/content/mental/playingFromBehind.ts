import type { Lesson } from "@/domains/academy/types";

export const playingFromBehind: Lesson = {
  slug: "playing-from-behind",
  trackId: "mental",
  title: "Playing From Behind Without Making It Worse",
  summary:
    "Being behind is a state with correct play, not a punishment. Almost everything that turns a losing game into an unwinnable one is a player trying to fix it in one move.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Name what changes about your job when you are behind",
    "Take the small, boring gold instead of the comeback play",
    "Recognise the two moments a losing game actually turns",
  ],
  fixes: ["tilt_prone", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "You are 0/3 at twelve minutes. The instinct is to find the play that undoes it — the roam, the dive, the flanking pick — and the instinct is exactly backwards. Being behind means your mistakes are punished harder and your successes are worth the same as they always were, so the last thing you want is variance. What loses lost games is trying to win them quickly.",
    },
    {
      kind: "keyPoint",
      title: "Behind means your job got smaller, not bigger",
      text: "A player who is even has to farm, roam, contest objectives and take fights. A player who is behind has to farm, stay alive, and be somewhere useful when the objective happens. That is fewer jobs, done more carefully — and the reason it works is that the enemy who is ahead has to keep taking risks to stay ahead.",
    },
    {
      kind: "table",
      caption: "The same situation, two states",
      head: ["Situation", "Even", "Behind"],
      rows: [
        [
          "Wave pushed to you",
          "Shove it back and look for a roam",
          "Farm it under turret; take the free reset",
        ],
        [
          "A skirmish starts near you",
          "Join it",
          "Join only if you arrive first — you cannot afford to be the last one in",
        ],
        [
          "Enemy jungler unseen 30s",
          "Play the odds and keep farming",
          "Assume he is coming and hold position",
        ],
        [
          "An objective spawns",
          "Contest",
          "Be present with your wave shoved — presence is what you have to offer",
        ],
      ],
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "The comeback play",
      text: "You are behind, so you look for the one move that erases it: a solo dive, a deep flank, a 1v2 you win in your head. It fails about eighty percent of the time, and each failure makes the next one more necessary, which is how 0/3 becomes 0/7 in six minutes.",
      fix: "There is no single move. There are four minutes of farming safely, and then a fight your team takes where you are alive and present. Gold from waves does not care how you feel about it, and it is the only comeback mechanism that works reliably.",
    },
    {
      kind: "prose",
      text: "Losing games turn at exactly two moments. The first is when the enemy who is ahead overextends into a position their lead made them comfortable in — which happens to almost everybody, and only pays if you are alive and nearby to punish it. The second is an objective fight where numbers matter more than items: five people arriving on time beats five people with better stats arriving one at a time. Both require the same thing from you, which is being alive and present.",
    },
    { kind: "drill", drillId: "behind-decision" },
    { kind: "drill", drillId: "behind-quiz" },
  ],
  drills: [
    {
      id: "behind-decision",
      kind: "decision",
      situation:
        "You are 0/3 at 13:00 and two levels down. Your wave has just been shoved into your turret. Your jungler pings for help at the enemy blue buff, which is a twelve-second walk away through their jungle.",
      facts: [
        "0/3, two levels down at 13:00",
        "Wave shoved into your turret",
        "Jungler pinging for help 12 seconds away, in their jungle",
        "Enemy laner is with the wave, pushing",
      ],
      options: [
        {
          id: "a",
          label: "Farm the wave under turret and ignore the ping",
          explain:
            "Correct. Twelve seconds is a lifetime, you arrive last, and behind and two levels down you are the free kill that turns their skirmish into a snowball. Meanwhile the wave under your turret is the only gold you are certain to get this minute.",
          correct: true,
        },
        {
          id: "b",
          label: "Go — a kill there is exactly the comeback you need",
          explain:
            "This is the comeback play. Arriving last at a fight in their jungle while two levels down is the single most reliable way to go from behind to unrecoverable.",
          correct: false,
        },
        {
          id: "c",
          label: "Ping back and start walking, then decide when you see the fight",
          explain:
            "Walking into their jungle to gather information you can get from the minimap. By the time you see it, you are in it.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall, buy, and teleport to the fight",
          explain:
            "Spends your teleport on someone else's skirmish and puts you in the same losing arithmetic thirty seconds later, with the wave lost as well.",
          correct: false,
        },
      ],
    },
    {
      id: "behind-quiz",
      kind: "quiz",
      prompt:
        "What is the reliable mechanism by which a player who is behind gets back into the game?",
      options: [
        {
          id: "a",
          label:
            "Farming safely until the enemy's lead makes them overextend, then being alive to punish it",
          explain:
            "Correct, and both halves matter. The overextension happens on its own — being alive, nearby and full health when it does is the part you control, and it is what farming safely was for.",
          correct: true,
        },
        {
          id: "b",
          label: "Winning a fight you were not supposed to win",
          explain:
            "It happens, and you cannot plan around it. Building a game on the eighty-percent-failure play is how being behind becomes being out.",
          correct: false,
        },
        {
          id: "c",
          label: "Getting your jungler to camp your lane",
          explain:
            "A jungler spending resources on a losing lane usually loses the jungler the game too. Their time is better spent where it is already working.",
          correct: false,
        },
        {
          id: "d",
          label: "Waiting for your team to carry while you farm quietly",
          explain:
            "Half right — farming quietly is correct — but the passive half misses the point. You have to be present at the objective fight, not just alive somewhere.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 1.5,
    games: 3,
    instruction:
      "Next 3 games: any time you are two or more kills behind, do not join a fight unless you arrive first, and do not walk into enemy jungle at all. Farm the wave in front of you and be present, alive, at every objective.",
  },
};
