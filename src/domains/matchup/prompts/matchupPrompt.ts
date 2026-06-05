import type { Position } from "@/types/common.types";

export function buildMatchupSystemPrompt(): string {
  return `Sen bir League of Legends uzman koçusun. Verilen iki şampiyon arasındaki lane matchup'ını derinlemesine analiz ediyorsun.

Yanıtlarını her zaman geçerli JSON formatında ver. Markdown code block kullanma, sadece saf JSON objesi döndür.

ÖNEMLİ: Bu analiz AI tahminidir, gerçek maç istatistikleri değildir. patchNote alanını bu uyarı için kullan.`;
}

const ROLE_LABELS: Record<Position, string> = {
  TOP: "Top Lane",
  JUNGLE: "Jungle",
  MIDDLE: "Mid Lane",
  BOTTOM: "Bot Lane (ADC)",
  UTILITY: "Support",
};

export function buildMatchupUserPrompt(
  champion: string,
  opponent: string,
  role: Position
): string {
  const roleLabel = ROLE_LABELS[role];

  return `${roleLabel}'da ${champion} olarak ${opponent}'a karşı oynuyorsun. Bu matchup'ı dört bölümde analiz et.

Yanıtı şu JSON formatında ver:
{
  "laneAnalysis": {
    "advantage": "favorable" veya "unfavorable" veya "even",
    "summary": "matchup'ın genel özeti",
    "levels1to3": "erken seviyelerde ne yapmalısın",
    "level6Plan": "6. seviyede plan ve değişen dinamikler",
    "powerSpikes": [
      { "level": 6, "description": "R ile güçleniyor" },
      { "item": "Trinity Force", "description": "Core item sonrası güçlü" }
    ]
  },
  "tradeGuide": {
    "shortTrade": {
      "scenario": "kısa trade senaryosu",
      "advantage": "you" veya "opponent" veya "even",
      "tip": "nasıl yaklaşmalısın"
    },
    "longTrade": {
      "scenario": "uzun trade senaryosu",
      "advantage": "you" veya "opponent" veya "even",
      "tip": "nasıl yaklaşmalısın"
    },
    "winConditions": ["kazanma koşulu 1", "kazanma koşulu 2"],
    "loseConditions": ["kaybetme durumu 1", "kaybetme durumu 2"]
  },
  "buildAdvice": {
    "startingItems": ["başlangıç eşyası 1"],
    "coreItems": ["core eşya 1", "core eşya 2", "core eşya 3"],
    "situationalItems": ["durumsal eşya 1", "durumsal eşya 2"],
    "reasoning": "bu build'i neden seçmelisin"
  },
  "runeAdvice": {
    "keystone": "Conqueror",
    "primaryPath": "Precision",
    "secondaryPath": "Sorcery"
  },
  "criticalMistakes": {
    "avoidTrades": ["kaçınılacak trade 1", "kaçınılacak trade 2"],
    "riskyTimings": ["riskli timing 1"],
    "keyMistakes": ["kritik hata 1", "kritik hata 2"]
  },
  "patchNote": "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir."
}

Sadece JSON döndür, başka açıklama ekleme.`;
}
