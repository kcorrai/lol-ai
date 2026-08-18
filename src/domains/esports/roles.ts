import type { PlayerRole } from "@/domains/esports/types";

/**
 * How a lane is written for a reader — and, on player pages, for `jobTitle` in
 * the `Person` markup. Shared so the visible label and the structured data can
 * never disagree about what a player does.
 */
export const ROLE_LABEL: Record<PlayerRole, string> = {
  top: "Top laner",
  jungle: "Jungler",
  mid: "Mid laner",
  bottom: "Bot laner",
  support: "Support",
};

/**
 * The same five lanes in the width a column header or a chip has for them.
 *
 * Separate from `ROLE_LABEL` rather than derived from it: "Bot laner" truncated
 * is "Bot lan…", and a table that has to abbreviate its own labels at render
 * time abbreviates them differently in every column.
 */
export const ROLE_SHORT: Record<PlayerRole, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  bottom: "Bot",
  support: "Support",
};

export function roleLabel(role: PlayerRole | null): string | null {
  return role ? ROLE_LABEL[role] : null;
}
