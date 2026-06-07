export const RIOT_REGION_CONFIG = {
  euw1:  { label: "Batı Avrupa (EUW)",          flag: "🇪🇺" },
  eun1:  { label: "Kuzey Doğu Avrupa (EUNE)",   flag: "🇪🇺" },
  tr1:   { label: "Türkiye (TR)",                flag: "🇹🇷" },
  ru:    { label: "Rusya (RU)",                  flag: "🇷🇺" },
  na1:   { label: "Kuzey Amerika (NA)",          flag: "🇺🇸" },
  br1:   { label: "Brezilya (BR)",               flag: "🇧🇷" },
  la1:   { label: "Latin Amerika Kuzey (LAN)",   flag: "🌎" },
  la2:   { label: "Latin Amerika Güney (LAS)",   flag: "🌎" },
  kr:    { label: "Kore (KR)",                   flag: "🇰🇷" },
  jp1:   { label: "Japonya (JP)",                flag: "🇯🇵" },
  oc1:   { label: "Okyanusya (OCE)",             flag: "🇦🇺" },
} as const;

export type RiotRegion = keyof typeof RIOT_REGION_CONFIG;

export const RIOT_REGION_OPTIONS = Object.entries(RIOT_REGION_CONFIG).map(
  ([value, { label }]) => ({ value: value as RiotRegion, label })
);
