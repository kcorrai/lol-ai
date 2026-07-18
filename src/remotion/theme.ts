// Remotion runs in its own bundle (no Tailwind), so scenes use inline styles and
// these shared tokens. Champion icons are hotlinked from Data Dragon at render.
export const COLORS = {
  bg: "#0A0E1A",
  surface: "#0F1629",
  surface2: "#1A2138",
  border: "#2A3550",
  text: "#E8F0FF",
  muted: "#8899BB",
  accent: "#C89B3C",
  success: "#52B788",
  danger: "#E63946",
};

export const FONT = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const DDRAGON_VER = "15.14.1";
export const champSquare = (key: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VER}/img/champion/${key}.png`;
