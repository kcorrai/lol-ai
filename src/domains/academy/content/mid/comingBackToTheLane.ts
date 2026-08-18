import type { Lesson } from "@/domains/academy/types";

export const comingBackToTheLane: Lesson = {
  slug: "coming-back-to-the-lane",
  trackId: "mid",
  title: "Coming Back to a Lane You Left",
  summary:
    "Winning bot lane and losing your own turret is the mid laner's signature game. What the wave does while you are gone, and how to leave so it is still worth returning to.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Predict where the wave will be when you get back, before you go",
    "Use the bounce instead of arriving to whatever happened",
    "Choose between the wave and the second roam with a number rather than a feeling",
  ],
  fixes: ["low_cs", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "The roam worked. You got a kill bot, your ADC is ahead, and you jog back to mid feeling good about it — and find your opponent sitting on a wave under your turret, two levels up, with a plate already gone. This is not bad luck. It is what a crashed wave does next, and it is completely predictable from the moment you left.",
    },
    {
      kind: "keyPoint",
      title: "A crashed wave bounces, and the bounce is a timer you can read",
      text: "When your wave crashes into their turret, the tower kills the melee minions and the survivors start walking back toward you. That returning wave meets the next one somewhere in the middle of the lane about thirty seconds later. If you are back in time for that meeting you lose nothing at all — if you are twenty seconds late, your opponent has taken the whole wave and is pushing the next one into your turret.",
    },
    {
      kind: "table",
      caption: "The wave while you are away",
      head: ["You left when", "Where it is 30s later", "What you come back to"],
      rows: [
        ["Wave crashed into their turret", "Bouncing back toward the middle", "A wave to take, nothing lost"],
        ["Wave was pushing toward you", "Under your turret, dying", "Missing minions and a plate at risk"],
        ["Wave was frozen in the middle", "Wherever your opponent put it", "Whatever they chose, usually against you"],
        ["Right after you both backed", "Fresh wave in the middle", "Even, if you got back on time"],
      ],
    },
    { kind: "drill", drillId: "bounce-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Staying for the second thing",
      text: "You roamed bot, got the kill, and then the enemy jungler shows up so you fight him too. Then your ADC wants the drake. Four minutes later you return to mid having 'won' three fights and lost three waves, a plate and a level — and the opponent you left behind is now stronger than you in every fight for the next ten minutes.",
      fix: "Decide the return trip before you leave. One roam, one outcome, then back for the bounce. The second thing is almost always worse value than the wave you are giving up for it, because the wave is guaranteed and the second thing is not.",
    },
    {
      kind: "keyPoint",
      title: "Level five in mid is worth more than level five anywhere else",
      text: "Mid lane experience is shared between two players in the shortest lane, which is why mid laners hit their power spikes first. Every wave you miss is not just gold, it is the ultimate you would have had at the next objective. The mid laner who roams constantly and comes back a level down has traded the exact resource the role was built to accumulate.",
    },
    { kind: "drill", drillId: "bounce-decision" },
    {
      kind: "checklist",
      title: "Leaving and returning",
      items: [
        "Crash the wave before you go, so the bounce is working for you",
        "Name the return time — you are going back for the bounce, not eventually",
        "One roam, one outcome; the second thing is somebody else's job",
        "If you cannot get back for the bounce, do not go at all",
      ],
    },
  ],
  drills: [
    {
      id: "bounce-quiz",
      kind: "quiz",
      prompt:
        "You crash your wave into the enemy mid turret and roam. What happens to the lane over the next thirty seconds?",
      options: [
        {
          id: "a",
          label: "The survivors bounce back and meet the next wave near the middle",
          explain:
            "Correct. The turret kills the melee minions, the rest walk back, and the two waves meet around the centre. That meeting point is your return time — arrive for it and the roam cost you nothing.",
          correct: true,
        },
        {
          id: "b",
          label: "The wave stays at their turret until somebody clears it",
          explain:
            "Turrets clear minions on their own. Nothing sits there waiting; by the time you return the state has already changed once.",
          correct: false,
        },
        {
          id: "c",
          label: "It pushes further into their base and takes the turret",
          explain:
            "A single crashed wave does not out-damage a turret. It dies there and the remainder walks back toward you.",
          correct: false,
        },
        {
          id: "d",
          label: "Your opponent freezes it under their own turret",
          explain:
            "Nobody freezes a wave against their own tower voluntarily — that would give away every minion. They will clear it and push back at you.",
          correct: false,
        },
      ],
    },
    {
      id: "bounce-decision",
      kind: "decision",
      situation:
        "13:00. You crashed mid and roamed bot; the gank got a kill and your ADC is now shoving. Your jungler pings for the enemy bottom-side camps and mid's wave is about to bounce.",
      facts: [
        "The roam already got its kill",
        "Your mid wave is bouncing back toward the centre right now",
        "Your jungler wants to invade the enemy bottom jungle",
        "Your opponent recalled after your gank and is walking back to mid",
      ],
      options: [
        {
          id: "a",
          label: "Go back to mid immediately and meet the bounce",
          explain:
            "Correct. The roam is finished — it got exactly what it went for. The bounce is a whole wave that is only yours if you are standing there for it, and your opponent is walking to the same place from their fountain.",
          correct: true,
        },
        {
          id: "b",
          label: "Invade with your jungler while you are both bottom side",
          explain:
            "This is the second thing. It trades a guaranteed wave and a level for a camp that belongs to somebody else, on the far side of the map from the lane you have to defend.",
          correct: false,
        },
        {
          id: "c",
          label: "Stay bottom and help push the turret while their bot lane is dead",
          explain:
            "Tempting, and your ADC can do it alone against a dead lane. You would be a third body on a turret that was falling anyway, paying for it with the mid wave and the level.",
          correct: false,
        },
        {
          id: "d",
          label: "Recall now and walk back to mid with an item",
          explain:
            "The item is real but the timing gives away the bounce, and your opponent — who recalled first — arrives before you do. Back after the bounce, not instead of it.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "csPerMinute",
    direction: "increase",
    delta: 0.6,
    games: 3,
    instruction:
      "Next 3 games: every roam is one roam. Crash the wave, go, get the one thing you named, and be back in mid for the bounce — no second objective on the same trip.",
  },
};
