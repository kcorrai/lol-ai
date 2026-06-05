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
  "topCounters": [5 adet en güçlü counter şampiyonu],
  "easyCounters": [3 adet öğrenmesi kolay counter],
  "soloQueueCounters": [3 adet solo queue'da etkili counter],
  "tips": [3-5 adet genel ipucu string dizisi],
  "patchNote": "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir."
}

Her counter şampiyonu için şu alanları doldur:
{
  "champion": "şampiyonun adı",
  "difficulty": "easy" veya "medium" veya "hard",
  "reasonWhy": "neden iyi counter olduğunun kısa açıklaması",
  "laneAdvantage": "lane'de nasıl avantaj sağladığı",
  "watchOut": "dikkat edilmesi gereken durum veya yetenek",
  "buildHint": "önerilen core item veya item yolu",
  "tier": "S" veya "A" veya "B"
}

Sadece JSON döndür, başka açıklama ekleme.`;
}
