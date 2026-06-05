import type { TeamPicks } from "../types/draft.types";

const POSITION_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

function formatTeam(team: TeamPicks, _side: string): string {
  return Object.entries(team)
    .map(([pos, champ]) => `  ${POSITION_LABELS[pos] ?? pos}: ${champ}`)
    .join("\n");
}

export function buildDraftSystemPrompt(): string {
  return `Sen bir League of Legends draft analisti koçusun. İki takımın draft'ını analiz ederek takım kompozisyonlarını, win condition'larını ve scaling profillerini değerlendiriyorsun.

Yanıtlarını her zaman geçerli JSON formatında ver. Sadece saf JSON objesi döndür, markdown code block kullanma.`;
}

export function buildDraftUserPrompt(blueTeam: TeamPicks, redTeam: TeamPicks): string {
  return `Bu draft'ı analiz et:

Mavi Takım:
${formatTeam(blueTeam, "blue")}

Kırmızı Takım:
${formatTeam(redTeam, "red")}

Şu JSON formatında kapsamlı bir analiz yap:
{
  "blueTeamComposition": {
    "engagePower": 7,
    "disengagePower": 4,
    "teamfightPower": 8,
    "pickPotential": 5,
    "splitPushPower": 6,
    "summary": "Takım özeti"
  },
  "redTeamComposition": { ... aynı format ... },
  "blueWinConditions": [
    { "description": "Win condition açıklaması", "priority": "primary", "howToAchieve": "Nasıl kazanılır" }
  ],
  "redWinConditions": [ ... ],
  "blueScaling": {
    "earlyGame": { "score": 6, "description": "Erken oyun açıklaması" },
    "midGame": { "score": 8, "description": "..." },
    "lateGame": { "score": 5, "description": "..." }
  },
  "redScaling": { ... aynı format ... },
  "keyMatchups": [
    { "blue": "Mavi şampiyon", "red": "Kırmızı şampiyon", "advantage": "blue", "note": "Eşleşme notu" }
  ],
  "risks": [
    { "team": "blue", "risk": "Risk açıklaması", "severity": "high" }
  ],
  "verdict": "Tarafsız özet sonuç cümlesi"
}

Tüm sayısal değerler 1-10 arasında olmalı. keyMatchups maksimum 3 adet. Sadece JSON döndür.`;
}
