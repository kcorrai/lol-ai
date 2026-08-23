# TASK-081 â€” Season End Recap (Spotify Wrapped TarzÄ±)

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

Sezon sonunda (veya her 3 ayda bir "chapter" olarak) kullanÄ±cÄ±nÄ±n o dÃ¶nemin
tÃ¼m istatistiklerini sinematik, animasyonlu bir recap sayfasÄ±nda sun. Spotify
Wrapped gibi paylaÅŸÄ±labilir, "bu benim yÄ±lÄ±m" hissi veren viral iÃ§erik.

---

## User Story

> "Bu sezonu bitirdim. KaÃ§ maÃ§ oynadÄ±m, en iyi ÅŸampiyonum kim, ne kadar
> LP kazandÄ±m gÃ¶rmek istiyorum â€” ve arkadaÅŸlarÄ±mla paylaÅŸmak istiyorum."

---

## Acceptance Criteria

- [ ] `SeasonRecap` DB tablosu: dÃ¶nemsel istatistik snapshot'Ä±
- [ ] Recap Ã¼retme: 30+ maÃ§ oynanÄ±nca "RecapÄ±n hazÄ±r" bildirimi
- [ ] `/recap/[season]` tam sayfa animasyonlu deneyim
- [ ] Slayt yapÄ±sÄ±: en az 8 ekran (aÅŸaÄŸÄ±da detaylÄ±)
- [ ] Her slayt paylaÅŸÄ±labilir OG image olarak export edilebilir
- [ ] "Recap'Ä± PaylaÅŸ" â†’ tek link tÃ¼m recap'Ä± gÃ¶steriyor (public, auth gerekmez)
- [ ] Mobile tam ekran deneyim (portrait modunda optimize)
- [ ] Animasyonlar: Framer Motion ile smooth geÃ§iÅŸler
- [ ] TypeScript strict â€” no `any`

---

## Recap SlaytlarÄ±

### Slayt 1 â€” KarÅŸÄ±lama

```
[Oyuncu adÄ±] â€” [Sezon: Yaz 2025]
"Bu sezon sahada geÃ§irdiÄŸin zamana deÄŸdi mi?"
[Animasyonlu rank rozeti]
```

### Slayt 2 â€” BÃ¼yÃ¼k SayÄ±lar

```
TOPLAM: 247 MaÃ§   |   LP DeÄŸiÅŸimi: +312
KAZANMA ORANI: %54   |   Toplam KDA: 3.2
[SayÄ± sayacÄ± animasyonu]
```

### Slayt 3 â€” En Ä°yi Åampiyonun

```
"Bu sezonun yÄ±ldÄ±zÄ±:"
[Åampiyon splash art â€” tam arka plan]
AHRI   74 MaÃ§   %61 WR   3.8 KDA
"Top 12% Ahri oyuncusu"
```

### Slayt 4 â€” Rank YolculuÄŸu

```
[Mini LP grafiÄŸi â€” animasyonlu Ã§izgi]
"BaÅŸladÄ±ÄŸÄ±n yer: Silver III"
"BitirdiÄŸin yer: Gold I"
"+412 LP kazandÄ±n"
```

### Slayt 5 â€” En KÃ¶tÃ¼ Gecen

```
"Bir de bunlar vardÄ±..."
"27 MayÄ±s: 5 Ã¼st Ã¼ste kayÄ±p, -87 LP"
"Ama geri dÃ¶ndÃ¼n."
```

### Slayt 6 â€” Habit KÄ±rma AnÄ±

```
"Bu sezon bir alÄ±ÅŸkanlÄ±ÄŸÄ± yendin:"
"4 hafta boyunca vision score'un dÃ¼ÅŸÃ¼ktÃ¼."
"Hafta 7'de problemi fark ettin ve Ã§Ã¶zdÃ¼n."
```

(PlayerHabit.isResolved = true ise gÃ¶ster)

### Slayt 7 â€” AI KoÃ§ Yorumu

```
[AI Ã¼retilmiÅŸ 3 cÃ¼mlelik sezon deÄŸerlendirmesi]
"Bu sezonun en gÃ¼Ã§lÃ¼ yanÄ±: lane phase kontrolÃ¼.
Bir sonraki sezonda: map awareness."
```

### Slayt 8 â€” Bir Sonraki Sezon

```
"SÄ±radaki hedef:"
[Improvement planÄ±ndan alÄ±nan hedef varsa gÃ¶ster]
"Gold I â†’ Platin IV"
[BaÅŸla butonu]
```

---

## Technical Approach

### DB Schema

