/**
 * The zones a reader can pin kickoff times to.
 *
 * The browser's own zone is right for nearly everyone, so this is a short list
 * of where esports is watched from and broadcast in — enough to read a Korean
 * schedule in Seoul time or plan around a European evening — rather than all
 * four hundred IANA names.
 */
export const TIME_ZONE_CHOICES: { zone: string; label: string }[] = [
  { zone: "UTC", label: "UTC" },
  { zone: "Europe/London", label: "London" },
  { zone: "Europe/Berlin", label: "Berlin" },
  { zone: "Europe/Istanbul", label: "Istanbul" },
  { zone: "Asia/Seoul", label: "Seoul" },
  { zone: "Asia/Shanghai", label: "Shanghai" },
  { zone: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh" },
  { zone: "America/New_York", label: "New York" },
  { zone: "America/Los_Angeles", label: "Los Angeles" },
  { zone: "America/Sao_Paulo", label: "São Paulo" },
];

/** "Seoul" for a listed zone, the IANA name otherwise, "your zone" for none. */
export function timeZoneLabel(zone: string | null): string {
  if (!zone) return "your zone";
  return TIME_ZONE_CHOICES.find((choice) => choice.zone === zone)?.label ?? zone;
}
