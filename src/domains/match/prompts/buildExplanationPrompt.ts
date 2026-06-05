interface ParticipantContext {
  championName: string;
  itemIds: number[];
  kills: number;
  deaths: number;
  assists: number;
  won: boolean;
  gameDurationMinutes: number;
}

export function buildBuildExplanationSystemPrompt(): string {
  return `Sen bir League of Legends build analisti koçusun. Sana gerçek bir maçın verilerini vereceğim. Oyuncunun aldığı itemleri analiz et ve yapay zekâ gibi değil, deneyimli bir koç gibi yanıt ver.

Yanıtlarını her zaman geçerli JSON formatında ver. Sadece saf JSON objesi döndür, markdown code block kullanma.`;
}

export function buildBuildExplanationUserPrompt(
  participant: ParticipantContext,
  enemyChampions: string[]
): string {
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  const outcome = participant.won ? "Kazandı" : "Kaybetti";
  const itemList = participant.itemIds
    .filter((id) => id > 0)
    .map((id) => `Item ID: ${id}`)
    .join(", ");

  return `Bu maçı analiz et:

Oyuncu: ${participant.championName}
KDA: ${kda} — ${outcome}
Oyun Süresi: ${participant.gameDurationMinutes} dakika
Alınan Itemler: ${itemList || "Item yok"}

Rakip Takım: ${enemyChampions.join(", ")}

Şu JSON formatında yanıt ver:
{
  "summary": "Genel build analizi — 2-3 cümle",
  "items": [
    {
      "itemName": "Item adı (Riot item ID'sini League adına çevir)",
      "wasGoodChoice": true,
      "reasoning": "Neden iyi/kötü seçimdi",
      "betterAlternative": "Daha iyi alternatif item (yoksa null)",
      "whenToChoose": "Bu item ne zaman alınmalı"
    }
  ],
  "buildPath": "Bu oyun için ideal build sırası ne olurdu — kısa özet",
  "biggestMistake": "Bu builddeki en büyük hata (yoksa null)"
}

Sadece JSON döndür.`;
}
