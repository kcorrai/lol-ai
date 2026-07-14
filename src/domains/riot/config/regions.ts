export const RIOT_REGION_CONFIG = {
  euw1:  { label: "Western Europe (EUW)",          flag: "🇪🇺" },
  eun1:  { label: "Northern Europe (EUNE)",   flag: "🇪🇺" },
  tr1:   { label: "Turkey (TR)",                flag: "🇹🇷" },
  ru:    { label: "Russia (RU)",                  flag: "🇷🇺" },
  na1:   { label: "North America (NA)",          flag: "🇺🇸" },
  br1:   { label: "Brazil (BR)",               flag: "🇧🇷" },
  la1:   { label: "Latin America North (LAN)",   flag: "🌎" },
  la2:   { label: "Latin America South (LAS)",   flag: "🌎" },
  kr:    { label: "Korea (KR)",                   flag: "🇰🇷" },
  jp1:   { label: "Japan (JP)",                flag: "🇯🇵" },
  oc1:   { label: "Oceania (OCE)",             flag: "🇦🇺" },
} as const;

export type RiotRegion = keyof typeof RIOT_REGION_CONFIG;

export const RIOT_REGION_OPTIONS = Object.entries(RIOT_REGION_CONFIG).map(
  ([value, { label }]) => ({ value: value as RiotRegion, label })
);
