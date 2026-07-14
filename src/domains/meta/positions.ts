import type { CanonicalPosition } from "@/domains/meta/types";

export const ALL_POSITIONS: CanonicalPosition[] = [
  "TOP",
  "JUNGLE",
  "MIDDLE",
  "BOTTOM",
  "UTILITY",
];

export const POSITION_LABELS: Record<CanonicalPosition, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
};

// Accepts canonical values plus common aliases (mid/adc/bottom/sup) and returns
// the canonical position, or null if unrecognised.
export function parsePosition(raw: string | null | undefined): CanonicalPosition | null {
  if (!raw) return null;
  const v = raw.toUpperCase();
  switch (v) {
    case "TOP":
      return "TOP";
    case "JUNGLE":
    case "JG":
      return "JUNGLE";
    case "MIDDLE":
    case "MID":
      return "MIDDLE";
    case "BOTTOM":
    case "BOT":
    case "ADC":
      return "BOTTOM";
    case "UTILITY":
    case "SUPPORT":
    case "SUP":
    case "SUPP":
      return "UTILITY";
    default:
      return null;
  }
}
