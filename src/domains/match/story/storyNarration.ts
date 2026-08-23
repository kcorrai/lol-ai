import type { MatchStoryEvent } from "@/domains/match/types/matchStory.types";

/**
 * A Riot enum as a sentence fragment: `FIRE_DRAGON` becomes `Fire dragon`. Deliberately mechanical
 * — it renames nothing and invents nothing, so a monster or a lane Riot adds later reads sensibly
 * on its own instead of falling through to a placeholder.
 */
function humanise(value: string): string {
  const words = value.toLowerCase().replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** `TOP_LANE` is the lane, `TOP` is what a reader calls it. */
function laneName(laneType: string | null): string {
  if (!laneType) return "A";
  return humanise(laneType.replace(/_LANE$/, ""));
}

function actorName(event: MatchStoryEvent): string {
  return event.actor?.championName ?? "Someone";
}

/**
 * One story beat in one line, for the event feed. Every payload field on the wire is nullable —
 * the timeline is re-validated at read time and a row with a missing field is kept rather than
 * dropped (matchStoryEvents.ts) — so nothing here may assume a value is present.
 *
 * Wording is taste, not a load-bearing decision: see docs/design/la-52-match-story/README.md.
 */
export function describeStoryEvent(event: MatchStoryEvent): string {
  switch (event.kind) {
    case "CHAMPION_KILL":
      return `${actorName(event)} was taken down`;

    case "CHAMPION_SPECIAL_KILL": {
      // `killType` carries first blood and ace, which are not multi-kills and have no length.
      if (event.payload.killType === "KILL_FIRST_BLOOD") return `First blood — ${actorName(event)}`;
      if (event.payload.killType === "KILL_ACE") return `${actorName(event)} closed out an ace`;
      const length = event.payload.multiKillLength;
      return length ? `${actorName(event)} — ${length}-kill` : `${actorName(event)} — multi-kill`;
    }

    case "ELITE_MONSTER_KILL": {
      // The subtype is the interesting half for dragons (`FIRE_DRAGON`); Baron and Herald have none.
      const monster = event.payload.monsterSubType ?? event.payload.monsterType;
      return monster ? `${humanise(monster)} taken` : "Objective taken";
    }

    case "BUILDING_KILL": {
      const lane = laneName(event.payload.laneType);
      if (event.payload.buildingType === "INHIBITOR_BUILDING") return `${lane} inhibitor fell`;
      const tower = event.payload.towerType;
      return tower ? `${lane} ${humanise(tower).toLowerCase()} fell` : `${lane} structure fell`;
    }

    case "TURRET_PLATE_DESTROYED":
      return `${laneName(event.payload.laneType)} plate destroyed`;

    case "WARD_PLACED": {
      const ward = event.payload.wardType === "CONTROL_WARD" ? "a control ward" : "a ward";
      return `${actorName(event)} placed ${ward}`;
    }

    case "WARD_KILL":
      return `${actorName(event)} cleared a ward`;
  }
}

const BLUE_TEAM_ID = 100;

/**
 * The team gold difference as a reading: which side is up, and by how much. Grouped by hand rather
 * than through `toLocaleString`, which renders 12860 as "12.860" under a Turkish locale and would
 * make the same match read differently depending on who opened it.
 */
export function formatGoldDiff(teamGoldDiff: number): { text: string; teamId: number } {
  const grouped = Math.abs(teamGoldDiff)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const side = teamGoldDiff >= 0 ? "BLUE" : "RED";
  return {
    text: `${grouped}g ${side}`,
    teamId: teamGoldDiff >= 0 ? BLUE_TEAM_ID : 200,
  };
}