```prisma
model SeasonRecap {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  seasonLabel   String   // "2025-S2" (summer split 2025)
  shareToken    String   @unique @default(cuid())
  data          Json     // tÃ¼m istatistikler snapshot
  generatedAt   DateTime @default(now())
  isPublic      Boolean  @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, seasonLabel])
  @@map("season_recaps")
}
```

### Recap Data Builder

```typescript
// src/domains/analysis/services/recapService.ts

export interface RecapData {
  seasonLabel: string;
  totalMatches: number;
  winRate: number;
  lpDelta: number;
  startRank: string;
  endRank: string;
  topChampion: { name: string; games: number; winRate: number; kda: number };
  bestStreak: { wins: number; date: string; lpGain: number };
  worstDay: { date: string; losses: number; lpLoss: number };
  resolvedHabit: string | null;
  aiSummary: string;
  nextGoal: string | null;
}

export async function buildRecapData(userId: string, riotAccountId: string): Promise<RecapData>;
export async function generateOrGetRecap(
  userId: string,
  riotAccountId: string
): Promise<SeasonRecap>;
```

### Frontend: Animasyonlu Recap

```typescript
// app/(app)/recap/[season]/page.tsx
// Framer Motion â€” tam sayfa slayt geÃ§iÅŸleri
// Klavye/swipe navigasyonu
// Progress bar (Ã¼stte: 1/8, 2/8...)
```

### Public Share SayfasÄ±

```typescript
// app/recap/share/[shareToken]/page.tsx  â† auth gerekmez
// AynÄ± animasyonlu deneyim, sadece "Bunu sen de dene â†’" CTA ekli
```

### PaylaÅŸÄ±m CTA

Her slaytÄ±n altÄ±nda:

```
[ğŸ“¸ Bu anÄ± paylaÅŸ]  â† o slayta Ã¶zel OG image indir
[ğŸ”— TÃ¼m recap'Ä± paylaÅŸ]  â† shareToken linki kopyala
```

---

## Files

```
prisma/schema.prisma                                        â† SeasonRecap model
prisma/migrations/YYYYMMDD_add_season_recap/                â† YENÄ°
src/domains/analysis/services/recapService.ts               â† YENÄ°
app/api/recap/generate/route.ts                             â† POST â€” recap Ã¼ret/getir
app/api/recap/share/[shareToken]/route.ts                   â† GET â€” public JSON
app/(app)/recap/[season]/page.tsx                           â† animasyonlu recap
app/recap/share/[shareToken]/page.tsx                       â† public share sayfasÄ±
src/domains/analysis/components/recap/RecapSlide.tsx        â† YENÄ° (base slayt)
src/domains/analysis/components/recap/RecapStats.tsx        â† YENÄ° (sayÄ± animasyonlarÄ±)
src/domains/analysis/components/recap/RecapChampion.tsx     â† YENÄ° (splash art slayt)
src/hooks/useRecap.ts                                       â† YENÄ° TanStack Query
```

---

## Tier Gating

- **Free:** Recap gÃ¶rÃ¼ntÃ¼le, paylaÅŸ (watermark ile)
- **Pro:** Watermark yok, tÃ¼m slaytlar, AI koÃ§ yorumu
- **Elite:** Ã–zel tema (renk ÅŸemasÄ± seÃ§imi)

---

## Test Plan

```typescript
describe("recapService", () => {
  it("buildRecapData: 30 maÃ§tan az â†’ hata dÃ¶ndÃ¼rÃ¼r");
  it("buildRecapData: topChampion doÄŸru hesaplanÄ±yor");
  it("buildRecapData: lpDelta yama tarihlerinden baÄŸÄ±msÄ±z doÄŸru");
  it("generateOrGetRecap: ikinci Ã§aÄŸrÄ±da yeni Ã¼retilmiyor, mevcut dÃ¶ndÃ¼rÃ¼lÃ¼yor");
});
```

---

## Dependencies

- Framer Motion (yeni dependency â€” `docs/DEPENDENCIES.md` gÃ¼ncelle)
- `recapService.ts` mevcut `improvementPlanService`, `tiltService` kullanÄ±r
- `next/og` âœ…

---

## Definition of Done

- Recap sayfasÄ± 8 slaydÄ± gÃ¶steriyor
- Animasyonlar smooth Ã§alÄ±ÅŸÄ±yor
- Share linki public eriÅŸimle aÃ§Ä±lÄ±yor
- Mobile portrait'te tam ekran
- `docs/DEPENDENCIES.md` gÃ¼ncellendi (Framer Motion)
