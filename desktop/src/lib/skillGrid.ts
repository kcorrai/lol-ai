/**
 * The skill order as a grid, which is the shape it is read in.
 *
 * A list of eighteen letters is a thing you have to count through. The grid every stats
 * site draws — one row per ability, one column per level, a mark where that ability is
 * levelled — is read at a glance, and reading it at a glance is the entire point when the
 * player is looking at it between waves.
 *
 * Pure, so the panel renders whatever the website sent and this decides nothing about
 * what a good order is.
 */

/** Rows, in the order every client and every stats site lists them. */
export const ABILITIES = ["Q", "W", "E", "R"] as const;
export type Ability = (typeof ABILITIES)[number];

/** Levels a champion has. The grid is always this wide, however short the order is. */
export const MAX_LEVEL = 18;

export interface SkillRow {
  ability: Ability;
  /**
   * One entry per level, `true` where this ability is levelled. Always `MAX_LEVEL` long:
   * a short order — op.gg publishes fifteen — leaves the tail empty rather than making
   * the row a different width from its neighbours.
   */
  levels: boolean[];
}

/**
 * `order[0]` is level one. Anything that is not one of the four abilities is skipped
 * rather than guessed at, so a letter this code does not know costs one empty column and
 * not a misdrawn row.
 */
export function skillGrid(order: readonly string[]): SkillRow[] {
  return ABILITIES.map((ability) => {
    const levels = Array<boolean>(MAX_LEVEL).fill(false);
    order.slice(0, MAX_LEVEL).forEach((letter, index) => {
      if (letter.trim().toUpperCase() === ability) levels[index] = true;
    });
    return { ability, levels };
  });
}

/**
 * Whether the order covers every level, which decides whether the panel says where it
 * stops. A fifteen-long order drawn on an eighteen-wide grid looks like a champion that
 * stops levelling at fifteen unless the panel says otherwise.
 */
export function isComplete(order: readonly string[]): boolean {
  return (
    order.filter((l) => (ABILITIES as readonly string[]).includes(l.trim().toUpperCase())).length >=
    MAX_LEVEL
  );
}
