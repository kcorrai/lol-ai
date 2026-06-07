# TASK-075 — Frictionless Demo: Kayıt Olmadan Summoner Analizi

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 1.5 days  
**Priority:** P0

---

## Objective

Landing page'e kayıt gerektirmeyen bir summoner arama kutusu ekle. Ziyaretçi
herhangi bir oyuncunun adını girip gerçek Riot verisine dayalı kısmi bir analiz
görebilsin. Koçluk önerileri blur'lu gösterilir ve "Hesabını bağla → tam raporu gör"
CTA'sı ile signup'a yönlendirilir. Op.gg'den farkımız: istatistik değil, AI önerisi
sunuyoruz.

---

## User Story

> "Kaydolmadan önce platform benim için ne yapabilir görmek istiyorum.
> Kendi hesabımı aramak istiyorum ama email doldurmak istemiyorum."

---

## Acceptance Criteria

- [ ] Landing page'de summoner adı + region seçimi arama formu var
- [ ] Arama sonucu: rank, son 5 maç WR, en çok oynanan 3 şampiyon gösteriliyor
- [ ] AI koçluk özeti (2-3 cümle) blur overlay ile gösteriliyor
- [ ] "Tam analizi gör → Riot hesabını bağla" butonu CTA olarak belirgin
- [ ] Rate limit: IP başına saatte 10 arama (Upstash Redis)
- [ ] Geçersiz summoner → kullanıcı dostu hata mesajı
- [ ] Sonuç sayfası share edilebilir URL: `/preview/[region]/[summonerName]`
- [ ] Mobile responsive
- [ ] Riot API hatası (404/429) graceful handling
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Endpoint

```typescript
// app/api/public/preview/route.ts
// GET ?summonerName=KaaN&region=tr1
// Auth: yok — public
// Rate limit: 10 req/saat per IP (Upstash Redis)

interface PreviewResponse {
  summoner: {
    name: string;
    profileIconId: number;
    summonerLevel: number;
  };
  rank: {
    tier: string;
    division: string;
    lp: number;
  } | null;
  recentMatches: {
    championName: string;
    win: boolean;
    kda: string;
  }[];
  topChampions: {
    championName: string;
    games: number;
    winRate: number;
  }[];
  aiInsightBlurred: string; // gerçek AI metni, frontend'de blur
}
```

### AI Insight Üretimi

Mevcut `src/lib/ai/` abstraction'ını kullan. Kısa prompt:
```
Player: {name}, Rank: {tier}, Recent WR: {wr}%, Top champ: {champ}
Give ONE coaching insight in 2 sentences. Be specific and actionable.
```

Sonucu 24 saat cache'le (aynı summoner için tekrar API çağrısı yapma):
- Redis key: `preview:{region}:{summonerName.toLowerCase()}`
- TTL: 86400 saniye

### Landing Page Bileşeni

```
src/components/landing/DemoSearchBox.tsx   ← arama formu + sonuç
src/components/landing/PreviewResultCard.tsx ← blur overlay + CTA
```

### Route

```
app/preview/[region]/[summonerName]/page.tsx  ← SSR, OG meta tag ile
```

OG meta: "KaaN#TR1 — LoL AI Coach Analizi" başlığı ile paylaşılabilir.

---

## Files

```
app/api/public/preview/route.ts              ← YENİ (public, rate limited)
app/preview/[region]/[summonerName]/page.tsx ← YENİ (SSR preview sayfası)
src/components/landing/DemoSearchBox.tsx     ← YENİ
src/components/landing/PreviewResultCard.tsx ← YENİ
app/(marketing)/page.tsx                     ← DemoSearchBox ekle
```

---

## Tier Gating

- **Herkes (anonim):** Kısmi veri + blur AI insight
- **Kayıtlı Free:** Blur kalkar ama koçluk sınırlı
- **Pro:** Tam rapor, geçmiş, öneriler

---

## Rate Limiting

```typescript
// Upstash Redis — mevcut @upstash/ratelimit kullan
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'preview',
});
const { success } = await ratelimit.limit(ip);
if (!success) return Response.json({ error: 'Rate limit aşıldı' }, { status: 429 });
```

---

## Test Plan

```typescript
describe('public preview endpoint', () => {
  it('geçerli summoner → PreviewResponse döndürür')
  it('geçersiz summoner → 404 döndürür')
  it('11. istek aynı IP → 429 döndürür')
  it('Riot 429 → 503 ile graceful hata')
})
```

---

## Dependencies

- Upstash Redis ✅ (mevcut)
- `src/lib/ai/` ✅ (mevcut)
- Riot API ✅ (mevcut)

---

## Definition of Done

- Landing page'de arama kutusu çalışıyor
- Preview sonuç sayfası share edilebilir URL'e sahip
- Blur overlay + CTA görünüyor
- Rate limit koruması aktif
- `docs/API_DESIGN.md` güncellendi
