export type CardType = "weekly" | "mastery" | "academy" | "career";

export interface WeeklyCardData {
  cardType: "weekly";
  gameName: string;
  tagLine: string;
  lpDelta: number;
  winRate: number;
  gamesPlayed: number;
  bestChampionName: string;
  bestChampionWinRate: number;
  masteryScore: number | null;
  coachGrade: string | null;
  isPro: boolean;
}

export interface MasteryCardData {
  cardType: "mastery";
  gameName: string;
  tagLine: string;
  championName: string;
  championImageUrl: string;
  masteryScore: number;
  masteryTier: string;
  gamesPlayed: number;
  isPro: boolean;
}

/** A finished Academy track. Built from lesson progress, so it needs no Riot account at all. */
export interface AcademyCardData {
  cardType: "academy";
  displayName: string;
  trackTitle: string;
  lessonsTotal: number;
  lessonsMastered: number;
  finishedAt: string;
}

/**
 * A whole tracked career on one image. Deliberately says how deep the record goes
 * rather than implying it covers the player's whole time in the game — Riot serves
 * about two years of matches and no past seasons at all.
 */
export interface CareerCardData {
  cardType: "career";
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  trackedFrom: string;
  totalGames: number;
  totalHours: number;
  currentRank: string;
  peakRank: string;
  signatureChampion: string | null;
  signatureChampionGames: number;
  headline: string | null;
  isPro: boolean;
}

export type CardData = WeeklyCardData | MasteryCardData | AcademyCardData | CareerCardData;
