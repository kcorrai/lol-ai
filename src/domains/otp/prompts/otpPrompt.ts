import type { Position } from "@/types/common.types";

export function buildOtpSystemPrompt(champion: string): string {
  return `Sen ${champion} konusunda uzmanlaşmış bir OTP koçusun. Bu şampiyonu yüzlerce saat oynadın, her matchup'ı, her gizli mekaniği ve her meta değişikliğini biliyorsun.

Yanıtlarını her zaman geçerli JSON formatında ver. Markdown code block kullanma, sadece saf JSON objesi döndür.

Casual bir overview değil — sadece gerçek OTP oyuncularının bildiği derinlemesine analizler sun.`;
}

const ROLE_LABELS: Record<Position, string> = {
  TOP: "Top Lane",
  JUNGLE: "Jungle",
  MIDDLE: "Mid Lane",
  BOTTOM: "Bot Lane (ADC)",
  UTILITY: "Support",
};

export function buildOtpUserPrompt(champion: string, role: Position): string {
  const roleLabel = ROLE_LABELS[role];

  return `${roleLabel}'da ${champion} için kapsamlı bir OTP rehberi oluştur.

Yanıtı şu JSON formatında ver:
{
  "matchupTierList": {
    "easy": [en az 5 kolay matchup — düşük skill gereksinimli, sen avantajlısın],
    "medium": [en az 5 eşit matchup — dikkat gerektiriyor],
    "hard": [en az 5 zor matchup — lane kaybedebilirsin]
  },
  "banPriority": [
    { "champion": "isim", "priority": 1, "reason": "neden ban öncelikli" },
    { "champion": "isim", "priority": 2, "reason": "neden" },
    { "champion": "isim", "priority": 3, "reason": "neden" }
  ],
  "hiddenMechanics": [
    "3-5 adet gizli mekanik veya interact — casual oyuncuların bilmediği şeyler"
  ],
  "powerSpikes": [
    { "trigger": "Level 6", "description": "açıklama" },
    { "trigger": "Trinity Force", "description": "açıklama" }
  ],
  "laneStrategies": [
    "3-5 adet lane stratejisi ipucu"
  ],
  "metaRating": {
    "score": 7,
    "assessment": "Güçlü / Orta / Zayıf / Broken",
    "reasoning": "bu metada neden bu puana layık",
    "patchContext": "son patch değişiklikleri bağlamı"
  }
}

Her matchup kartı için şu alanları doldur:
{ "opponent": "şampiyon adı", "difficulty": "easy"/"medium"/"hard", "summary": "kısa özet", "keyTip": "en kritik ipucu" }

Sadece JSON döndür, başka açıklama ekleme.`;
}
