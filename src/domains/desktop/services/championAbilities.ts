import {
  abilityVideoUrl,
  getLatestDdragonVersion,
  passiveIconUrl,
  spellIconUrl,
  type AbilitySlot,
} from "@/lib/ddragon";
import {
  cleanAbilityText,
  fetchChampionDetail,
  type DdragonChampionDetail,
} from "@/lib/ddragon/championsData";
import { ABILITY_SLOTS, type DesktopAbility } from "@/domains/desktop/abilitiesContract";

// One champion's kit, for the desktop companion.
//
// Data Dragon is the only source here. Nothing is authored: the names, the prose and
// the three burn strings are Riot's own, and the clip is the preview Riot publishes for
// its own client. That is the whole reason this file is short — the alternative was a
// hand-written note per champion, which is 170 pieces of copy nobody would keep current
// and which would be wrong the patch after it was written.

/**
 * Riot's clip slots. The passive's clip is `P1`, and the four spells are `Q1`..`R1` —
 * the trailing 1 is the rank, and rank 1 is the only one published.
 */
const CLIP_SLOTS: Record<(typeof ABILITY_SLOTS)[number], AbilitySlot> = {
  P: "P1",
  Q: "Q1",
  W: "W1",
  E: "E1",
  R: "R1",
};

/**
 * Data Dragon writes "not applicable" as a value rather than as an absence: a self-cast
 * has range "self", a free ability has cost "0", and a passive has "0/0/0/0/0". Each of
 * those printed in a stat row is a wrong fact, so they become null and the row is
 * dropped instead.
 */
function meaningful(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "self") return null;
  if (/^0(\s*\/\s*0)*$/.test(trimmed)) return null;
  return trimmed;
}

function toAbilities(champion: DdragonChampionDetail, version: string): DesktopAbility[] {
  const passive: DesktopAbility = {
    slot: "P",
    name: champion.passive.name,
    description: cleanAbilityText(champion.passive.description),
    iconUrl: passiveIconUrl(version, champion.passive.image.full),
    videoUrl: abilityVideoUrl(champion.key, CLIP_SLOTS.P),
    cooldown: null,
    cost: null,
    range: null,
  };

  // Q/W/E/R are `spells` in order. A champion whose catalogue entry is short one spell
  // loses that row rather than the whole kit — an empty abilities panel is a worse
  // answer than a kit with a gap in it.
  const spells = ABILITY_SLOTS.slice(1).flatMap((slot, index): DesktopAbility[] => {
    const spell = champion.spells[index];
    if (!spell) return [];

    return [
      {
        slot,
        name: spell.name,
        description: cleanAbilityText(spell.description),
        iconUrl: spellIconUrl(version, spell.image.full),
        videoUrl: abilityVideoUrl(champion.key, CLIP_SLOTS[slot]),
        cooldown: meaningful(spell.cooldownBurn),
        cost: meaningful(spell.costBurn),
        range: meaningful(spell.rangeBurn),
      },
    ];
  });

  return [passive, ...spells];
}

/** What the catalogue says about a champion beyond its kit: its epithet and its classes. */
export interface ChampionIdentity {
  /** "The Nine-Tailed Fox". Null for a champion the catalogue could not be read for. */
  title: string | null;
  /** ["Mage", "Assassin"]. Empty rather than null — a list with nothing in it renders. */
  tags: string[];
  abilities: DesktopAbility[];
}

const NOTHING: ChampionIdentity = { title: null, tags: [], abilities: [] };

/**
 * The kit for one champion, by its Data Dragon id ("Ahri", "MonkeyKing").
 *
 * A catalogue that will not load costs the abilities panel and nothing else — every
 * caller spreads this over an answer it has already built, so the champion's numbers,
 * build and matchups are on screen either way. That is deliberate: this is the one part
 * of those screens that depends on a feed the rest of them do not.
 */
export async function readChampionIdentity(ddragonId: string): Promise<ChampionIdentity> {
  const [version, champion] = await Promise.all([
    getLatestDdragonVersion().catch(() => null),
    fetchChampionDetail(ddragonId).catch(() => null),
  ]);

  if (!version || !champion) return NOTHING;

  return {
    title: champion.title,
    tags: champion.tags,
    abilities: toAbilities(champion, version),
  };
}
