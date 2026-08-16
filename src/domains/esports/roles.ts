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

export function roleLabel(role: PlayerRole | null): string | null {
  return role ? ROLE_LABEL[role] : null;
}
