# TASK-072 — Shareable AI Report Cards: OG Image Endpoint

**Phase:** 2 — AI Depth & Retention  
**Status:** Pending  
**Estimated Effort:** 1.5 days  
**Priority:** P0

---

## Objective

Discord, X (Twitter) ve WhatsApp için paylaşılabilir performans kartları üret.
`CoachingReport.shareToken` alanı zaten mevcut. `next/og` ile sunucu tarafında
PNG görsel döndüren endpoint yaz. Organik büyümenin ana motoru.

---

## User Story

> "Bu hafta +132 LP kazandım ve %61 WR yaptım. Bunu Discord sunucuma güzel bir
> görselle paylaşmak istiyorum."

---

## Acceptance Criteria

- [ ] `POST /api/cards/generate` kart oluşturup bir token döndürüyor
- [ ] `GET /api/cards/[token]` PNG görsel döndürüyor (OG image)
- [ ] Haftalık kart tipi çalışıyor: LP, WR, maç sayısı, en iyi şampiyon
- [ ] Mastery kart tipi çalışıyor: şampiyon, mastery skoru, tier
- [ ] Free tier: küçük "lolaicoach.com" watermark
- [ ] Pro tier: watermark yok
- [ ] Token 7 gün sonra expire oluyor
- [ ] `ShareableCard` DB tablosu + migration
- [ ] Görsel 1200x630px (OG standard) veya 800x420px (kart formatı)
- [ ] Hata: geçersiz token → 404, expire → 410 Gone

---

## Kart Tipleri

### 1. Haftalık Özet (`weekly`)

```
┌──────────────────────────────────────────────────────┐
│  LoL AI Coach                                    🏆  │
│  ─────────────────────────────────────────────────── │
│  [KaaN#TR1]    [Profil ikonu]                        │
│                                                      │
│  Bu Hafta                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  +132 LP │  │  %61 WR  │  │  14 Maç  │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  En İyi Şampiyon: Ahri — 74/100 Mastery             │
│  AI Coach Grade: A                                   │
│                                                      │
│  lolaicoach.com ──────────────── [QR veya URL]      │
└──────────────────────────────────────────────────────┘
```

### 2. Mastery Kartı (`mastery`)

```
┌──────────────────────────────────────────────────────┐
│  EXPERT  ★                        Champion Mastery  │
│                                                      │
│  [Ahri Splash Art — soluk gradient arka plan]        │
│                                                      │
│  74 / 100                     KaaN#TR1               │
│  ████████████░░░░                                    │
│                                                      │
│  Top 15% Ahri Players                               │
│  lolaicoach.com                                     │
└──────────────────────────────────────────────────────┘
```

---

## Technical Approach

### DB Migration

```prisma
model ShareableCard {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @db.Uuid
  cardType   String   // 'weekly' | 'mastery' | 'improvement'
  token      String   @unique @default(cuid())
  data       Json     // snapshot: kart içeriği render zamanında değişmez
  viewCount  Int      @default(0)
  createdAt  DateTime @default(now())
  expiresAt  DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("shareable_cards")
}
```

### Generate Endpoint

```typescript
// app/api/cards/generate/route.ts
// POST body: { cardType: 'weekly' | 'mastery', riotAccountId: string, championId?: number }
// 1. Veriyi topla (LP farkı, WR, mastery skoru vb.)
// 2. Data snapshot oluştur (sabitlenmiş veri — render zamanında değişmez)
// 3. ShareableCard DB'ye yaz
// 4. Token döndür
// Response: { token: string, cardUrl: string, expiresAt: string }
```

### Image Endpoint

```typescript
// app/api/cards/[token]/route.ts
import { ImageResponse } from 'next/og';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const card = await prisma.shareableCard.findUnique({ where: { token: params.token } });
  
  if (!card) return new Response(null, { status: 404 });
  if (card.expiresAt < new Date()) return new Response(null, { status: 410 });

  // viewCount arttır (fire and forget)
  prisma.shareableCard.update({ where: { id: card.id }, data: { viewCount: { increment: 1 } } });

  return new ImageResponse(
    card.cardType === 'weekly'
      ? <WeeklyCardTemplate data={card.data} />
      : <MasteryCardTemplate data={card.data} />,
    { width: 1200, height: 630 }
  );
}
```

### Card Template Components

```
app/api/cards/_templates/
  WeeklyCardTemplate.tsx     ← JSX, next/og uyumlu (no Tailwind, inline styles)
  MasteryCardTemplate.tsx    ← JSX, next/og uyumlu
```

> next/og: sadece inline style kullanılır, Tailwind class'ları çalışmaz.
> Font: Inter veya sistem fontu.

### Weekly Kart Verisi Toplama

```typescript
async function buildWeeklyCardData(riotAccountId: string, userId: string) {
  // Son 7 günün maçlarından:
  // - LP değişimi (ranked_history ilk - son kayıt)
  // - WR (kazanılan/toplam)
  // - Maç sayısı
  // - En iyi şampiyon (en yüksek WR, min 3 maç)
  // - Mastery skoru (champion_stats'tan)
  // - AI Coach Grade (son coaching_report'tan)
}
```

---

## Files

```
prisma/schema.prisma                              ← ShareableCard model ekle
prisma/migrations/YYYYMMDD_add_shareable_cards/   ← YENİ migration
app/api/cards/generate/route.ts                   ← POST — token üret
app/api/cards/[token]/route.ts                    ← GET — PNG döndür
app/api/cards/_templates/WeeklyCardTemplate.tsx   ← OG JSX template
app/api/cards/_templates/MasteryCardTemplate.tsx  ← OG JSX template
src/domains/coaching/services/cardService.ts      ← veri toplama mantığı
src/hooks/useShareableCard.ts                     ← TanStack Query (generate)
```

### UI Entegrasyonu (ayrı ticket değil, bu task içinde)

Dashboard ve coaching report sayfasına "Paylaş" butonu ekle:
```
app/(app)/dashboard/page.tsx   ← "Bu Haftayı Paylaş" butonu
app/(app)/coaching/[id]/page.tsx ← rapor üstüne "Paylaş" butonu
```

---

## Tier Gating

- **Free:** Haftalık kart, `lolaicoach.com` watermark ile
- **Pro:** Tüm kart tipleri, watermark yok
- **Elite:** Özel arka plan rengi tercihi (data'ya ekle)

---

## Test Plan

```typescript
describe('cardService', () => {
  it('buildWeeklyCardData: LP delta hesabı doğru')
  it('buildWeeklyCardData: WR son 7 günden hesaplanıyor')
  it('token 7 gün TTL ile oluşturuluyor')
})

// E2E: GET /api/cards/[token] → Content-Type: image/png
// E2E: expire sonrası → 410 Gone
```

---

## Dependencies

- TASK-071 (Champion Mastery Score) — mastery kartı için gerekli
- `next/og` — Next.js 13+ built-in, ek paket gerekmez

---

## Definition of Done

- PNG olarak tarayıcıda açıldığında doğru görünüyor
- Discord'da link paylaşılınca OG preview çıkıyor
- Token expire mekanizması test edildi
- Watermark Free/Pro farkı çalışıyor
- `docs/API_DESIGN.md` güncellendi
