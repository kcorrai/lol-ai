import type { Lesson } from "@/domains/academy/types";

export const losingMatchups: Lesson = {
  slug: "losing-matchups",
  trackId: "top",
  title: "The Matchup You Cannot Win",
  summary:
    "Top lane is the most matchup-decided lane in the game. What an unplayable lane actually asks of you — which is almost never to outplay anybody.",
  minutes: 6,
  access: "pro",
  objectives: [
    "Tell a hard matchup apart from an unplayable one, and play each differently",
    "Convert a lost lane into a neutral one by moving the wave instead of the health bars",
    "Ban the champion that beats your champion, not the one that is loudest",
  ],
  fixes: ["high_deaths", "low_cs"],
  blocks: [
    {
      kind: "prose",
      text: "In every other lane, a bad matchup is an inconvenience. In top lane it is a fifteen-minute sentence, because there is no second player to change the maths and no jungler willing to walk that far to change it for you. Which is why the most valuable skill in the role is not outplaying a counterpick. It is knowing, at champion select, that you are not going to — and playing the next fifteen minutes as though that is a fact rather than an insult.",
    },
    {
      kind: "table",
      caption: "Three kinds of lane, three different games",
      head: ["Kind", "What it means", "What you play for"],
      rows: [
        ["Even", "Cooldowns decide trades", "Wave control and the first back"],
        ["Hard", "You lose short trades, win long ones — or the reverse", "Only the pattern you win; refuse the other one entirely"],
        ["Unplayable", "You lose every trade at every stage", "CS under turret, a freeze if you can get one, and nothing else"],
      ],
    },
    {
      kind: "keyPoint",
      title: "Unplayable means the fight is off the table, not the lane",
      text: "A lane you cannot win is still worth farming. Seven CS a minute under your own turret while they push into you is a completely acceptable game: you are even in gold and they are the one standing in a lane far from every objective. The lane is only lost when you die in it, and dying is the one thing you always get to decline.",
    },
    { kind: "drill", drillId: "matchup-quiz" },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Trying to win it back",
      text: "You die once at level three. Now you are behind in a matchup that was already bad, so you look for a way to make it back — you stand a little further up, you contest a wave you should have given, you take a trade because they are at sixty percent. You die twice more before ten minutes and the lane becomes a turret at eleven.",
      fix: "Losing a hard lane by twenty CS is normal. Losing it by three deaths is what actually decides the game — the shutdown gold is what makes them strong enough to matter elsewhere. After a death in a bad matchup, your target is zero more deaths, not the gold back.",
    },
    {
      kind: "keyPoint",
      title: "The freeze is the counterplay",
      text: "You cannot beat them in a trade, but you can decide where the minions stand. A wave frozen just outside your turret means they have to walk into your jungler's half of the map to touch it, and your jungler is the only one on the map who is closer to you than they are. That is the entire plan: turn a lane you lose into a lane that costs them something to be in.",
    },
    { kind: "drill", drillId: "matchup-decision" },
    {
      kind: "checklist",
      title: "The first three minutes of a lane you cannot win",
      items: [
        "Take the safe start and give the first wave rather than contesting level two",
        "Never stand where their strongest ability reaches you for free",
        "Set the wave so it settles on your side, then hold it there",
        "Tell your jungler it is unplayable early, once, and then never ping about it again",
        "Decide now what your first item is for — surviving, not winning",
      ],
    },
  ],
  drills: [
    {
      id: "matchup-quiz",
      kind: "quiz",
      prompt:
        "You are in a genuinely unplayable matchup. What is the best realistic outcome of the laning phase?",
      options: [
        {
          id: "a",
          label: "Roughly even CS, no deaths, and their jungler wasted time on a lane that was already won",
          explain:
            "Correct. Even gold and no shutdowns means the counterpick achieved nothing, and every minute their jungler spends helping a winning lane is a minute not spent on the two lanes that are actually close.",
          correct: true,
        },
        {
          id: "b",
          label: "Killing them once to swing the matchup back",
          explain:
            "This is the trap. Chasing the one kill is what turns a manageable twenty-CS deficit into three deaths and a turret at eleven minutes.",
          correct: false,
        },
        {
          id: "c",
          label: "Getting your jungler to camp the lane until you are ahead",
          explain:
            "You do not control that, and it is the most expensive help on the map. Asking for it repeatedly costs your jungler the game they could have won bot side.",
          correct: false,
        },
        {
          id: "d",
          label: "Roaming mid to make up the gold elsewhere",
          explain:
            "Leaving a lane you are losing gives them a free crash and plates. In an unplayable matchup your farm under turret is the thing keeping you in the game.",
          correct: false,
        },
      ],
    },
    {
      id: "matchup-decision",
      kind: "decision",
      situation:
        "6:30. You are two levels down in a matchup you cannot trade in. The wave is about to crash into your turret. Their jungler was last seen bottom side 30 seconds ago.",
      facts: [
        "You lose every trade at every health total",
        "Wave is crashing into your turret now",
        "You are 15 CS down, no deaths so far",
        "Their jungler is bot side",
      ],
      options: [
        {
          id: "a",
          label: "Let the wave bounce and set up a freeze just outside your turret",
          explain:
            "Correct. A frozen wave on your side is the only lane state that makes an unwinnable matchup survivable: you farm safely, they have to overextend to deny you, and the overextension is the first thing that has gone your way all game.",
          correct: true,
        },
        {
          id: "b",
          label: "Shove the wave into their turret and back for items",
          explain:
            "You cannot shove faster than they can in this matchup, and the attempt is a free trade for them. You would arrive back to a wave sitting on their side, which is exactly the state you cannot afford.",
          correct: false,
        },
        {
          id: "c",
          label: "Ping your jungler for a gank while their jungler is bottom",
          explain:
            "A gank into a lane where you are two levels down usually gives them a double. And a jungler who walks top while their jungler farms bot side is trading forty seconds for fifteen.",
          correct: false,
        },
        {
          id: "d",
          label: "Take a trade while the minions are on your side to force them back",
          explain:
            "You lose every trade at every health total — that is what unplayable means. The minions do not change the arithmetic here, they just change how quickly you find out.",
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
      "Next 3 games: name your matchup at champion select — even, hard or unplayable. In a hard or unplayable one, do not take a single trade before your first item, and give the first wave rather than contest it.",
  },
};
