import { DDRAGON_VERSION } from "@/lib/ddragonVersion";

const SUMMONER_SPELL_NAMES: Record<number, string> = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  13: "SummonerMana",
  14: "SummonerDot",
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  32: "SummonerSnowball",
  39: "SummonerCherry",
};

const RUNE_PATH_ICONS: Record<number, string> = {
  8000: "7201_Precision",
  8100: "7200_Domination",
  8200: "7202_Sorcery",
  8300: "7203_Whimsy",
  8400: "7204_Resolve",
};

export function runePathIconUrl(styleId: number): string {
  const name = RUNE_PATH_ICONS[styleId];
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${name}.png`;
}

const KEYSTONE_PATHS: Record<number, string> = {
  8005: "Styles/Precision/PressTheAttack/PressTheAttack.png",
  8008: "Styles/Precision/LethalTempo/LethalTempoTemp.png",
  8021: "Styles/Precision/FleetFootwork/FleetFootwork.png",
  8010: "Styles/Precision/Conqueror/Conqueror.png",
  9101: "Styles/Domination/Electrocute/Electrocute.png",
  9111: "Styles/Domination/Predator/Predator.png",
  8128: "Styles/Domination/DarkHarvest/DarkHarvest.png",
  9923: "Styles/Domination/HailOfBlades/HailOfBlades.png",
  8214: "Styles/Sorcery/SummonAery/SummonAery.png",
  8229: "Styles/Sorcery/ArcaneComet/ArcaneComet.png",
  8230: "Styles/Sorcery/PhaseRush/PhaseRush.png",
  8351: "Styles/Inspiration/GlacialAugment/GlacialAugment.png",
  8360: "Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png",
  8369: "Styles/Inspiration/FirstStrike/FirstStrike.png",
  8465: "Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png",
  8439: "Styles/Resolve/VeteranAftershock/VeteranAftershock.png",
  8242: "Styles/Resolve/Guardian/Guardian.png",
};

export function keystoneIconUrl(perkId: number): string {
  const path = KEYSTONE_PATHS[perkId];
  if (!path) return "";
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/${path}`;
}

export function summonerSpellUrl(spellId: number): string {
  const name = SUMMONER_SPELL_NAMES[spellId];
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/${name}.png`;
}

const KEYSTONE_ID_BY_NAME: Record<string, number> = {
  "Press the Attack": 8005,
  "Lethal Tempo": 8008,
  "Fleet Footwork": 8021,
  Conqueror: 8010,
  Electrocute: 9101,
  Predator: 9111,
  "Dark Harvest": 8128,
  "Hail of Blades": 9923,
  "Summon Aery": 8214,
  "Arcane Comet": 8229,
  "Phase Rush": 8230,
  "Glacial Augment": 8351,
  "Unsealed Spellbook": 8360,
  "First Strike": 8369,
  "Grasp of the Undying": 8465,
  Aftershock: 8439,
  Guardian: 8242,
};

const RUNE_PATH_ID_BY_NAME: Record<string, number> = {
  Precision: 8000,
  Domination: 8100,
  Sorcery: 8200,
  Inspiration: 8300,
  Resolve: 8400,
};

export function keystoneIconUrlByName(name: string): string {
  const id = KEYSTONE_ID_BY_NAME[name];
  return id ? keystoneIconUrl(id) : "";
}

export function runePathIconUrlByName(name: string): string {
  const id = RUNE_PATH_ID_BY_NAME[name];
  return id ? runePathIconUrl(id) : "";
}
