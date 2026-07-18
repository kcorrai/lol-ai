export type CardType = "weekly" | "mastery";

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

export type CardData = WeeklyCardData | MasteryCardData;
