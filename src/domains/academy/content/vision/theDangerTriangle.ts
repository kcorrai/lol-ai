import type { Lesson } from "@/domains/academy/types";

export const theDangerTriangle: Lesson = {
  slug: "the-danger-triangle",
  trackId: "vision",
  title: "The Danger Triangle",
  summary:
    "You cannot see the enemy jungler. You can still work out the shape of where he might be, and standing outside that shape is most of what map awareness actually is.",
  minutes: 7,
  access: "pro",
  objectives: [
    "Turn a last-seen position and a clock into an area instead of a guess",
    "Cut that area in half with camp timers and lane pressure",
    "Pick where you stand from the triangle rather than from where the minions are",
  ],
  fixes: ["high_deaths", "low_vision"],
  blocks: [
    {
      kind: "prose",
      text: "Here is the thing nobody says out loud about map awareness: the players who have it are not seeing more than you. They are inferring more. The enemy jungler is invisible to both of you. One of you is treating that as no information and the other is treating it as an area on the map, and the area is what keeps you alive.",
    },
    {
      kind: "keyPoint",
      title: "Last seen, plus a clock, is a shape",
      text: "A champion walks about one screen every five seconds. So the jungler you saw at their red buff fifteen seconds ago can be anywhere inside roughly three screens of that spot — a triangle spreading out from where he was, narrowed by anything you have vision of. That triangle is the danger. Everything outside it is, for the next few seconds, free.",
    },
    {
      kind: "table",
      caption: "What the clock does to the triangle",
      head: ["Time since seen", "The shape", "What it means for you"],
      rows: [
        ["0–15s", "A narrow cone on his side of the map", "The far half of the map is genuinely safe. Push it."],
        ["15–30s", "Half the map, still weighted to where he was", "Safe to farm, not to walk into an unlit bush"],
        ["30s+", "The whole map, with no weighting", "Behave as if he is in the nearest bush to you until proven otherwise"],
      ],
    },
    {
      kind: "prose",
      text: "The second lever is the camps. Jungle routes are not random: a jungler who took their top-side buff at 3:20 has to spend the next ninety seconds on a route that respects respawn timers and their own health bar. If you saw him top at 3:20 and the drake is up at 5:00, the map has told you where he intends to be. This is why watching the enemy jungler clear once, early, is worth more than a ward — you learn the shape of his whole first cycle.",
    },
    { kind: "gate" },
    {
      kind: "mistake",
      title: "Treating 'last seen' as 'is'",
      text: "You saw him bottom forty seconds ago, so you play as if he is bottom. You push mid to their turret with impunity. He has been walking the entire time, and forty seconds is the whole map.",
      fix: "Last seen has an expiry date, and the date is about thirty seconds. Past that the position is not stale information, it is no information — the honest read is 'unknown', and unknown means you stand where being wrong costs you nothing.",
    },
    {
      kind: "mapFigure",
      caption: "One sighting, twenty seconds ago, and what it is worth",
      annotations: [
        {
          at: { x: 0.8, y: 0.56, r: 0.055 },
          label: "Where you saw him",
          tone: "neutral",
          note: "Their bottom-side jungle, twenty seconds ago. This is the only fact you own. Everything else on this map is arithmetic done on top of it.",
        },
        {
          at: { x: 0.58, y: 0.42, r: 0.06 },
          label: "Twenty seconds of walking",
          tone: "bad",
          note: "Not a point — a spread, and this is its middle. By the time the wave you are about to shove reaches their turret, he is somewhere in here, and the triangle points at whoever is pushed furthest.",
        },
        {
          at: { x: 0.21, y: 0.47, r: 0.055 },
          label: "The half twenty seconds cannot buy",
          tone: "good",
          note: "Your own top side. Standing here is not cowardice — it is the part of the map where being wrong about him is free, which is the only thing a guess is allowed to cost.",
        },
      ],
    },
    {
      kind: "prose",
      text: "There is a third input, and it is the one strong players use most: your own lane pressure. A jungler ganks lanes where the gank works. If your wave is sitting under your own turret, you are close to worthless as a target and the triangle effectively skips you — which is exactly why freezing is defensively strong. If your wave is crashing into their turret, you are the best gank on the map and the triangle points at you regardless of what the clock says.",
    },
    { kind: "drill", drillId: "triangle-map" },
    {
      kind: "keyPoint",
      title: "The triangle is a standing instruction, not a warning",
      text: "The point of working it out is not to be alarmed. It is to choose, in advance, which side of your lane you stand on, which bush you walk around instead of through, and whether this wave gets shoved or held. Awareness that arrives as fear is too late; awareness that arrives as a standing position is free.",
    },
    { kind: "drill", drillId: "triangle-decision" },
  ],
  drills: [
    {
      id: "triangle-map",
      kind: "map",
      prompt:
        "You are mid. The enemy jungler was last seen twenty-five seconds ago on the baron side of the map, taking his own buff there. Your wave is even. Click the bush you should not walk into right now.",
      options: [
        {
          id: "baron-river",
          label: "The baron-side river bush",
          explain:
            "Correct. Twenty-five seconds from that buff puts this bush squarely inside the triangle, and it is on the route he has to use to reach your lane from where you saw him. Walking in here is volunteering for the one gank the map has been advertising.",
          correct: true,
          at: { x: 0.42, y: 0.36, r: 0.07 },
        },
        {
          id: "drake-river",
          label: "The dragon-side river bush",
          explain:
            "This is the far side of his triangle at twenty-five seconds — reachable, but only by a walk that gives up his own half of the map. It is the safer of the two rivers, which is why your wave should be going that way.",
          correct: false,
          at: { x: 0.6, y: 0.66, r: 0.07 },
        },
        {
          id: "their-bot-jungle",
          label: "The entrance to their bottom jungle",
          explain:
            "Deep, and dangerous for other reasons, but not because of this jungler at this moment — he is a full map away from it and would have to walk past your vision to arrive.",
          correct: false,
          at: { x: 0.84, y: 0.6, r: 0.07 },
        },
        {
          id: "own-bot-tri",
          label: "Your own bottom tri-bush",
          explain:
            "Behind your own line and outside any triangle a jungler on the far side could reach without being seen twice on the way. Nothing about the last twenty-five seconds makes this dangerous.",
          correct: false,
          at: { x: 0.3, y: 0.86, r: 0.07 },
        },
      ],
    },
    {
      id: "triangle-decision",
      kind: "decision",
      situation:
        "7:10. You saw the enemy jungler on the dragon side of the map eight seconds ago. Your wave is about to crash into the enemy turret and you are on 70% health with your escape up.",
      facts: [
        "Enemy jungler seen dragon side 8 seconds ago",
        "Your wave crashing into their turret",
        "70% health, escape available",
        "You are the top laner; drake is not up for two minutes",
      ],
      options: [
        {
          id: "a",
          label: "Take the crash and the plate — eight seconds is a narrow cone and it does not reach you",
          explain:
            "Correct. This is what the triangle is for: at eight seconds the danger has a direction, and the direction is the other end of the map. Playing scared here gives up a plate for a threat that is physically unable to arrive in time.",
          correct: true,
        },
        {
          id: "b",
          label: "Back off — a crashed wave is a gank magnet whatever the clock says",
          explain:
            "True as a rule of thumb, wrong with this information. The rule exists because you usually do not know where he is. Right now you do, and the whole point of knowing is being allowed to take the greedy line.",
          correct: false,
        },
        {
          id: "c",
          label: "Ward the river first, then crash",
          explain:
            "The ward answers a question you have already answered with your eyes, and the four seconds it costs are four seconds of the window closing. Save the charge for the next cycle when the position has expired.",
          correct: false,
        },
        {
          id: "d",
          label: "Crash it and then push into their jungle while you have tempo",
          explain:
            "The first half is right and the second half spends the whole window plus the one after it. The cone narrows in your favour for a few seconds — take the plate and leave, do not go looking for the rest of it.",
          correct: false,
        },
      ],
    },
  ],
  assignment: {
    metric: "deathsPerGame",
    direction: "decrease",
    delta: 1.5,
    games: 3,
    instruction:
      "Next 3 games: every time you see the enemy jungler, say where and start counting. While the count is under 15 seconds, play the far side of the map greedily. Past 30, do not walk into an unwarded bush at all.",
  },
};
