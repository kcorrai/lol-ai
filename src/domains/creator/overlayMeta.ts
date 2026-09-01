import { History, LayoutGrid, Swords, Target, Trophy, type LucideIcon } from "lucide-react";
import type { OverlayWidget } from "@/domains/creator/types";

// How each overlay presents itself in the catalogue.
//
// Kept beside the widget list rather than inside the catalogue component so the
// two cannot drift: adding a widget to OVERLAY_WIDGETS without describing it
// here is a type error.

export interface OverlayMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  /**
   * The width and height to give the OBS Browser Source. A browser source that
   * is too small crops the widget and too large leaves an invisible click
   * target over the scene, and OBS offers no way to derive it from the page —
   * so the number a creator has to type is printed on the card.
   */
  size: string;
}

export const OVERLAY_META: Record<OverlayWidget, OverlayMeta> = {
  rank: {
    label: "Rank & session LP",
    description: "Tier, LP, and what this session has done to it.",
    icon: Trophy,
    size: "320 × 140",
  },
  session: {
    label: "Session record",
    description: "Wins, losses and KDA since the session started.",
    icon: Swords,
    size: "320 × 140",
  },
  lastgame: {
    label: "Last game",
    description: "Champion, result and line from the last finished game.",
    icon: History,
    size: "420 × 130",
  },
  champions: {
    label: "Champion pool",
    description: "Your five most played champions this season.",
    icon: LayoutGrid,
    size: "460 × 220",
  },
  goal: {
    label: "Climb goal",
    description: "A progress bar toward the rank you are chasing.",
    icon: Target,
    size: "440 × 160",
  },
};
