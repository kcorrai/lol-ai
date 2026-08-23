import type { Lesson } from "@/domains/academy/types";

export const freezing: Lesson = {
  slug: "freezing",
  trackId: "laning",
  title: "Freezing — And When Not To",
  summary:
    "A freeze holds the wave outside your turret, starves your opponent, and makes you almost impossible to gank. It is also the state most often held by accident, at the worst possible moment.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Hold a freeze on purpose and know exactly when it breaks",
    "List the three situations where freezing is the wrong answer",
    "Break an enemy freeze instead of standing in it",
  ],
  fixes: ["low_cs", "high_deaths"],
  blocks: [
    {
      kind: "prose",
      text: "A freeze is a wave held stationary just outside your own turret. You keep the enemy minions alive so their wave stays slightly larger, and you only last-hit — never enough to let your side push. Done properly, your opponent has to choose between walking to the deepest, most gankable spot in their lane to farm, or not farming at all.",
    },
    {
      kind: "keyPoint",
      title: "The mechanics of holding it",
      text: "Stand between your turret and the wave. Let the enemy keep two or three more minions than you. Last-hit only, and if your side starts to push, tank a couple of enemy minions with your body to slow it down. The freeze breaks the moment your wave gets bigger — that is the only thing that ends it.",
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The reason a freeze is so strong has almost nothing to do with the CS you gain and everything to do with geography. Standing next to your own turret means the enemy jungler has to walk past your vision, through your turret's range, to reach you. A frozen lane is the safest place on the map, which is why it is the correct answer whenever you are behind.",
    },
    {
      kind: "table",
      caption: "When to freeze — and when not to",
      head: ["Situation", "Freeze?"],
      rows: [
        ["You are behind and want to farm safely", "Yes — the single best use of a freeze"],
        [
          "Your opponent has to overextend to reach the wave",
          "Yes — you are printing gank opportunities for your jungler",
        ],
        [
          "An objective is spawning and your team needs you",
          "No — you cannot leave a freeze without giving it away",
        ],
        ["Your jungler is ganking the enemy lane and needs a shove", "No — shove for prio instead"],
        ["Enemy turret has plates up and you are ahead", "No — plates expire at 14:00, take them"],
        ["Your wave is huge and you need to reset", "No — crash it and recall"],
      ],
    },
    {
      kind: "mistake",
      title: "Freezing while ahead",
      text: "You are 2/0 and 20 CS up, so you hold the wave at your turret because it feels safe. Your lead never converts into plates or a turret, 14:00 passes, and the game goes even.",
      fix: "A freeze protects a deficit. A lead is spent by pushing, taking plates, and roaming. If you are ahead and the wave is frozen at your turret, you are voluntarily playing the losing player's game plan.",
    },
    { kind: "drill", drillId: "freeze-quiz" },
    {
      kind: "prose",
      text: "The other half of this skill is breaking a freeze that has been set on you. Standing at the edge trying to last-hit under pressure is the trap — that is the whole point of the freeze. The two real answers are: shove hard enough with abilities to break it and crash the wave, accepting the reset, or leave the lane entirely and take value elsewhere while your turret farms the wave for you. Both are better than starving in place.",
    },
    {
      kind: "checklist",
      title: "Freeze checklist",
      items: [
        "Am I behind, or ahead? Behind freezes, ahead pushes.",
        "Is there an objective in the next 90 seconds I need to be free for?",
        "Am I holding two or three fewer minions than the enemy? That is the balance point.",
        "If the enemy is freezing on me: shove through it or leave, but never stand in it",
      ],
    },
    { kind: "drill", drillId: "freeze-decision" },
  ],
  drills: [
    {
      id: "freeze-quiz",
      kind: "quiz",
      prompt: "Why does a freeze make you so much harder to gank?",
      options: [
        {
          id: "a",
          label:
            "Because you are standing next to your own turret, so the jungler has to come through it",
          explain:
            "Correct. The safety comes from geography, not from the wave itself. A frozen lane puts you at the safest point in your half of the map with a short escape and a long approach for them.",
          correct: true,
        },
        {
          id: "b",
          label: "Because the enemy minions block the jungler's path",
          explain:
            "Minions barely slow a champion down. The protection is the turret and the short distance home.",
          correct: false,
        },
        {
          id: "c",
          label: "Because the enemy laner cannot push into you",
          explain:
            "They can — pushing is exactly how they break the freeze. Being hard to gank is about where you are standing, not what they can do to the wave.",
          correct: false,
        },
      ],
    },
    {
      id: "freeze-decision",
      kind: "decision",
      situation:
        "10:30. You are 0/2 down and your opponent has frozen the wave just outside their turret. You are missing CS and getting poked every time you step up. Drake spawns in 60 seconds.",
      facts: [
        "You: 0/2, 15 CS behind",
        "Wave frozen at their turret, you are poked when you approach",
        "Drake in 60s, your jungler is on the drake side",
        "You have your abilities up and could shove through the wave",
      ],
      options: [
        {
          id: "a",
          label: "Shove the wave through with abilities and go help at drake",
          explain:
            "Correct. Standing in an enemy freeze while behind is the worst of both worlds — no CS and constant poke. Breaking it with abilities crashes the wave, resets the lane, and frees you to be present for an objective your team can actually win.",
          correct: true,
        },
        {
          id: "b",
          label: "Keep trying to last-hit at the edge of the freeze",
          explain:
            "This is exactly what the freeze is designed to make you do. You will keep missing CS, keep taking poke, and be absent for drake as well.",
          correct: false,
        },
        {
          id: "c",
          label: "Recall and come back with an item",
          explain:
            "Not the worst option — but recalling without shoving means the freeze is still there when you return, and you gave up the wave for nothing.",
          correct: false,
        },
        {
          id: "d",
          label: "Fight the enemy laner to break the freeze",
          explain:
            "You are 0/2 down and standing next to their turret. Fighting from behind, in their strongest position, is how a bad lane becomes an unplayable one.",
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
      "Next 3 games: whenever you fall behind in lane, set a freeze at your own turret instead of forcing a fight. Whenever you are ahead, refuse to freeze — push and look for plates.",
  },
};
