import { itemIconUrl, championIconUrl, summonerSpellUrl, keystoneIconUrl } from "@/lib/ddragon";

/**
 * The vocabulary of things an Academy lesson is allowed to show.
 *
 * A lesson names an asset by **slug**, never by numeric id and never by URL. A typo is then a
 * typecheck failure rather than a broken icon on a live page, and an item that a patch retires
 * is one line here instead of a hunt through sixty content files. Champions are the one open
 * set — there are too many to enumerate here, so `curriculum.test.ts` checks those names
 * against the Data Dragon snapshot instead.
 *
 * Nothing in this module may import from `types.ts`: `types.ts` imports *this*, and the lesson
 * model has to stay free of the barrel that drags Prisma into the browser bundle (ADR-025).
 */

export interface AcademyAsset {
  /** Data Dragon's own id for the thing — an item id, a summoner spell id, a perk id. */
  readonly id: number;
  /** Its name in game. Doubles as alt text and as the default label. */
  readonly name: string;
}

/** Items a lesson can point at. Ids verified against Data Dragon's item catalogue. */
export const ACADEMY_ITEMS = {
  // Vision — the whole Vision track hangs off these four
  "stealth-ward": { id: 3340, name: "Stealth Ward" },
  "farsight-alteration": { id: 3363, name: "Farsight Alteration" },
  "oracle-lens": { id: 3364, name: "Oracle Lens" },
  "control-ward": { id: 2055, name: "Control Ward" },

  // What you buy before the first wave
  "dorans-blade": { id: 1055, name: "Doran's Blade" },
  "dorans-ring": { id: 1056, name: "Doran's Ring" },
  "dorans-shield": { id: 1054, name: "Doran's Shield" },
  "dark-seal": { id: 1082, name: "Dark Seal" },
  cull: { id: 1083, name: "Cull" },
  "health-potion": { id: 2003, name: "Health Potion" },
  "refillable-potion": { id: 2031, name: "Refillable Potion" },
  "corrupting-potion": { id: 2033, name: "Corrupting Potion" },

  // Boots — the first back's real decision
  boots: { id: 1001, name: "Boots" },
  "berserkers-greaves": { id: 3006, name: "Berserker's Greaves" },
  "sorcerers-shoes": { id: 3020, name: "Sorcerer's Shoes" },
  "plated-steelcaps": { id: 3047, name: "Plated Steelcaps" },
  "mercurys-treads": { id: 3111, name: "Mercury's Treads" },
  "ionian-boots-of-lucidity": { id: 3158, name: "Ionian Boots of Lucidity" },

  // Jungle pets
  "scorchclaw-pup": { id: 1101, name: "Scorchclaw Pup" },
  "gustwalker-hatchling": { id: 1102, name: "Gustwalker Hatchling" },
  "mosstomper-seedling": { id: 1103, name: "Mosstomper Seedling" },

  // The support line — the role's whole income
  "world-atlas": { id: 3865, name: "World Atlas" },
  "runic-compass": { id: 3866, name: "Runic Compass" },
  "bounty-of-worlds": { id: 3867, name: "Bounty of Worlds" },

  // Components a power spike is actually made of
  sheen: { id: 3057, name: "Sheen" },
  "tear-of-the-goddess": { id: 3070, name: "Tear of the Goddess" },
  kindlegem: { id: 3067, name: "Kindlegem" },
  "caulfields-warhammer": { id: 3133, name: "Caulfield's Warhammer" },
  "executioners-calling": { id: 3123, name: "Executioner's Calling" },
  "quicksilver-sash": { id: 3140, name: "Quicksilver Sash" },

  // Finished items a lesson names as a spike
  "kraken-slayer": { id: 6672, name: "Kraken Slayer" },
  "blade-of-the-ruined-king": { id: 3153, name: "Blade of The Ruined King" },
  "infinity-edge": { id: 3031, name: "Infinity Edge" },
  "lord-dominiks-regards": { id: 3036, name: "Lord Dominik's Regards" },

  // Closing a won game
  "elixir-of-iron": { id: 2138, name: "Elixir of Iron" },
  "elixir-of-sorcery": { id: 2139, name: "Elixir of Sorcery" },
  "elixir-of-wrath": { id: 2140, name: "Elixir of Wrath" },
} as const satisfies Record<string, AcademyAsset>;

export type AcademyItemId = keyof typeof ACADEMY_ITEMS;

/** Summoner spells a lesson can point at. */
export const ACADEMY_SUMMONERS = {
  flash: { id: 4, name: "Flash" },
  teleport: { id: 12, name: "Teleport" },
  smite: { id: 11, name: "Smite" },
  ignite: { id: 14, name: "Ignite" },
  exhaust: { id: 3, name: "Exhaust" },
  heal: { id: 7, name: "Heal" },
  barrier: { id: 21, name: "Barrier" },
  cleanse: { id: 1, name: "Cleanse" },
  ghost: { id: 6, name: "Ghost" },
} as const satisfies Record<string, AcademyAsset>;

export type AcademySummonerId = keyof typeof ACADEMY_SUMMONERS;

/**
 * Keystones, for the lessons that teach a trading pattern by the rune that rewards it. The id
 * is the perk id, which `keystoneIconUrl` already resolves to an icon path.
 */
export const ACADEMY_KEYSTONES = {
  "press-the-attack": { id: 8005, name: "Press the Attack" },
  conqueror: { id: 8010, name: "Conqueror" },
  "fleet-footwork": { id: 8021, name: "Fleet Footwork" },
  "grasp-of-the-undying": { id: 8465, name: "Grasp of the Undying" },
  electrocute: { id: 9101, name: "Electrocute" },
  aftershock: { id: 8439, name: "Aftershock" },
  "first-strike": { id: 8369, name: "First Strike" },
  "dark-harvest": { id: 8128, name: "Dark Harvest" },
} as const satisfies Record<string, AcademyAsset>;

export type AcademyKeystoneId = keyof typeof ACADEMY_KEYSTONES;

/** One thing a figure shows. The `of` tag decides which catalogue the slug is read from. */
export type LessonAssetRef =
  | { of: "item"; item: AcademyItemId }
  | { of: "summoner"; spell: AcademySummonerId }
  | { of: "keystone"; keystone: AcademyKeystoneId }
  | { of: "champion"; name: string };

export interface ResolvedAsset {
  src: string;
  /** The asset's own name, so a figure never has to repeat it as a label. */
  name: string;
}

/** The image behind a reference. Total — every branch of the union resolves. */
export function resolveAsset(ref: LessonAssetRef): ResolvedAsset {
  switch (ref.of) {
    case "item": {
      const asset = ACADEMY_ITEMS[ref.item];
      return { src: itemIconUrl(asset.id), name: asset.name };
    }
    case "summoner": {
      const asset = ACADEMY_SUMMONERS[ref.spell];
      return { src: summonerSpellUrl(asset.id), name: asset.name };
    }
    case "keystone": {
      const asset = ACADEMY_KEYSTONES[ref.keystone];
      return { src: keystoneIconUrl(asset.id), name: asset.name };
    }
    case "champion":
      return { src: championIconUrl(ref.name), name: ref.name };
  }
}
