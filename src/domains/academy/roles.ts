import type { Position } from "@prisma/client";
import type { RoleId } from "@/domains/academy/types";

// The Academy names roles the way players do; the database names them the way Riot does.
// The translation lives here and nowhere else. The Prisma import is type-only on purpose —
// `types.ts` and everything a client component touches must stay free of the Prisma runtime
// (ADR-025), so the enum is never used as a value in this file either.

const FROM_POSITION: Record<Position, RoleId> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "mid",
  BOTTOM: "adc",
  UTILITY: "support",
};

export const ROLE_IDS: readonly RoleId[] = ["top", "jungle", "mid", "adc", "support"];

/** How a role is written wherever the player reads it. */
export const ROLE_LABEL: Record<RoleId, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  adc: "ADC",
  support: "Support",
};

const TO_POSITION: Record<RoleId, Position> = {
  top: "TOP",
  jungle: "JUNGLE",
  mid: "MIDDLE",
  adc: "BOTTOM",
  support: "UTILITY",
};

export function roleFromPosition(position: Position | null): RoleId | null {
  return position ? FROM_POSITION[position] : null;
}

export function positionFromRole(role: RoleId): Position {
  return TO_POSITION[role];
}
