import type { Position } from "@/types/common.types";

export function buildCounterSystemPrompt(): string {
  return `Sen bir League of Legends uzman koçusun. Görevin, verilen şampiyona karşı en etkili counter pick'leri analiz etmek ve oyuncuya pratik tavsiyeler vermektir.

Yanıtlarını her zaman geçerli JSON formatında ver. Markdown code block kullanma, sadece saf JSON objesi döndür.

ÖNEMLİ: Bu analiz AI tahminidir, gerçek win rate verisi değildir. Oyunculara bu bilgiyi iletmek için patchNote alanını kullan.`;
}

const ROLE_LABELS: Record<Position, string> = {
  TOP: "Top Lane",
  JUNGLE: "Jungle",
  MIDDLE: "Mid Lane",
  BOTTOM: "Bot Lane (ADC)",
  UTILITY: "Support",
};

export function buildCounterUserPrompt(champion: string, role: Position): string {
  const roleLabel = ROLE_LABELS[role];

  return `${champion} oynayan bir ${roleLabel} oyuncusuna karşı en iyi counter pick'leri analiz et.

Yanıtı şu JSON formatında ver:
{
  "topCounters": [5 adet en güçlü counter],
  "easyCounters": [3 adet öğrenmesi kolay counter],
  "soloQueueCounters": [3 adet solo queue'da etkili counter],
  "tips": [3-5 adet genel ipucu],
  "patchNote": "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir."
}

Her counter için şu alanları doldur:
{
  "champion": "şampiyonun adı (İngilizce, tam olarak)",
  "difficulty": "easy" veya "medium" veya "hard",
  "tier": "S" veya "A" veya "B" veya "C",
  "winRate": tahmini kazanma oranı sayı olarak (örn: 54.2),
  "reasonWhy": "2-3 cümle: neden güçlü counter olduğu, temel mekanizması ve ${champion}'a karşı nasıl avantaj sağladığı",
  "laneAdvantage": "lane'de nasıl avantaj sağladığı, hangi pozisyonlarda baskı kurduğu",
  "watchOut": "${champion}'un hangi yeteneğinden veya durumundan kaçınılmalı",
  "buildHint": "önerilen temel item yolu (kısa)",
  "keyItems": ["item1", "item2", "item3"],
  "lanePhases": {
    "early": "Strong" veya "Even" veya "Weak",
    "mid": "Strong" veya "Even" veya "Weak",
    "late": "Strong" veya "Even" veya "Weak"
  },
  "runeAdvice": {
    "keystone": "Conqueror",
    "primaryPath": "Precision",
    "secondaryPath": "Sorcery"
  },
  "commonMistakes": ["hata1", "hata2", "hata3"],
  "winConditions": ["koşul1", "koşul2", "koşul3"]
}

Sadece JSON döndür, başka açıklama ekleme.`;
}
