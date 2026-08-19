import type { Lesson } from "@/domains/academy/types";

export const engageAndDisengage: Lesson = {
  slug: "engage-and-disengage",
  trackId: "teamfighting",
  title: "Who Starts It, and When You Leave",
  summary:
    "A fight has an owner. If nobody on your team knows who starts it, five people walk forward one at a time — and leaving a fight is a decision with a timing, not a thing you do once it has gone badly.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Say who on your team owns the engage, before the fight",
    "Follow an engage within the window that makes it work",
    "Leave a fight at the moment the maths turns, not after it has finished turning",
  ],
  fixes: ["high_deaths", "late_game_throw"],
  blocks: [
    {
      kind: "prose",
      text: "The most recognisable losing pattern in solo queue is not a bad fight. It is five people arriving at the same fight in a queue: the support hooks, the tank is still walking, the mid laner throws an ability from too far away, the ADC arrives last and dies to everything that is now free. Nobody made a bad decision. Nobody made a decision at all.",
    },
    {
      kind: "keyPoint",
      title: "One champion owns the engage, and everyone else follows",
      text: "Look at your team composition before the fight and name the champion whose job it is to start. Usually the tank or the engage support; sometimes nobody, and knowing that is just as useful — a team with no engage does not force fights, it takes objectives and punishes theirs. What kills teams is five players who each think somebody else is going first.",
    },
    {
      kind: "figure",
      caption: "Who owns it — and what it looks like when nobody does",
      assets: [
        {
          ref: { of: "champion", name: "Malphite" },
          label: "The unmissable one",
          note: "When a champion like this is on your team, the question is answered before the fight starts. Nobody else goes first, and your only job is to have an ability left when he does.",
        },
        {
          ref: { of: "champion", name: "Leona" },
          label: "The engage support",
          note: "Owns the start in bot lane and keeps owning it at five-man fights. If your support is this and you are the carry, you do not choose when the fight happens — you choose whether you are in range when it does.",
        },
        {
          ref: { of: "champion", name: "Sejuani" },
          label: "The jungler who starts it",
          note: "An engage jungler makes the whole team's timing his: fights happen when he arrives, which is why watching where he is walking is worth more than watching your own lane.",
        },
        {
          ref: { of: "champion", name: "Janna" },
          label: "The team with no engage",
          note: "This is not a gap to fill by forcing one. A team built to disengage takes objectives and punishes their engage instead — and knowing that before the fight is the same skill as naming who starts it.",
        },
      ],
    },
    {
      kind: "table",
      caption: "The follow-up window",
      head: ["After the engage lands", "You have", "If you miss it"],
      rows: [
        ["Hard crowd control on a target", "1–2 seconds", "The target walks out and your engage dies alone"],
        ["A knock-up into the enemy team", "About 1 second", "The knock-up was a free ability for them to dodge"],
        ["A dive onto the backline", "Immediately, or not at all", "Your diver is a kill and the fight starts four-versus-five"],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "Following late is worse than not following. If your tank engages and you arrive two seconds after everyone else has traded abilities, you are walking into a fight with their cooldowns refreshed on you specifically. The honest choice at that moment is to not go at all — your tank is already dead, and adding a second death converts a lost skirmish into a lost objective.",
    },
    {
      kind: "mistake",
      title: "Staying because you have already spent something",
      text: "You used your ultimate, so the fight has to be worth it. You flashed in, so leaving now would waste the flash. The cooldown is gone either way; staying does not bring it back, it just adds your life to the bill.",
      fix: "Spent cooldowns are not an argument for anything. The only question at any moment in a fight is whether the next five seconds are winnable from where everyone is standing right now — abilities you already used are not part of that sentence.",
    },
    { kind: "drill", drillId: "engage-decision" },
    {
      kind: "keyPoint",
      title: "Leaving is a team action too",
      text: "Disengage works the same way engage does: someone has to do it first, and the rest have to follow immediately. A team that trickles out of a fight dies exactly like a team that trickles into one — the last two out are alone against five who are all still together.",
    },
    { kind: "drill", drillId: "engage-quiz" },
  ],
  drills: [
    {
      id: "engage-decision",
      kind: "decision",
      situation:
        "Your tank engages onto their backline at 30:00. You are the mid laner and you were slightly out of position — by the time you can reach the fight, your tank has been focused to 20% and two of your teammates have used their abilities. Their front line is untouched.",
      facts: [
        "Your tank engaged and is at 20%",
        "Two teammates have already spent abilities",
        "Their front line is untouched",
        "You are arriving 2 seconds late",
      ],
      options: [
        {
          id: "a",
          label: "Do not follow — hold your ground and let your team disengage to you",
          explain:
            "Correct. Two seconds late is late enough that you would arrive alone into refreshed cooldowns. Standing where your team can retreat through you turns a lost engage into a lost skirmish instead of a lost fight and objective.",
          correct: true,
        },
        {
          id: "b",
          label: "Follow anyway — the fight is happening and your damage is needed",
          explain:
            "This is exactly the queue pattern: your damage arrives after their cooldowns have come back up, and you die second. A fight where you arrive alone is not a fight you are in.",
          correct: false,
        },
        {
          id: "c",
          label: "Use your ultimate from range to make the engage work",
          explain:
            "Sometimes right, and only if it changes whether your tank survives. From two seconds away into an untouched front line it usually just spends the ultimate on the same lost fight.",
          correct: false,
        },
        {
          id: "d",
          label: "Push the nearest side wave while they finish the fight",
          explain:
            "Cold-blooded and better than dying, but it abandons three teammates who can still walk out if somebody holds the ground behind them.",
          correct: false,
        },
      ],
    },
    {
      id: "engage-quiz",
      kind: "quiz",
      prompt: "Your team has no engage champion at all. What does that mean for how you fight?",
      options: [
        {
          id: "a",
          label: "You do not start fights — you take objectives and punish theirs",
          explain:
            "Correct. A team with no engage forcing a fight is a team walking at people who get to choose the terms. Take the things that force them to come to you, and let their engage be the one that has to work.",
          correct: true,
        },
        {
          id: "b",
          label: "Whoever is tankiest becomes the engage by default",
          explain:
            "Tankiness is not an engage. Sending your most durable champion in without the tools to hold anybody there just donates the first four seconds of every fight.",
          correct: false,
        },
        {
          id: "c",
          label: "You need to pick fights early before their composition scales",
          explain:
            "The composition problem is real; picking fights you cannot start is not the answer to it. Speed comes from objectives and picks, not from forcing engagements you have no way of opening.",
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
      "Next 3 games: name your team's engage champion before every fight. Follow within a second of the engage landing or do not follow at all, and never stay in a fight because of cooldowns you have already spent.",
  },
};
