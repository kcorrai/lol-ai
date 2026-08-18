import type { Lesson } from "@/domains/academy/types";

export const aloneInLane: Lesson = {
  slug: "alone-in-lane",
  trackId: "adc",
  title: "Alone After Your Support Leaves",
  summary:
    "Somewhere around twelve minutes your support walks off and the lane becomes a 1v1 you did not draft for. It is the window most ADCs die in, and it is entirely predictable.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Change the wave state before your support leaves, not after",
    "Play the 1v2 window as a farming problem rather than a bravery problem",
    "Keep taking plates and turrets alone without standing where a gank works",
  ],
  fixes: ["high_deaths", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "The mid game arrives in bot lane before anywhere else. Around twelve to fifteen minutes supports start roaming, and the lane you were playing for twelve minutes turns into something else without warning — usually while your wave is pushed and their jungler is unaccounted for. Almost every ADC death between twelve and eighteen minutes happens in this window, and the window is on a schedule you can read.",
    },
    {
      kind: "keyPoint",
      title: "The wave has to change before your support does",
      text: "The moment your support says they are leaving — or you see the first roam of the game — the wave state you want changes completely. Alone, you want the wave near your own turret where a gank has to cross open ground, not shoved into theirs where you are the only body on that half of the map. Set that up while there are still two of you, because after they go you cannot afford the seconds it takes.",
    },
    {
      kind: "table",
      caption: "Two people versus one person, same lane",
      head: ["", "With a support", "Alone"],
      rows: [
        ["Where the wave should be", "Pushed, taking plates", "Near your turret, or slowly pushing"],
        ["A gank costs you", "A summoner, usually", "The lane and 300 gold"],
        ["What you want", "Pressure", "Minions and the next item"],
        ["Their jungler", "Has to bring somebody", "Comes alone, and that is enough"],
      ],
    },
    { kind: "drill", drillId: "alone-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Keeping the same lane after the second player left",
      text: "Your support roams mid. You keep pushing the same way you have all game, take two more plates, and die to a jungler who walked from his own blue buff. You lost three hundred gold and the plates you had already taken were worth two hundred — and the lane is now theirs for the next four minutes.",
      fix: "When one of the two players leaves, the lane is a different lane. Take the plates you can take without crossing the middle of the lane, hold the wave closer to home, and let the enemy support's absence — which usually happens at the same time — do the rest. Being alive in bot lane at eighteen minutes with your item is the whole assignment.",
    },
    {
      kind: "keyPoint",
      title: "Their support left too, and that is your window",
      text: "Roams tend to happen at the same time on both sides, because both supports are reading the same objective timer. If their support has gone and yours has not, you have a two-versus-one for as long as it lasts — that is when you push and take the plates, and it is the only version of this window where forward is correct.",
    },
    { kind: "drill", drillId: "alone-decision" },
    {
      kind: "checklist",
      title: "When your support says they are leaving",
      items: [
        "Change the wave first — hold it nearer your turret before they walk",
        "Count their support: gone as well, or still standing there",
        "Take plates only from a position you can leave from",
        "No vision on their jungler? Then this wave is worth less than your life",
      ],
    },
  ],
  drills: [
    {
      id: "alone-quiz",
      kind: "quiz",
      prompt:
        "Your support leaves for a mid roam and the enemy support is still in lane. What is the correct wave state?",
      options: [
        {
          id: "a",
          label: "Hold the wave near your own turret and farm safely",
          explain:
            "Correct. You are the only player on that half of the map and they have two. A wave near your turret means any attempt on you has to cross open ground you can see, and you keep collecting minions the whole time.",
          correct: true,
        },
        {
          id: "b",
          label: "Shove the wave in quickly and take plates before they notice",
          explain:
            "This is the exact play the window punishes. Shoving alone against two puts you at their turret with nobody near you and a jungler who now has a free target.",
          correct: false,
        },
        {
          id: "c",
          label: "Freeze the wave in the middle of the lane",
          explain:
            "A freeze in the middle is neither safe nor productive: you are within reach of an all-in from two players and not close enough to your turret for it to matter.",
          correct: false,
        },
        {
          id: "d",
          label: "Follow your support to mid so you are not alone",
          explain:
            "That gives up the lane entirely and puts the role that needs minions in the place where there are none. Your support roams so you can farm, not so you can follow.",
          correct: false,
        },
      ],
    },
    {
      id: "alone-decision",
      kind: "decision",
      situation:
        "14:30. Both supports have left for a mid fight. You are alone against the enemy ADC with the wave in the middle. Their turret has two plates left and drake spawns in two minutes.",
      facts: [
        "Both supports gone — it is a clean 1v1",
        "Two plates left on their bot turret",
        "You are even in items with the enemy ADC",
        "Their jungler was seen top side 20 seconds ago",
      ],
      options: [
        {
          id: "a",
          label: "Push and take the plates — it is 1v1, and their jungler is on the other half",
          explain:
            "Correct. This is the good version of the window: both supports gone means no 1v2, and a jungler seen top side twenty seconds ago cannot reach you before the plates fall. Forward is right precisely because both halves of the arithmetic checked out.",
          correct: true,
        },
        {
          id: "b",
          label: "Hold the wave near your turret to be safe",
          explain:
            "Safe against a threat that is not there. In a clean 1v1 with their jungler accounted for on the far side, holding back gives away plates for nothing.",
          correct: false,
        },
        {
          id: "c",
          label: "Rotate to mid to help with the fight",
          explain:
            "You would arrive last to a fight that does not need you, and give up the plates that are open precisely because everybody else went there.",
          correct: false,
        },
        {
          id: "d",
          label: "Back to buy so you are ready for the drake",
          explain:
            "There are two minutes and two free plates. Backing now converts a window that is open right now into an item you could have had anyway.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 0.6,
    games: 3,
    instruction:
      "Next 3 games: the moment your support leaves lane, check whether theirs has too. If they are still there, pull the wave back toward your turret before doing anything else.",
  },
};
