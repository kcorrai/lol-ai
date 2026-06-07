# TASK-075 â€” Frictionless Demo: KayÄ±t Olmadan Summoner Analizi

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 1.5 days  
**Priority:** P0

---

## Objective

Landing page'e kayÄ±t gerektirmeyen bir summoner arama kutusu ekle. ZiyaretÃ§i
herhangi bir oyuncunun adÄ±nÄ± girip gerÃ§ek Riot verisine dayalÄ± kÄ±smi bir analiz
gÃ¶rebilsin. KoÃ§luk Ã¶nerileri blur'lu gÃ¶sterilir ve "HesabÄ±nÄ± baÄŸla â†’ tam raporu gÃ¶r"
CTA'sÄ± ile signup'a yÃ¶nlendirilir. Op.gg'den farkÄ±mÄ±z: istatistik deÄŸil, AI Ã¶nerisi
sunuyoruz.

---

## User Story

> "Kaydolmadan Ã¶nce platform benim iÃ§in ne yapabilir gÃ¶rmek istiyorum.
> Kendi hesabÄ±mÄ± aramak istiyorum ama email doldurmak istemiyorum."

---

## Acceptance Criteria

- [ ] Landing page'de summoner adÄ± + region seÃ§imi arama formu var
- [ ] Arama sonucu: rank, son 5 maÃ§ WR, en Ã§ok oynanan 3 ÅŸampiyon gÃ¶steriliyor
- [ ] AI koÃ§luk Ã¶zeti (2-3 cÃ¼mle) blur overlay ile gÃ¶steriliyor
- [ ] "Tam analizi gÃ¶r â†’ Riot hesabÄ±nÄ± baÄŸla" butonu CTA olarak belirgin
- [ ] Rate limit: IP baÅŸÄ±na saatte 10 arama (Upstash Redis)
- [ ] GeÃ§ersiz summoner â†’ kullanÄ±cÄ± dostu hata mesajÄ±
- [ ] SonuÃ§ sayfasÄ± share edilebilir URL: `/preview/[region]/[summonerName]`
- [ ] Mobile responsive
- [ ] Riot API hatasÄ± (404/429) graceful handling
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### Endpoint

```typescript
// app/api/public/preview/route.ts
// GET ?summonerName=KaaN&region=tr1
// Auth: yok â€” public
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
  aiInsightBlurred: string; // gerÃ§ek AI metni, frontend'de blur
}
```

### AI Insight Ãœretimi

Mevcut `src/lib/ai/` abstraction'Ä±nÄ± kullan. KÄ±sa prompt:
```
Player: {name}, Rank: {tier}, Recent WR: {wr}%, Top champ: {champ}
Give ONE coaching insight in 2 sentences. Be specific and actionable.
```

Sonucu 24 saat cache'le (aynÄ± summoner iÃ§in tekrar API Ã§aÄŸrÄ±sÄ± yapma):
- Redis key: `preview:{region}:{summonerName.toLowerCase()}`
- TTL: 86400 saniye

### Landing Page BileÅŸeni

```
src/components/landing/DemoSearchBox.tsx   â† arama formu + sonuÃ§
src/components/landing/PreviewResultCard.tsx â† blur overlay + CTA
```

### Route

```
app/preview/[region]/[summonerName]/page.tsx  â† SSR, OG meta tag ile
```

OG meta: "KaaN#TR1 â€” LoL AI Coach Analizi" baÅŸlÄ±ÄŸÄ± ile paylaÅŸÄ±labilir.

---

## Files

```
app/api/public/preview/route.ts              â† YENÄ° (public, rate limited)
app/preview/[region]/[summonerName]/page.tsx â† YENÄ° (SSR preview sayfasÄ±)
src/components/landing/DemoSearchBox.tsx     â† YENÄ°
src/components/landing/PreviewResultCard.tsx â† YENÄ°
app/(marketing)/page.tsx                     â† DemoSearchBox ekle
```

---

## Tier Gating

- **Herkes (anonim):** KÄ±smi veri + blur AI insight
- **KayÄ±tlÄ± Free:** Blur kalkar ama koÃ§luk sÄ±nÄ±rlÄ±
- **Pro:** Tam rapor, geÃ§miÅŸ, Ã¶neriler

---

## Rate Limiting

```typescript
// Upstash Redis â€” mevcut @upstash/ratelimit kullan
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'preview',
});
const { success } = await ratelimit.limit(ip);
if (!success) return Response.json({ error: 'Rate limit aÅŸÄ±ldÄ±' }, { status: 429 });
```

---

## Test Plan

```typescript
describe('public preview endpoint', () => {
  it('geÃ§erli summoner â†’ PreviewResponse dÃ¶ndÃ¼rÃ¼r')
  it('geÃ§ersiz summoner â†’ 404 dÃ¶ndÃ¼rÃ¼r')
  it('11. istek aynÄ± IP â†’ 429 dÃ¶ndÃ¼rÃ¼r')
  it('Riot 429 â†’ 503 ile graceful hata')
})
```

---

## Dependencies

- Upstash Redis âœ… (mevcut)
- `src/lib/ai/` âœ… (mevcut)
- Riot API âœ… (mevcut)

---

## Definition of Done

- Landing page'de arama kutusu Ã§alÄ±ÅŸÄ±yor
- Preview sonuÃ§ sayfasÄ± share edilebilir URL'e sahip
- Blur overlay + CTA gÃ¶rÃ¼nÃ¼yor
- Rate limit korumasÄ± aktif
- `docs/API_DESIGN.md` gÃ¼ncellendi

