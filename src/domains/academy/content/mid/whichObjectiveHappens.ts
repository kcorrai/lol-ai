import type { Lesson } from "@/domains/academy/types";

export const whichObjectiveHappens: Lesson = {
  slug: "which-objective-happens",
  trackId: "mid",
  title: "Mid Decides Which Objective Happens",
  summary:
    "Two objectives, two ends of the map, and one player who can reach both. The rotation that decides which one your team gets, and the order it has to happen in.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Rotate to an objective in the order that keeps the lane paid for",
    "Arrive as the fourth body before the fight rather than the fifth after it",
    "Choose the objective your position makes cheap, not the one your team pinged",
  ],
  fixes: ["objective_neglect", "late_game_throw"],
  blocks: [
    {
      kind: "prose",
      text: "Late in the laning phase there are usually two things available — a drake at one end, a herald or a turret at the other — and both teams can only really commit to one. The team that gets to choose is the team whose mid laner is already moving, because everybody else is a full lane's walk from at least one of them. That choice is the most valuable thing the role produces and most mid laners hand it over by being late.",
    },
    {
      kind: "keyPoint",
      title: "Fourth before the fight beats fifth after it",
      text: "Objectives are decided by who has more bodies near the pit when it starts, not by who has more bodies in the fight once it has begun. Arriving fourth, before anything happens, means your team starts the objective and theirs has to react. Arriving fifth, ten seconds in, means you are joining a fight your team already committed to at a disadvantage — the same walk, a completely different game.",
    },
    { kind: "drill", drillId: "objective-order" },
    { kind: "gate" },
    {
      kind: "table",
      caption: "Which objective is cheap for you",
      head: ["Where you are", "What is cheap", "What it costs to do the other one"],
      rows: [
        ["Wave crashed, standing mid", "Either — this is the good state", "Nothing"],
        ["Just shoved, top side of mid", "The top-side objective", "A wave and 15 seconds"],
        ["Wave pushing into your turret", "Neither", "A wave, a plate, and you arrive last anyway"],
        ["Recalling with 1400 gold", "Whichever one is 30+ seconds away", "The item, if you skip the back"],
      ],
    },
    {
      kind: "mistake",
      title: "Rotating to the objective your team pinged",
      text: "Four pings on the drake. You are top side with a wave you have not shoved. You walk anyway, arrive twelve seconds after the fight starts having lost the wave and the plate, and your team loses the fight 4v5 before you get there — so you get there in time to die as well.",
      fix: "Pings are a request, not a plan. Answer them with a decision: if you can crash and arrive before it starts, go; if you cannot, say so once and take the other objective — the herald nobody is watching, or the turret their mid laner has left undefended by rotating. Two objectives traded is a fine outcome; one objective lost twice is not.",
    },
    {
      kind: "keyPoint",
      title: "Your opponent has the same clock as you",
      text: "If you are rotating to a drake, their mid laner is doing the same arithmetic and will usually make the same call. So the real question is who arrives with a wave paid for and who arrives having abandoned one — and if you can see them leave first, the strongest move is often to stay, take their turret plates, and let your team trade objectives.",
    },
    { kind: "drill", drillId: "objective-decision" },
    {
      kind: "checklist",
      title: "Every objective window",
      items: [
        "Read the timer at 40 seconds, not at zero",
        "Crash first, walk second — in that order, always",
        "Am I arriving before it starts? If not, pick the other objective",
        "Did their mid leave before me? Then the plates in front of me are the trade",
      ],
    },
  ],
  drills: [
    {
      id: "objective-order",
      kind: "order",
      prompt:
        "Drake spawns in 45 seconds and your team wants it. Put the mid laner's rotation in order.",
      items: [
        { id: "read", label: "Read the timer and decide, at 45 seconds out" },
        { id: "shove", label: "Shove the wave into their turret" },
        { id: "ward", label: "Ward the enemy's approach to the pit on the way down" },
        { id: "arrive", label: "Arrive at the pit before the objective is started" },
      ],
      correctOrder: ["read", "shove", "ward", "arrive"],
      explain:
        "The decision comes first because everything after it is timed from there. The shove is what makes the trip free, the ward is on the way and costs nothing extra, and arriving before the start is the entire point — the same four actions in any other order produce a mid laner who turns up last having also lost their wave.",
    },
    {
      id: "objective-decision",
      kind: "decision",
      situation:
        "16:20. Drake spawns in 20 seconds at the bottom of the map. Your wave is pushing toward your own turret and you have not shoved. You can see the enemy mid laner already walking down river.",
      facts: [
        "Drake in 20 seconds; you are a 25-second walk away",
        "Your wave is pushing into your own turret, unshoved",
        "The enemy mid laner has already left for the drake",
        "Their mid turret has two plates left and nobody defending it",
      ],
      options: [
        {
          id: "a",
          label: "Stay, take the wave and the plates, and tell your team to trade the drake",
          explain:
            "Correct. You cannot arrive in time and they can — but they have paid a wave and two plates for it. Taking what they left behind turns a drake you were going to lose anyway into an even trade, and it is the one option that costs you nothing.",
          correct: true,
        },
        {
          id: "b",
          label: "Walk to the drake immediately and hope to arrive in time",
          explain:
            "You arrive five seconds after it starts, having given your own turret a wave to eat. That is the fifth-body-after-the-fight arrival: same walk, worst possible version of it.",
          correct: false,
        },
        {
          id: "c",
          label: "Shove the wave first, then walk down",
          explain:
            "Right instinct, wrong clock. Shoving takes the twenty seconds you needed for the walk, so you pay for the wave *and* still arrive after the fight has started.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall, buy, and teleport-free walk back down for the fight after",
          explain:
            "Gives away the plates their absent mid laner has left open — the one profitable thing on the board — in exchange for arriving at a fight that will already be over.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 4,
    games: 3,
    instruction:
      "Next 3 games: for every drake and herald, decide at 40 seconds out. Either crash and arrive before it starts, or stay and take the plates the enemy mid laner left behind. No arriving late.",
  },
};
