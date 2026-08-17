import type { Lesson } from "@/domains/academy/types";

export const objectivesAndPlates: Lesson = {
  slug: "objectives-and-plates",
  trackId: "foundations",
  title: "Objectives & Turret Plates",
  summary:
    "Neutral objectives are the only permanent rewards in the game. Learn what each one is worth so you stop fighting over the cheap ones.",
  minutes: 5,
  access: "free",
  objectives: [
    "Rank the early objectives by what they are actually worth",
    "Know when turret plates expire and why that deadline matters",
    "Decide whether an objective is worth a fight before the fight starts",
  ],
  fixes: ["objective_neglect"],
  blocks: [
    {
      kind: "prose",
      text: "Kills expire. Waves expire. Objectives do not. A drake stack is on your champion for the rest of the game; a turret that falls does not come back. This is why teams that trade 'we take drake, you take a kill' are usually winning that trade by a mile, and why the last lesson of this track is about learning to want the boring thing.",
    },
    {
      kind: "table",
      caption: "The early objectives, ranked by what they are worth",
      head: ["Objective", "Window", "Real value"],
      rows: [
        ["Turret plates", "Until 14:00 — then gone forever", "160g each, and the turret is softened for later"],
        ["Outer turret", "Any time", "Permanent map space plus a global gold payout"],
        ["Drake stacks", "Every ~5 min", "Permanent stats; the soul at four stacks can decide the game"],
        ["Void grubs", "Early window only", "Serious extra damage to buildings for the next several minutes"],
        ["Rift Herald", "Mid-early window", "Effectively a free turret if used on a pushed lane"],
        ["Baron", "20:00+", "The siege window that ends games"],
      ],
    },
    {
      kind: "keyPoint",
      title: "Plates are on a timer and nothing else is",
      text: "Turret plates disappear at 14 minutes. That is the one deadline in the early game that never moves. Every other objective will come back around; the 160g sitting on the enemy turret will not. If you have a lead in lane and you are not spending it on plates before 14:00, you are letting the lead expire.",
    },
    {
      kind: "prose",
      text: "Notice that this reframes what 'winning lane' means. Winning lane is not being ahead in CS and kills at 14 minutes. Winning lane is having converted that into plates, a turret, or jungle pressure by 14 minutes — because at 14:01 the plate half of that option disappears and the lead has to be spent some other way.",
    },
    {
      kind: "mistake",
      title: "Fighting for an objective you cannot take",
      text: "Drake is up, both teams walk to the pit, and a 5v5 breaks out with nobody actually hitting the drake. Three people die on each side and the objective is still standing.",
      fix: "Before walking to an objective, answer two questions: can we start it, and can we finish it before they arrive? If the answer to either is no, the objective is not the play — take something on the opposite side of the map instead.",
    },
    { kind: "drill", drillId: "objective-quiz" },
    {
      kind: "prose",
      text: "That last idea — take something on the other side of the map — is called a trade, and it is the beginning of macro play. When the enemy commits five people to an objective you cannot contest, the correct answer is almost never to walk into them. It is to take the most valuable thing that is now undefended and make the exchange favourable.",
    },
    {
      kind: "checklist",
      title: "Objective checklist",
      items: [
        "Know the spawn timer of the next objective 30 seconds before it spawns, not when it appears",
        "Have vision on the approach before it spawns, not after",
        "Before 14:00, ask every time you win a lane fight: can I get a plate out of this?",
        "If you cannot contest, take the trade — do not walk into a fight you already lost",
      ],
    },
    { kind: "drill", drillId: "objective-order" },
  ],
  drills: [
    {
      id: "objective-quiz",
      kind: "quiz",
      prompt:
        "It is 13:30. You have just won a fight in your lane and the enemy laner is dead for 30 seconds. What is the highest-value thing you can do with those 30 seconds?",
      options: [
        {
          id: "a",
          label: "Take turret plates before 14:00",
          explain:
            "Correct. Plates vanish at 14:00 and this is your last window. 160g each, guaranteed, with the enemy off the map — nothing else available in 30 seconds beats it.",
          correct: true,
        },
        {
          id: "b",
          label: "Recall and buy",
          explain:
            "Your gold is not going anywhere; the plates are. Take the plates first, then recall on the crash.",
          correct: false,
        },
        {
          id: "c",
          label: "Roam to the next lane looking for another kill",
          explain:
            "Trading a guaranteed 300–600g in plates for a chance at another kill, with a 30-second deadline you cannot extend, is a bad exchange.",
          correct: false,
        },
      ],
    },
    {
      id: "objective-order",
      kind: "order",
      prompt:
        "Your team has 25 seconds of free time after winning a fight at 15 minutes. Order these by value, highest first.",
      items: [
        { id: "a", label: "Take the outer turret you are already standing next to" },
        { id: "b", label: "Take the drake that spawned 10 seconds ago" },
        { id: "c", label: "Place deep vision in the enemy jungle" },
        { id: "d", label: "Recall and buy" },
      ],
      correctOrder: ["b", "a", "c", "d"],
      explain:
        "A drake stack is permanent and contested — take it while they cannot. The turret is permanent too but it is not going anywhere and nobody else can claim it right now. Deep vision is the cheap thing you do on the way out. Recalling is what you do with the time left over, not with the window itself.",
    },
  ],
  assignment: {
    metric: "killParticipation",
    direction: "increase",
    delta: 5,
    games: 3,
    instruction:
      "Next 3 games: at 13:00, check the enemy turret in your lane. If plates are still up and you have any advantage at all, spend the next minute taking them. Note how many you get before 14:00.",
  },
};
