import type { Lesson } from "@/domains/academy/types";

export const arrivingLate: Lesson = {
  slug: "arriving-late",
  trackId: "top",
  title: "You Arrive From the Side",
  summary:
    "Top laners join fights last, from an angle nobody else has, usually with a decision to make on the way. What that is worth, and the game where the right answer is not to come at all.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Use the angle you arrive from instead of walking to your own front line",
    "Decide between the fight and the side lane by what is on the map, not by the ping",
    "Start the fight when nobody else on your team can, and know when that is your job",
  ],
  fixes: ["late_game_throw", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Everybody else on your team is already there. Your mid laner walked thirty seconds ago, the bot lane is standing in the pit, and you are coming from a side lane with a wave half-pushed behind you. This is not a failure of rotation — it is the shape of the role, and it hands you two things nobody else on your team has: an angle, and a choice.",
    },
    {
      kind: "keyPoint",
      title: "The angle is the whole advantage",
      text: "Walking to your team and standing in front of them makes you the fifth body in a line they have already counted. Arriving from the side of the pit they are not watching makes you a champion appearing behind their back line while their cooldowns are pointed the other way. Same champion, same items, completely different fight — and the only difference is which way you walked the last eight seconds.",
    },
    {
      kind: "table",
      caption: "Two ways to arrive",
      head: ["", "Walking to your team", "Coming from the side"],
      rows: [
        ["They see you", "The whole way in", "When you are already on somebody"],
        ["What you threaten", "Their front line", "Their carry"],
        ["What it costs them", "Nothing, they expected you", "Turning around, which is the fight"],
        ["When it is right", "You are the tank and they need one", "Almost every other time"],
      ],
    },
    { kind: "drill", drillId: "arriving-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Answering every ping",
      text: "There is a fight at drake. You are pushing a side lane into their turret, three waves deep, with nobody near you. Four pings arrive. You walk — twenty-five seconds through the river — and get there as the fight ends, with your wave dead under the turret and their whole team now free to look at you.",
      fix: "A fight you cannot reach in time is a fight that is happening without you either way. The question is not whether they want you there; it is whether you arrive while it is still undecided. If you do not, the correct answer is to take the thing they cannot defend while they are busy — and to say so, once, so your team knows the trade is deliberate.",
    },
    {
      kind: "keyPoint",
      title: "Sometimes you are the only one who can start it",
      text: "Late in a game where nobody wants to press first, teams stand and stare until somebody runs out of patience. If you are the durable one with the gap-closer, that somebody is you — and starting the fight on your terms, from the side, with your team watching for it, is worth more than the best positioning either team will manage after a bad engage.",
    },
    { kind: "drill", drillId: "arriving-decision" },
    {
      kind: "checklist",
      title: "On the way to a fight",
      items: [
        "Can I get there while it is still live — count the seconds honestly",
        "Which side of the pit is unwarded, and can I come from there",
        "Am I the engage, or am I the follow-up? My team needs to know which before it starts",
        "If I am not going, is my team told, and am I taking something they cannot defend",
      ],
    },
  ],
  drills: [
    {
      id: "arriving-quiz",
      kind: "quiz",
      prompt:
        "You are arriving at a teamfight around the drake pit ten seconds after it starts. What is the best use of the fact that you are late?",
      options: [
        {
          id: "a",
          label: "Come in from the side they are not watching and go straight at their back line",
          explain:
            "Correct. Being late means their cooldowns are already spent on your team and pointed the other way. The one thing a late arrival owns is the angle — using it on the carry is the entire value of showing up second.",
          correct: true,
        },
        {
          id: "b",
          label: "Walk to your team and stand in front of them as the front line",
          explain:
            "You have arrived where they expected you, at the moment your team most needed a surprise. If they have already committed to a front line, adding a second one changes nothing about who they are allowed to press.",
          correct: false,
        },
        {
          id: "c",
          label: "Wait at the entrance until you see who is winning",
          explain:
            "Ten seconds into a fight there is no more information coming. Waiting turns a body into a spectator and usually ends with you fighting whatever is left, alone.",
          correct: false,
        },
        {
          id: "d",
          label: "Take the drake while they fight",
          explain:
            "Tempting, and it usually loses both. You cannot solo an objective through a live fight next to it, and your team is fighting 4v5 on the assumption you are coming.",
          correct: false,
        },
      ],
    },
    {
      id: "arriving-decision",
      kind: "decision",
      situation:
        "33:00. Your team is fighting at Baron, top side. You are bottom, one wave from their inhibitor turret, with no teleport. Your team is pinging you to come.",
      facts: [
        "The fight is already 2 seconds old and you are 25 seconds away",
        "You are one wave from their inhibitor turret",
        "You have no teleport",
        "Nobody on their team is bottom side",
      ],
      options: [
        {
          id: "a",
          label: "Ping bottom once, take the inhibitor turret, and be ready to defend",
          explain:
            "Correct. The fight will be decided long before you could arrive; what you can affect is the structure nobody is defending. Telling your team once, before it resolves, is the difference between a deliberate trade and abandoning them.",
          correct: true,
        },
        {
          id: "b",
          label: "Run to Baron because your team is pinging",
          explain:
            "You arrive to whatever is left, alone, with the wave you abandoned dying to a turret. A fight that is twenty-five seconds away is a fight you are not in — walking there just moves your body to where theirs are.",
          correct: false,
        },
        {
          id: "c",
          label: "Back off and wait to see who wins the fight",
          explain:
            "The most expensive option on the board. You give up the fight *and* the turret, and end the exchange with nothing except a safe champion standing still.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall and buy so you are stronger for the next fight",
          explain:
            "Buying is not free at thirty-three minutes — it costs the one window where the whole enemy team is committed elsewhere and their bottom side is undefended.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 3,
    games: 3,
    instruction:
      "Next 3 games: for every fight after 20 minutes, either arrive from a flank angle while it is still live, or do not go at all and take a structure instead. No walking into the front of a fight that has already started.",
  },
};
