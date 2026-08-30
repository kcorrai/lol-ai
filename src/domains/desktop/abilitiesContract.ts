import { z } from "zod";

// One champion's kit, as the desktop companion reads it (ADR-038 K6, ADR-042).
//
// A third file beside `contract.ts` and `championsContract.ts` rather than more of
// either, because both of them need this shape and neither owns it: the champion
// browser shows the kit of whatever is open, and the live and pregame screens show
// the kit of the lane opponent. Putting it in one and importing it into the other
// would make the live contract depend on the browser contract for no reason.
//
// Everything here is Data Dragon's own, resolved on the server. The app could reach
// Data Dragon itself — its content policy admits the image host — but not the
// catalogue: the JSON lives behind a `connect-src` this app does not have and has no
// reason to want. The server already holds that catalogue cached for its own champion
// pages, so one read here turns ids into words and URLs.

export const ABILITY_SLOTS = ["P", "Q", "W", "E", "R"] as const;
export type AbilitySlotKey = (typeof ABILITY_SLOTS)[number];

/**
 * One ability: what it is called, what it does, and the two assets that show it.
 *
 * `videoUrl` is Riot's own published preview clip. It is a URL rather than a flag
 * because the address is built from the *numeric* champion id, and the numeric id is
 * the one identifier this contract does not otherwise carry — the app keys everything
 * on the Data Dragon string id. Sending the finished address is cheaper than sending a
 * second identifier the app would only use to rebuild it.
 *
 * `cooldown`, `cost` and `range` are Riot's own burn strings ("14/13/12/11/10"), not
 * numbers: they are per-rank and the app prints them as written. Null where Data Dragon
 * gives a value that means "not applicable" — a passive has no cooldown, a self-cast has
 * no range — because a dash in a stat row is a fact and "0" is a wrong one.
 */
export const desktopAbilitySchema = z.object({
  slot: z.enum(ABILITY_SLOTS),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string(),
  videoUrl: z.string(),
  cooldown: z.string().nullable(),
  cost: z.string().nullable(),
  range: z.string().nullable(),
});
export type DesktopAbility = z.infer<typeof desktopAbilitySchema>;
