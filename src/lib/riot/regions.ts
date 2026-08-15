/**
 * The platforms a player can be searched on, in the order the picker shows them.
 *
 * `value` is Riot's platform id, which is what our URLs and the Riot client both use; `label` is
 * what players call the server.
 */
export const REGIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "tr1", label: "TR" },
  { value: "euw1", label: "EUW" },
  { value: "eun1", label: "EUNE" },
  { value: "na1", label: "NA" },
  { value: "kr", label: "KR" },
  { value: "br1", label: "BR" },
  { value: "la1", label: "LAN" },
  { value: "la2", label: "LAS" },
  { value: "oc1", label: "OCE" },
  { value: "ru", label: "RU" },
  { value: "jp1", label: "JP" },
];

export const DEFAULT_REGION = "tr1";

/** The short label for a platform id, falling back to the id itself for anything unlisted. */
export function regionLabel(value: string): string {
  return REGIONS.find((r) => r.value === value)?.label ?? value.toUpperCase();
}
