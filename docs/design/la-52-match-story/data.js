/**
 * LA-52 mockup data — shaped exactly like the real `MatchStory` payload
 * (src/domains/match/types/matchStory.types.ts, added on card/la-51, not yet merged
 * into this branch). Generated once with a fixed seed so the mockup is reproducible,
 * not fetched — this file has no bearing on the real endpoint, it only feeds the demo.
 */
(function () {
  "use strict";

  // Deterministic PRNG (mulberry32) — Math.random() would make the mockup re-roll on
  // every reload, which makes it harder to talk about a specific screenshot.
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(52);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
  const BLUE_CHAMPS = ["Aatrox", "LeeSin", "Azir", "Jinx", "Thresh"];
  const RED_CHAMPS = ["Camille", "Vi", "Orianna", "Kaisa", "Nautilus"];
  const HANDLES = [
    ["Riftwalker", "NA1"],
    ["saltminer", "EUW"],
    ["azirmain", "TR1"],
    ["clickhead", "NA1"],
    ["ok boomer", "EUW"],
    ["hardstuck", "TR1"],
    ["ping9", "NA1"],
    ["freeloss", "EUW"],
    ["notaint", "TR1"],
    ["dc_pls", "NA1"],
  ];

  const SELF_PUUID = "puuid-blue-3"; // demo-only concept: whose seat the viewer is in. Not a
  // field on MatchStoryParticipant — the real page already knows this from the session.

  const participants = [];
  BLUE_CHAMPS.forEach((champ, i) => {
    participants.push({
      puuid: `puuid-blue-${i}`,
      championName: champ,
      teamId: 100,
      position: POSITIONS[i],
      gameName: HANDLES[i][0],
      tagLine: HANDLES[i][1],
    });
  });
  RED_CHAMPS.forEach((champ, i) => {
    participants.push({
      puuid: `puuid-red-${i}`,
      championName: champ,
      teamId: 200,
      position: POSITIONS[i],
      gameName: HANDLES[i + 5][0],
      tagLine: HANDLES[i + 5][1],
    });
  });

  const DURATION_MIN = 34;

  // Frames: one row per minute, per-player totals, matching MatchStoryFrame exactly.
  // Story arc for the demo: blue opens a small lead, red claws back through the mid game,
  // blue closes it out from ~26m — gives the chart real shape to scrub through.
  const frames = [];
  for (let m = 0; m <= DURATION_MIN; m++) {
    const arc = Math.sin((m / DURATION_MIN) * Math.PI * 1.15 - 0.4) * 2200 + m * 60;
    const players = participants.map((p, i) => {
      const role = POSITIONS[i % 5];
      const roleGoldRate = role === "UTILITY" ? 280 : role === "JUNGLE" ? 340 : 400;
      const side = p.teamId === 100 ? 1 : -1;
      const variance = (rand() - 0.5) * 120 * Math.min(m, 8);
      const totalGold = Math.max(
        500,
        Math.round(500 + m * roleGoldRate + side * arc * 0.4 + variance)
      );
      const level = Math.min(
        18,
        Math.max(1, Math.round(1 + m * 0.52 + (role === "UTILITY" ? -1.5 : 0)))
      );
      const csPerMin = role === "UTILITY" ? 0.4 : role === "JUNGLE" ? 4.6 : 7.4;
      const cs = Math.max(0, Math.round(m * csPerMin + (rand() - 0.5) * 4));
      return { puuid: p.puuid, totalGold, level, cs };
    });
    const blueTotal = players.filter((_, i) => i < 5).reduce((s, p) => s + p.totalGold, 0);
    const redTotal = players.filter((_, i) => i >= 5).reduce((s, p) => s + p.totalGold, 0);
    frames.push({
      minute: m,
      players,
      teamTotals: [
        { teamId: 100, totalGold: blueTotal },
        { teamId: 200, totalGold: redTotal },
      ],
      teamGoldDiff: blueTotal - redTotal,
    });
  }

  // Events — all seven stored kinds, deliberately uneven: wards cluster thick throughout
  // (the crowding problem the design has to solve), kills cluster around three skirmishes,
  // objectives and buildings land at recognisable game beats.
  const events = [];
  let ts = 0;
  function addEvent(minute, kind, actorPuuid, payload, posSeed) {
    const actor = actorPuuid ? participants.find((p) => p.puuid === actorPuuid) : null;
    const position = posSeed
      ? { x: Math.round(posSeed[0]), y: Math.round(posSeed[1]) }
      : { x: Math.round(rand() * 14870), y: Math.round(rand() * 14870) };
    events.push({
      kind,
      timestampMs: minute * 60000 + Math.round(rand() * 50000),
      minute,
      actor,
      position,
      payload,
    });
  }

  // Turret plates, pre-14m only (that's the real game rule).
  [
    [4, "red-3"],
    [6, "blue-2"],
    [9, "red-1"],
    [11, "blue-3"],
    [12, "red-0"],
    [13, "blue-1"],
  ].forEach(([m, actor]) => {
    const teamId = actor.startsWith("blue") ? 100 : 200;
    addEvent(m, "TURRET_PLATE_DESTROYED", `puuid-${actor}`, {
      teamId,
      laneType: pick(["TOP_LANE", "MID_LANE", "BOT_LANE"]),
    });
  });

  // Wards — dense, low-signal, spread across the whole match. This is the volume problem.
  for (let m = 1; m < DURATION_MIN; m++) {
    const count = m < 15 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      if (rand() < 0.55) {
        const actor = pick(participants);
        addEvent(m, rand() < 0.8 ? "WARD_PLACED" : "WARD_KILL", actor.puuid, {
          wardType: pick(["YELLOW_TRINKET", "CONTROL_WARD", "BLUE_TRINKET"]),
        });
      }
    }
  }

  // Three skirmishes with multi-kills.
  function skirmish(minute, killerSide, positions) {
    const killers = participants.filter((p) => p.teamId === killerSide);
    const victims = participants.filter((p) => p.teamId !== killerSide);
    const n = Math.min(positions.length, victims.length);
    for (let i = 0; i < n; i++) {
      const killer = pick(killers);
      const victim = victims[i];
      addEvent(
        minute,
        "CHAMPION_KILL",
        victim.puuid,
        {
          killerId: null,
          killerPuuid: killer.puuid,
          assistingParticipantIds: [],
          bounty: 150 + Math.round(rand() * 150),
        },
        positions[i]
      );
    }
    if (n >= 2) {
      addEvent(
        minute,
        "CHAMPION_SPECIAL_KILL",
        killers[0].puuid,
        {
          killType: "KILL_MULTI",
          multiKillLength: n,
        },
        positions[0]
      );
    }
  }
  skirmish(9, 200, [
    [7400, 8600],
    [7900, 8100],
  ]);
  skirmish(18, 100, [
    [9200, 10400],
    [9700, 9900],
    [10100, 9400],
  ]);
  skirmish(27, 100, [
    [11200, 4800],
    [10800, 5200],
  ]);

  // A handful of solo kills scattered elsewhere.
  [
    [6, 100],
    [13, 200],
    [21, 200],
    [24, 100],
    [30, 100],
  ].forEach(([m, side]) => {
    const killer = pick(participants.filter((p) => p.teamId === side));
    const victim = pick(participants.filter((p) => p.teamId !== side));
    addEvent(m, "CHAMPION_KILL", victim.puuid, {
      killerId: null,
      killerPuuid: killer.puuid,
      assistingParticipantIds: [],
      bounty: 300,
    });
  });

  // Objectives.
  addEvent(
    9,
    "ELITE_MONSTER_KILL",
    "puuid-red-1",
    { monsterType: "DRAGON", monsterSubType: "INFERNAL_DRAGON", killerTeamId: 200 },
    [8100, 3300]
  );
  addEvent(
    19,
    "ELITE_MONSTER_KILL",
    "puuid-blue-1",
    { monsterType: "RIFTHERALD", monsterSubType: null, killerTeamId: 100 },
    [10300, 8700]
  );
  addEvent(
    22,
    "ELITE_MONSTER_KILL",
    "puuid-blue-1",
    { monsterType: "DRAGON", monsterSubType: "INFERNAL_DRAGON", killerTeamId: 100 },
    [8100, 3300]
  );
  addEvent(
    29,
    "ELITE_MONSTER_KILL",
    "puuid-blue-1",
    { monsterType: "BARON_NASHOR", monsterSubType: null, killerTeamId: 100 },
    [4900, 10600]
  );

  // Buildings — from ~14m on, blue eventually closes it out.
  [
    [14, 200, "TOP_LANE"],
    [16, 100, "BOT_LANE"],
    [20, 200, "MID_LANE"],
    [25, 100, "TOP_LANE"],
    [28, 100, "MID_LANE"],
    [31, 100, "BOT_LANE"],
    [33, 100, "MID_LANE"],
  ].forEach(([m, victTeam, lane]) => {
    addEvent(m, "BUILDING_KILL", null, {
      teamId: victTeam === 100 ? 200 : 100,
      buildingType: "TOWER_BUILDING",
      laneType: lane,
      towerType: pick(["OUTER_TURRET", "INNER_TURRET", "BASE_TURRET"]),
    });
  });

  events.sort((a, b) => a.timestampMs - b.timestampMs);

  window.MATCH_STORY_MOCK = {
    hasTimeline: true,
    participants,
    frames,
    events,
    meta: { durationMin: DURATION_MIN, selfPuuid: SELF_PUUID, result: "Victory" },
  };
  window.MATCH_STORY_MOCK_EMPTY = { hasTimeline: false };
})();
