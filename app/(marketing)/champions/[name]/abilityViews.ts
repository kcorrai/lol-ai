import {
  spellIconUrl,
  passiveIconUrl,
  abilityVideoUrl,
  type AbilitySlot,
} from "@/lib/ddragon";
import { cleanAbilityText, type DdragonChampionDetail } from "@/lib/ddragon/championsData";
import type { AbilityView } from "./ChampionAbilities";

const SLOTS: { slot: AbilityView["slot"]; video: AbilitySlot }[] = [
  { slot: "P", video: "P1" }, { slot: "Q", video: "Q1" }, { slot: "W", video: "W1" },
  { slot: "E", video: "E1" }, { slot: "R", video: "R1" },
];

const keepRange = (v: string) => (v && v !== "self" && v !== "0" ? v : undefined);
const keepCost = (v: string) => (v && v !== "0" && !/^0(\/0)*$/.test(v) ? v : undefined);

// Shapes the champion's passive + Q/W/E/R into display models for ChampionAbilities.
export function buildAbilityViews(champ: DdragonChampionDetail, version: string): AbilityView[] {
  return SLOTS.map(({ slot, video }, i): AbilityView | null => {
    if (slot === "P") {
      return {
        slot,
        name: champ.passive.name,
        description: cleanAbilityText(champ.passive.description),
        iconUrl: passiveIconUrl(version, champ.passive.image.full),
        videoUrl: abilityVideoUrl(champ.key, video),
      };
    }
    const spell = champ.spells[i - 1];
    if (!spell) return null;
    return {
      slot,
      name: spell.name,
      description: cleanAbilityText(spell.description),
      iconUrl: spellIconUrl(version, spell.image.full),
      videoUrl: abilityVideoUrl(champ.key, video),
      cooldown: keepRange(spell.cooldownBurn),
      cost: keepCost(spell.costBurn),
      range: keepRange(spell.rangeBurn),
    };
  }).filter((a): a is AbilityView => a !== null);
}
