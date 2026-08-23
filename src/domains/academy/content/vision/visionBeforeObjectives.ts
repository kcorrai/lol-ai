import type { Lesson } from "@/domains/academy/types";

export const visionBeforeObjectives: Lesson = {
  slug: "vision-before-objectives",
  trackId: "vision",
  title: "Thirty Seconds Before the Objective",
  summary:
    "Drakes and Barons are not won at the pit. They are won in the minute before the timer, by whichever team did the four boring things first.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Name the four things that have to happen before an objective timer, and their order",
    "Start the setup a minute early instead of walking to the pit on zero",
    "Recognise a setup you have already lost, and take the trade instead of the fight",
  ],
  fixes: ["objective_neglect", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Watch a pro game with the sound off and you will notice something strange: nothing happens for forty seconds, and then a drake dies uncontested. The fight you were expecting never took place, because it was decided before the timer hit zero by two teams doing setup, one of them better. Your solo queue games have the same structure. Almost nobody plays them that way.",
    },
    {
      kind: "keyPoint",
      title: "Setup is four things, and they are boring",
      text: "Clear the waves so nobody has to leave. Sweep their vision off the approach. Place your own on the route they would come from. Stand somewhere that is both close enough to start and safe enough not to be picked. That is the whole art. None of it happens at the pit, and all of it happens before the timer.",
    },
    {
      kind: "table",
      caption: "The last minute, in order",
      head: ["Clock", "What is happening", "Why it is that order"],
      rows: [
        [
          "-60s",
          "Waves get shoved in the two nearest lanes",
          "So nobody is farming when it starts, and nothing crashes into your turret mid-fight",
        ],
        [
          "-45s",
          "Sweeper walks their approach",
          "Their vision has to die before yours goes up, or they just watch you place it",
        ],
        [
          "-30s",
          "Your wards go on their route in",
          "This is the ward that decides whether you start or back off",
        ],
        [
          "-15s",
          "Everyone stands on the objective side, together",
          "A pick in the last fifteen seconds is the objective, not a kill",
        ],
      ],
    },
    { kind: "drill", drillId: "objective-setup-order" },
    {
      kind: "prose",
      text: "The order is not arbitrary. Warding before sweeping means placing your vision in front of an audience — they see the ward go down, they know exactly what you are doing, and they get to plan around it. Sweeping before the waves are cleared means your carries are still farming when the window opens. Every one of these four steps exists because the step before it makes it work.",
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Arriving at the pit when the timer says zero",
      text: "Five people walk into the pit as the objective spawns, from three different directions, through bushes nobody swept, with the enemy already standing on the other side of it. The fight starts on their terms and you were never in it.",
      fix: "Timer zero is when the setup pays out, not when it starts. If you are still walking at zero you have already lost the setup — and losing the setup is not the same as losing the objective, provided you notice in time to do the other thing.",
    },
    {
      kind: "mapFigure",
      caption: "Forty seconds before Baron: the three pieces of the setup",
      annotations: [
        {
          at: { x: 0.52, y: 0.31, r: 0.055 },
          label: "Their walk in",
          tone: "bad",
          note: "They do not appear in the pit, they walk to it, and this is the side they walk from. Everything the setup buys you is thirty seconds of warning about this one line.",
        },
        {
          at: { x: 0.44, y: 0.19, r: 0.055 },
          label: "Sweep, then ward, thirty seconds early",
          tone: "good",
          note: "In that order. A ward placed into their control ward is 75 gold given away, which is why the sweeper walks the route first and the ward follows it.",
        },
        {
          at: { x: 0.2, y: 0.36, r: 0.055 },
          label: "Where you stand once it is lit",
          tone: "good",
          note: "Your own side of the pit, grouped, waiting. Standing here before the sweep is standing in the dark next to an objective, which is the fight they want.",
        },
      ],
    },
    {
      kind: "keyPoint",
      title: "The other thing: trade, do not contest",
      text: "If they set up first and you cannot see their approach, contesting is a coin flip you are paying for. The alternative is to take something else with the time they have spent standing still — the other side's turret, the opposite objective, a full wave of gold each. A drake traded for two turrets is a trade you win, and a drake contested blind is a lost fight plus the drake.",
    },
    {
      kind: "prose",
      text: "This is also the honest answer to 'my team never groups'. You cannot make four strangers walk somewhere. You can start the setup a minute early yourself — shove your wave, sweep the route, place the ward — because all four of those are things one player does alone, and a team that arrives at a lit objective with cleared waves often plays the fight correctly by accident.",
    },
    { kind: "drill", drillId: "objective-setup-decision" },
  ],
  drills: [
    {
      id: "objective-setup-order",
      kind: "order",
      prompt:
        "Put the last minute before a Baron attempt in order. Each step is only worth doing if the one before it has happened.",
      items: [
        { id: "ward", label: "Place your wards on their route in" },
        { id: "waves", label: "Shove the waves in the nearest lanes" },
        { id: "stand", label: "Gather on the objective side, together" },
        { id: "sweep", label: "Walk their approach with the sweeper on" },
      ],
      correctOrder: ["waves", "sweep", "ward", "stand"],
      explain:
        "Waves first, because a carry still farming is a carry not at the fight and a wave crashing into your base is a reason to leave it. Sweep before you ward, or you place your vision in front of an audience who then plan around it. Ward next, because that is the information the start-or-back-off call is made on. Gather last: standing still together for forty seconds is how you get picked, so it is the shortest step, not the first.",
    },
    {
      id: "objective-setup-decision",
      kind: "decision",
      situation:
        "Baron spawns in twenty seconds. Their team is already standing on the Baron side with vision you have not been able to clear, your bottom wave is crashing into your own turret, and two of your team are still walking mid.",
      facts: [
        "Baron in 20s, enemy already set up",
        "Their vision on the pit is intact",
        "Your bottom wave crashing into your own turret",
        "Two teammates still walking",
      ],
      options: [
        {
          id: "a",
          label: "Give up the Baron and take the bottom side of the map with everyone",
          explain:
            "Correct. You have lost the setup on every count and the fight would start on their terms. Their five are committed to standing at a pit; that is a minute of the map you can spend on turrets and waves they are not defending.",
          correct: true,
        },
        {
          id: "b",
          label: "Contest it — Baron is worth a coin flip at this stage",
          explain:
            "It is not a coin flip. Fighting into intact enemy vision, from three directions, with two people arriving late, is a fight you are paying an entry fee to lose — and then they get the Baron anyway.",
          correct: false,
        },
        {
          id: "c",
          label: "Send one person to face-check and decide from what they see",
          explain:
            "Face-checking a set-up team twenty seconds before Baron is not scouting, it is donating. The pick you give away is the reason the Baron becomes uncontestable.",
          correct: false,
        },
        {
          id: "d",
          label: "Everyone defends the bottom wave and waits for them to commit",
          explain:
            "Passive in the one way that costs you: they take the Baron for free and you have gained nothing but a wave you would have got anyway. If you are not contesting, the time has to be spent on something they cannot defend.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "visionScore",
    direction: "increase",
    delta: 6,
    games: 3,
    instruction:
      "Next 3 games: for every drake and Baron, start your own setup 60 seconds early — shove your nearest wave, sweep their approach, then ward it. If their vision is still up at 20 seconds, say 'trade' in chat and take the other side of the map.",
  },
};
