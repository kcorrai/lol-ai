import type { Lesson } from "@/domains/academy/types";

export const roamingIsYourFarm: Lesson = {
  slug: "roaming-is-your-farm",
  trackId: "support",
  title: "Roaming Is Your Farm",
  summary:
    "The mid laner pays a wave to leave their lane. You pay nothing. So the only question left is whether the trip produced something — and most support roams do not.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Leave bot lane on a wave state that does not punish your ADC",
    "Name what the roam is going to produce before walking",
    "Return, or commit — never drift between the two",
  ],
  fixes: ["objective_neglect", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "You are the cheapest player on the map to move, which makes roaming the closest thing the role has to farming. But cheap is not free: while you are gone your ADC is one player against two, and a roam that produces nothing has still cost them the lane. The skill is not the walk — it is deciding what the walk is for and leaving at a moment your carry can survive.",
    },
    {
      kind: "keyPoint",
      title: "Set the wave before you go, or your ADC pays for your trip",
      text: "A roam that starts with the wave pushed into the enemy turret leaves your ADC deep on the map alone, which is where junglers eat them. A roam that starts after you have pulled the wave back toward your own turret leaves them somewhere safe and farming. Same roam, same value at the other end, and one of the two versions costs your team three hundred gold about a third of the time.",
    },
    {
      kind: "table",
      caption: "Roams that are worth the walk",
      head: ["Roam", "Produces", "Leave when"],
      rows: [
        [
          "Mid gank with a pushed mid wave",
          "A kill, or a flash and a plate",
          "Your bot wave is coming back toward your turret",
        ],
        [
          "Vision before an objective",
          "The fight starting on your terms",
          "60–90 seconds before the pit",
        ],
        ["Warding their jungle entrance", "Their jungler's route", "Right after your lane resets"],
        [
          "Following your jungler to a gank",
          "A second body they cannot answer",
          "Only if you can be back for the next wave",
        ],
        [
          "Walking mid because nothing is happening",
          "Nothing",
          "Never — this is the one that loses lanes",
        ],
      ],
    },
    { kind: "drill", drillId: "roam-support-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "The roam that becomes a walk",
      text: "You leave for mid. The gank is not there, so you ward. Then you see their jungler on the minimap, so you follow. Then you are top side and might as well ward that too. Ninety seconds later you return to a bot lane that has lost a turret plate and an ADC who is a level down and has stopped talking to you.",
      fix: "One trip, one purpose, then back. If the thing you left for is not there, turn around immediately — the roam has already failed and every additional second is charged to your carry. Drifting from one small thing to the next is how a support ends the laning phase having achieved nothing in two lanes at once.",
    },
    {
      kind: "keyPoint",
      title: "The best roam window is the enemy support's roam window",
      text: "Both supports read the same objective timers, so they tend to leave at the same times. If theirs has gone and yours has not, your ADC is in a 2v1 in your favour and should be pushing — that is the moment to stay. If neither has left and a drake is ninety seconds out, that is the moment to go. Watch their support as closely as you watch the timer.",
    },
    { kind: "drill", drillId: "roam-support-decision" },
    {
      kind: "checklist",
      title: "Before leaving bot lane",
      items: [
        "Is the wave pulling back toward our turret, or am I leaving my ADC deep",
        "What is this trip going to produce — say it in one sentence",
        "Where is their support right now",
        "If it is not there when I arrive, I turn around — decided before I go",
      ],
    },
  ],
  drills: [
    {
      id: "roam-support-quiz",
      kind: "quiz",
      prompt: "What is the correct bot lane wave state to leave on?",
      options: [
        {
          id: "a",
          label: "Pulling back toward your own turret, so your ADC farms somewhere safe",
          explain:
            "Correct. Your carry stays close to home while you are away, which is the whole difference between a roam that costs nothing and a roam that costs a death. The wave will be there when you return.",
          correct: true,
        },
        {
          id: "b",
          label: "Pushed into the enemy turret, so they cannot follow you",
          explain:
            "It stops them following and leaves your ADC deep and alone — the exact position enemy junglers look for. You have protected yourself and sold your carry.",
          correct: false,
        },
        {
          id: "c",
          label: "Frozen in the middle of the lane",
          explain:
            "A middle freeze keeps your ADC within reach of a 2v1 all-in with nowhere to retreat to. Neutral is not the same as safe.",
          correct: false,
        },
        {
          id: "d",
          label: "It does not matter — the roam is worth it either way",
          explain:
            "This is the assumption that makes support roams net-negative. The trip is free for you and never free for the player you left behind.",
          correct: false,
        },
      ],
    },
    {
      id: "roam-support-decision",
      kind: "decision",
      situation:
        "9:30. Drake spawns in 90 seconds. Your bot wave is pushing toward your own turret. The enemy support is still standing in bot lane and their mid has just pushed into your mid turret.",
      facts: [
        "Drake in 90 seconds",
        "Your bot wave is coming back toward your turret — safe for your ADC",
        "Enemy support has not left bot lane",
        "Enemy mid is pushed up, overextended",
      ],
      options: [
        {
          id: "a",
          label: "Leave now — ward the drake pit approach on the way and look at mid as you pass",
          explain:
            "Correct. The wave is set so your ADC is safe, the drake window is exactly the ninety seconds a vision trip needs, and an overextended enemy mid on the route is a bonus rather than the reason. One trip, two things it might produce, and a clear time to be back.",
          correct: true,
        },
        {
          id: "b",
          label: "Stay — their support has not left, so it is 2v2",
          explain:
            "Being even in lane is not worth anything at this moment. The drake is ninety seconds away and unwarded, and their support staying put is precisely why nobody is watching the pit.",
          correct: false,
        },
        {
          id: "c",
          label: "Go straight to mid for the gank and ward the drake afterwards",
          explain:
            "The gank is the bonus, not the errand. Doing it first usually means the vision never happens, and vision is the thing the next ninety seconds are actually about.",
          correct: false,
        },
        {
          id: "d",
          label: "Push the bot wave in first so the lane is safe, then leave",
          explain:
            "Pushing before you go is the exact wave state that gets your ADC killed while you are away. Leaving on a wave that pulls back is what makes the trip free.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "visionScore",
    direction: "increase",
    delta: 5,
    games: 3,
    instruction:
      "Next 3 games: never leave bot lane while the wave is pushing toward the enemy turret. Before each roam, say what it is for; if that is not there when you arrive, turn around immediately.",
  },
};
