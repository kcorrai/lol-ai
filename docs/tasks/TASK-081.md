# TASK-081 — Season End Recap (Spotify Wrapped Tarzı)

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

Sezon sonunda (veya her 3 ayda bir "chapter" olarak) kullanıcının o dönemin
tüm istatistiklerini sinematik, animasyonlu bir recap sayfasında sun. Spotify
Wrapped gibi paylaşılabilir, "bu benim yılım" hissi veren viral içerik.

---

## User Story

> "Bu sezonu bitirdim. Kaç maç oynadım, en iyi şampiyonum kim, ne kadar
> LP kazandım görmek istiyorum — ve arkadaşlarımla paylaşmak istiyorum."

---

## Acceptance Criteria

- [ ] `SeasonRecap` DB tablosu: dönemsel istatistik snapshot'ı
- [ ] Recap üretme: 30+ maç oynanınca "Recapın hazır" bildirimi
- [ ] `/recap/[season]` tam sayfa animasyonlu deneyim
- [ ] Slayt yapısı: en az 8 ekran (aşağıda detaylı)
- [ ] Her slayt paylaşılabilir OG image olarak export edilebilir
- [ ] "Recap'ı Paylaş" → tek link tüm recap'ı gösteriyor (public, auth gerekmez)
- [ ] Mobile tam ekran deneyim (portrait modunda optimize)
- [ ] Animasyonlar: Framer Motion ile smooth geçişler
- [ ] TypeScript strict — no `any`

---

## Recap Slaytları

### Slayt 1 — Karşılama
```
[Oyuncu adı] — [Sezon: Yaz 2025]
"Bu sezon sahada geçirdiğin zamana değdi mi?"
[Animasyonlu rank rozeti]
```

### Slayt 2 — Büyük Sayılar
```
TOPLAM: 247 Maç   |   LP Değişimi: +312
KAZANMA ORANI: %54   |   Toplam KDA: 3.2
[Sayı sayacı animasyonu]
```

### Slayt 3 — En İyi Şampiyonun
```
"Bu sezonun yıldızı:"
[Şampiyon splash art — tam arka plan]
AHRI   74 Maç   %61 WR   3.8 KDA
"Top 12% Ahri oyuncusu"
```

### Slayt 4 — Rank Yolculuğu
```
[Mini LP grafiği — animasyonlu çizgi]
"Başladığın yer: Silver III"
"Bitirdiğin yer: Gold I"
"+412 LP kazandın"
```

### Slayt 5 — En Kötü Gecen
```
"Bir de bunlar vardı..."
"27 Mayıs: 5 üst üste kayıp, -87 LP"
"Ama geri döndün."
```

### Slayt 6 — Habit Kırma Anı
```
"Bu sezon bir alışkanlığı yendin:"
"4 hafta boyunca vision score'un düşüktü."
"Hafta 7'de problemi fark ettin ve çözdün."
```
(PlayerHabit.isResolved = true ise göster)

### Slayt 7 — AI Koç Yorumu
```
[AI üretilmiş 3 cümlelik sezon değerlendirmesi]
"Bu sezonun en güçlü yanı: lane phase kontrolü.
Bir sonraki sezonda: map awareness."
```

### Slayt 8 — Bir Sonraki Sezon
```
"Sıradaki hedef:"
[Improvement planından alınan hedef varsa göster]
"Gold I → Platin IV"
[Başla butonu]
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
  data          Json     // tüm istatistikler snapshot
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

export async function buildRecapData(userId: string, riotAccountId: string): Promise<RecapData>
export async function generateOrGetRecap(userId: string, riotAccountId: string): Promise<SeasonRecap>
```

### Frontend: Animasyonlu Recap

```typescript
// app/(app)/recap/[season]/page.tsx
// Framer Motion — tam sayfa slayt geçişleri
// Klavye/swipe navigasyonu
// Progress bar (üstte: 1/8, 2/8...)
```

### Public Share Sayfası

```typescript
// app/recap/share/[shareToken]/page.tsx  ← auth gerekmez
// Aynı animasyonlu deneyim, sadece "Bunu sen de dene →" CTA ekli
```

### Paylaşım CTA

Her slaytın altında:
```
[📸 Bu anı paylaş]  ← o slayta özel OG image indir
[🔗 Tüm recap'ı paylaş]  ← shareToken linki kopyala
```

---

## Files

```
prisma/schema.prisma                                        ← SeasonRecap model
prisma/migrations/YYYYMMDD_add_season_recap/                ← YENİ
src/domains/analysis/services/recapService.ts               ← YENİ
app/api/recap/generate/route.ts                             ← POST — recap üret/getir
app/api/recap/share/[shareToken]/route.ts                   ← GET — public JSON
app/(app)/recap/[season]/page.tsx                           ← animasyonlu recap
app/recap/share/[shareToken]/page.tsx                       ← public share sayfası
src/domains/analysis/components/recap/RecapSlide.tsx        ← YENİ (base slayt)
src/domains/analysis/components/recap/RecapStats.tsx        ← YENİ (sayı animasyonları)
src/domains/analysis/components/recap/RecapChampion.tsx     ← YENİ (splash art slayt)
src/hooks/useRecap.ts                                       ← YENİ TanStack Query
```

---

## Tier Gating

- **Free:** Recap görüntüle, paylaş (watermark ile)
- **Pro:** Watermark yok, tüm slaytlar, AI koç yorumu
- **Elite:** Özel tema (renk şeması seçimi)

---

## Test Plan

```typescript
describe('recapService', () => {
  it('buildRecapData: 30 maçtan az → hata döndürür')
  it('buildRecapData: topChampion doğru hesaplanıyor')
  it('buildRecapData: lpDelta yama tarihlerinden bağımsız doğru')
  it('generateOrGetRecap: ikinci çağrıda yeni üretilmiyor, mevcut döndürülüyor')
})
```

---

## Dependencies

- Framer Motion (yeni dependency — `docs/DEPENDENCIES.md` güncelle)
- `recapService.ts` mevcut `improvementPlanService`, `tiltService` kullanır
- `next/og` ✅

---

## Definition of Done

- Recap sayfası 8 slaydı gösteriyor
- Animasyonlar smooth çalışıyor
- Share linki public erişimle açılıyor
- Mobile portrait'te tam ekran
- `docs/DEPENDENCIES.md` güncellendi (Framer Motion)
