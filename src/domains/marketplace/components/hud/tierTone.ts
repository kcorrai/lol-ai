// The rank scale from `tailwind.config.ts`, as raw hex. Glows are mixed in inline
// styles (a radial gradient cannot take a Tailwind class), so the values have to
// exist in script too. Game-domain colour, never the brand accent (ADR-015).
const TIER_HEX: Record<string, string> = {
  IRON: "#8C8C8C",
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFC24B",
  PLATINUM: "#00C0A0",
  EMERALD: "#50C878",
  DIAMOND: "#B9F2FF",
  MASTER: "#9B59B6",
  GRANDMASTER: "#E74C3C",
  CHALLENGER: "#F1C40F",
};

/** A tier's colour at the given opacity; a neutral line grey for no tier at all. */
export function tierTint(tier: string | null | undefined, alpha: number): string {
  const hex = (tier && TIER_HEX[tier]) || "#456460";
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
