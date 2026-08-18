export type CardType = "weekly" | "mastery" | "academy";

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

export type CardData = WeeklyCardData | MasteryCardData | AcademyCardData;
