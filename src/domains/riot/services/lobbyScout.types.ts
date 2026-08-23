import type { PreviewMastery } from "@/types/preview";

/** One player in a pasted lobby, scouted as cheaply as saying something true allows. */
export interface LobbyPlayer {
  riotId: string;
  gameName: string;
  tagLine: string;
  /** Null when Riot has no such player — a typo, or the wrong platform. */
  found: boolean;
  summonerLevel: number | null;
  profileIconId: number | null;
  rank: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
    winRate: number; // 0-100, rounded
  } | null;
  /** Their most-played champions of all time, richest mastery first. */
  mastery: PreviewMastery[];
}

export interface LobbyScout {
  region: string;
  players: LobbyPlayer[];
}
