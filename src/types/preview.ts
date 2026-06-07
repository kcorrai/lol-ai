export interface PreviewMatch {
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  position: string;
}

export interface PreviewChampion {
  championName: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface PreviewResponse {
  summoner: {
    gameName: string;
    tagLine: string;
    summonerLevel: number;
    profileIconId: number;
  };
  rank: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
  } | null;
  recentMatches: PreviewMatch[];
  topChampions: PreviewChampion[];
  aiInsight: string;
}
