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
  enemyChampions: string[],
  itemNames: Record<number, string>
): string {
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  const outcome = participant.won ? "Kazandı" : "Kaybetti";
  const nonZeroItems = participant.itemIds
    .filter((id) => id > 0)
    .map((id, i) => `${i + 1}. ${itemNames[id] ?? `Bilinmeyen Item (ID: ${id})`}`);

  const itemCount = nonZeroItems.length;

  return `Bu maçı analiz et:

Oyuncu: ${participant.championName}
KDA: ${kda} — ${outcome}
Oyun Süresi: ${participant.gameDurationMinutes} dakika
Rakip Takım: ${enemyChampions.join(", ")}

Oyuncunun envanterinde TAM OLARAK şu ${itemCount} item var (sırası önemli):
${nonZeroItems.join("\n")}

KURALLAR:
- "items" dizisinde TAM OLARAK ${itemCount} eleman olmalı — ne fazla ne eksik.
- Her eleman yukarıdaki listedeki sırayla birebir eşleşmeli (1. item → items[0], 2. item → items[1], …).
- "itemName" alanına yukarıdaki listedeki adı aynen yaz, değiştirme.
- Yukarıdaki tüm itemler Riot Games'in resmi DDragon veritabanından çekilmiştir ve güncel sezonda MEVCUTTUR. "Oyunda mevcut değil", "kaldırılmış", "eski sezon" gibi ifadeler KULLANMA — bu bilgi yanlış olur.
- Bir item adını tanımıyorsan bu senin bilgi kesim tarihinden kaynaklanıyor olabilir; yine de o item için meta içindeki rolüne göre mantıklı bir analiz yap.

Şu JSON formatında yanıt ver:
{
  "summary": "Genel build analizi — 2-3 cümle",
  "items": [
    {
      "itemName": "Yukarıdaki listedeki adın aynısı",
      "wasGoodChoice": true,
      "reasoning": "Neden iyi/kötü seçimdi",
      "betterAlternative": "Daha iyi alternatif item adı (yoksa null)",
      "whenToChoose": "Bu item ne zaman alınmalı"
    }
  ],
  "buildPath": "Bu oyun için ideal build sırası ne olurdu — kısa özet",
  "biggestMistake": "Bu builddeki en büyük hata (yoksa null)"
}

Sadece JSON döndür.`;
}
