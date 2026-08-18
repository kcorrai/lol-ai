import type { Lesson } from "@/domains/academy/types";

export const closingTheGame: Lesson = {
  slug: "closing-the-game",
  trackId: "macro",
  title: "Closing a Won Game",
  summary:
    "The lead you built at twenty minutes is not a win. Most games you lose from ahead are lost in four specific ways, and all four are avoidable by knowing what a Baron is actually for.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Use a Baron to end a game rather than to farm one",
    "Name the four ways a won game is thrown, and catch yourself in each",
    "Choose the boring line on purpose when you are ahead",
  ],
  fixes: ["late_game_throw", "objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Every player has the game where they were eight thousand gold up at twenty-five minutes and lost at forty-two. It does not feel like a macro problem while it is happening; it feels like teammates, or a lucky pick, or the enemy scaling. Look at ten of those games and the same four events keep appearing, in the same order, and none of them are bad luck.",
    },
    {
      kind: "keyPoint",
      title: "A Baron is a battering ram, not a trophy",
      text: "The buff lasts three minutes and its entire purpose is that your minions become siege engines. If you take Baron and then walk to the enemy jungle to look for a fight, you have spent the objective on nothing. Take it, group on one lane, and push with the wave — the buff does the work and you do not have to win a fight to end.",
    },
    {
      kind: "table",
      caption: "The four ways it goes",
      head: ["The throw", "What it looks like", "The fix"],
      rows: [
        [
          "The greedy Baron",
          "You start it at 40% health with no vision because you are ahead",
          "Ahead means you can afford to set up properly, not that you can skip it",
        ],
        [
          "The face-check",
          "One person walks into fog to 'check', dies, and the fight starts 4v5",
          "Nobody walks alone after 25 minutes. Sweep instead of scouting with a body",
        ],
        [
          "The forgotten side wave",
          "Two super minion waves reach your inhibitor while you poke mid",
          "One player clears, always. A lead is not a reason to stop farming",
        ],
        [
          "The one more fight",
          "You win a fight, have the inhibitor open, and go looking for kills instead",
          "Take the structure. Kills respawn; an inhibitor stays down for five minutes",
        ],
      ],
    },
    { kind: "gate" },
    {
      kind: "prose",
      text: "The fourth row is the expensive one, because it happens at the moment the game was actually winnable. You win a fight at thirty minutes, three of them are dead for thirty seconds, and your team walks past the open inhibitor to chase the two survivors into their jungle. Thirty seconds later the respawns arrive, the fight restarts five-versus-five with your cooldowns gone, and the lead is smaller than it was before you won.",
    },
    {
      kind: "mistake",
      title: "Playing the lead instead of the map",
      text: "Being ahead makes every fight feel free, so you take fights you would never take even — into fog, without vision, at half health, because you are 'winning'. The gold lead is not a shield, and it is exactly what the enemy needs one pick to erase.",
      fix: "The correct feeling when you are ahead is boredom. Clear waves, take structures on the timers you already have, refuse everything that is not free, and let the enemy be the one who has to gamble. A won game closed slowly is still won.",
    },
    { kind: "drill", drillId: "closing-decision" },
    {
      kind: "keyPoint",
      title: "Structures, then kills, in that order",
      text: "After every won fight the first question is which structure is now free — turret, inhibitor, Baron. Answer it before anyone looks for another fight. This single rule closes more games than any amount of mechanical skill, because it converts a temporary advantage into a permanent one before it expires.",
    },
    { kind: "drill", drillId: "closing-quiz" },
  ],
  drills: [
    {
      id: "closing-decision",
      kind: "decision",
      situation:
        "34:00, you are 7,000 gold ahead. You have just won a fight mid: three of them are dead with thirty-five second timers, two escaped into their jungle at low health. Their mid inhibitor turret is open and Baron is up.",
      facts: [
        "7,000 gold ahead, 34:00",
        "3 enemies dead (35s), 2 alive and low",
        "Their mid inhibitor turret open",
        "Baron is up",
      ],
      options: [
        {
          id: "a",
          label: "Take the mid inhibitor turret and the inhibitor, then Baron if the timer allows",
          explain:
            "Correct. Structures first: the inhibitor is permanent for five minutes and it forces them to defend with the players who are still respawning. Baron with the survivors dead is a bonus, and it comes second because it expires and the inhibitor does not.",
          correct: true,
        },
        {
          id: "b",
          label: "Chase the two survivors into their jungle — kills now means a longer window",
          explain:
            "This is the fourth throw in the table. You are trading a certain structure for two kills in fog, and their respawn timer is running the whole time you are chasing.",
          correct: false,
        },
        {
          id: "c",
          label: "Baron first — it is the bigger objective",
          explain:
            "Baron is bigger in the abstract and worse here: it takes most of the respawn window and its whole purpose is to help you take the structure you could simply be taking right now, unopposed.",
          correct: false,
        },
        {
          id: "d",
          label: "Reset, buy, and come back with full items",
          explain:
            "The safest-looking option and the one that gives the lead away by inches. Their three deaths bought you a window; spending it in the shop means it never existed.",
          correct: false,
        },
      ],
    },
    {
      id: "closing-quiz",
      kind: "quiz",
      prompt: "You have Baron buff and a five-thousand gold lead. What are you supposed to do with the next three minutes?",
      options: [
        {
          id: "a",
          label: "Group on one lane and push with the wave until a structure falls",
          explain:
            "Correct. The buff makes your minions do the sieging, which means you can take a turret without ever winning a fight. One lane, together, with the wave — that is the entire instruction.",
          correct: true,
        },
        {
          id: "b",
          label: "Split into side lanes to apply pressure everywhere at once",
          explain:
            "Splitting throws away the one thing the buff gives you. Empowered minions matter where you are; five players in five places is five weak pushes and a pick waiting to happen.",
          correct: false,
        },
        {
          id: "c",
          label: "Hunt for picks in their jungle while the buff is up",
          explain:
            "The buff on a champion is small; the buff on a wave is a siege. Hunting spends three minutes of siege on the chance of a kill.",
          correct: false,
        },
        {
          id: "d",
          label: "Take the second drake stack while they cannot contest",
          explain:
            "Not wrong exactly, but it is the smaller prize and the clock is running. Structures do not expire — the Baron does.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "kda",
    direction: "increase",
    delta: 0.5,
    games: 3,
    instruction:
      "Next 3 games: after every won fight, say which structure is free before anyone chases. When you are ahead, refuse every fight that is not free — no face-checks alone after 25 minutes, and always one player clearing side waves.",
  },
};
