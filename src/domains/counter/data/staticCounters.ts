import { TOP_COUNTERS } from "./counters/top";
import { JUNGLE_COUNTERS } from "./counters/jungle";
import { MID_COUNTERS } from "./counters/mid";
import { BOT_COUNTERS } from "./counters/bot";
import { SUPPORT_COUNTERS } from "./counters/support";
import type { Position } from "@/types/common.types";
import type { GeneralCounterResult } from "../types/counter.types";

type StaticCounterData = Omit<GeneralCounterResult, "champion" | "role" | "generatedAt">;

function buildLookup(
  maps: [Position, Record<string, StaticCounterData>][]
): Record<string, Partial<Record<Position, StaticCounterData>>> {
  const result: Record<string, Partial<Record<Position, StaticCounterData>>> = {};
  for (const [role, roleMap] of maps) {
    for (const [champion, data] of Object.entries(roleMap)) {
      if (!result[champion]) result[champion] = {};
      result[champion][role] = data;
    }
  }
  return result;
}

const STATIC_COUNTER_DATA = buildLookup([
  ["TOP", TOP_COUNTERS],
  ["JUNGLE", JUNGLE_COUNTERS],
  ["MIDDLE", MID_COUNTERS],
  ["BOTTOM", BOT_COUNTERS],
  ["UTILITY", SUPPORT_COUNTERS],
]);

export function getStaticCounterData(
  champion: string,
  role: Position
): StaticCounterData | null {
  return STATIC_COUNTER_DATA[champion]?.[role] ?? null;
}
