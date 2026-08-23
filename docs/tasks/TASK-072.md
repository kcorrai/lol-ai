# TASK-072 â€” Shareable AI Report Cards: OG Image Endpoint

**Phase:** 2 â€” AI Depth & Retention  
**Status:** Done  
**Estimated Effort:** 1.5 days  
**Priority:** P0

---

## Objective

Discord, X (Twitter) ve WhatsApp iÃ§in paylaÅŸÄ±labilir performans kartlarÄ± Ã¼ret.
`CoachingReport.shareToken` alanÄ± zaten mevcut. `next/og` ile sunucu tarafÄ±nda
PNG gÃ¶rsel dÃ¶ndÃ¼ren endpoint yaz. Organik bÃ¼yÃ¼menin ana motoru.

---

## User Story

> "Bu hafta +132 LP kazandÄ±m ve %61 WR yaptÄ±m. Bunu Discord sunucuma gÃ¼zel bir
> gÃ¶rselle paylaÅŸmak istiyorum."

---

## Acceptance Criteria

- [ ] `POST /api/cards/generate` kart oluÅŸturup bir token dÃ¶ndÃ¼rÃ¼yor
- [ ] `GET /api/cards/[token]` PNG gÃ¶rsel dÃ¶ndÃ¼rÃ¼yor (OG image)
- [ ] HaftalÄ±k kart tipi Ã§alÄ±ÅŸÄ±yor: LP, WR, maÃ§ sayÄ±sÄ±, en iyi ÅŸampiyon
- [ ] Mastery kart tipi Ã§alÄ±ÅŸÄ±yor: ÅŸampiyon, mastery skoru, tier
- [ ] Free tier: kÃ¼Ã§Ã¼k "lolaicoach.com" watermark
- [ ] Pro tier: watermark yok
- [ ] Token 7 gÃ¼n sonra expire oluyor
- [ ] `ShareableCard` DB tablosu + migration
- [ ] GÃ¶rsel 1200x630px (OG standard) veya 800x420px (kart formatÄ±)
- [ ] Hata: geÃ§ersiz token â†’ 404, expire â†’ 410 Gone

---

## Kart Tipleri

### 1. HaftalÄ±k Ã–zet (`weekly`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  LoL AI Coach                                    ğŸ†  â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚  [KaaN#TR1]    [Profil ikonu]                        â”‚
â”‚                                                      â”‚
â”‚  Bu Hafta                                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”           â”‚
â”‚  â”‚  +132 LP â”‚  â”‚  %61 WR  â”‚  â”‚  14 MaÃ§  â”‚           â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜           â”‚
â”‚                                                      â”‚
â”‚  En Ä°yi Åampiyon: Ahri â€” 74/100 Mastery             â”‚
â”‚  AI Coach Grade: A                                   â”‚
â”‚                                                      â”‚
â”‚  lolaicoach.com â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ [QR veya URL]      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 2. Mastery KartÄ± (`mastery`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EXPERT  â˜…                        Champion Mastery  â”‚
â”‚                                                      â”‚
â”‚  [Ahri Splash Art â€” soluk gradient arka plan]        â”‚
â”‚                                                      â”‚
â”‚  74 / 100                     KaaN#TR1               â”‚
â”‚  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘                                    â”‚
â”‚                                                      â”‚
â”‚  Top 15% Ahri Players                               â”‚
â”‚  lolaicoach.com                                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
  data       Json     // snapshot: kart iÃ§eriÄŸi render zamanÄ±nda deÄŸiÅŸmez
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
// 1. Veriyi topla (LP farkÄ±, WR, mastery skoru vb.)
// 2. Data snapshot oluÅŸtur (sabitlenmiÅŸ veri â€” render zamanÄ±nda deÄŸiÅŸmez)
// 3. ShareableCard DB'ye yaz
// 4. Token dÃ¶ndÃ¼r
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

  // viewCount arttÄ±r (fire and forget)
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
  WeeklyCardTemplate.tsx     â† JSX, next/og uyumlu (no Tailwind, inline styles)
  MasteryCardTemplate.tsx    â† JSX, next/og uyumlu
```

> next/og: sadece inline style kullanÄ±lÄ±r, Tailwind class'larÄ± Ã§alÄ±ÅŸmaz.
> Font: Inter veya sistem fontu.

### Weekly Kart Verisi Toplama

```typescript
async function buildWeeklyCardData(riotAccountId: string, userId: string) {
  // Son 7 gÃ¼nÃ¼n maÃ§larÄ±ndan:
  // - LP deÄŸiÅŸimi (ranked_history ilk - son kayÄ±t)
  // - WR (kazanÄ±lan/toplam)
  // - MaÃ§ sayÄ±sÄ±
  // - En iyi ÅŸampiyon (en yÃ¼ksek WR, min 3 maÃ§)
  // - Mastery skoru (champion_stats'tan)
  // - AI Coach Grade (son coaching_report'tan)
}
```

---

## Files

```
prisma/schema.prisma                              â† ShareableCard model ekle
prisma/migrations/YYYYMMDD_add_shareable_cards/   â† YENÄ° migration
app/api/cards/generate/route.ts                   â† POST â€” token Ã¼ret
app/api/cards/[token]/route.ts                    â† GET â€” PNG dÃ¶ndÃ¼r
app/api/cards/_templates/WeeklyCardTemplate.tsx   â† OG JSX template
app/api/cards/_templates/MasteryCardTemplate.tsx  â† OG JSX template
src/domains/coaching/services/cardService.ts      â† veri toplama mantÄ±ÄŸÄ±
src/hooks/useShareableCard.ts                     â† TanStack Query (generate)
```

### UI Entegrasyonu (ayrÄ± ticket deÄŸil, bu task iÃ§inde)

Dashboard ve coaching report sayfasÄ±na "PaylaÅŸ" butonu ekle:

```
app/(app)/dashboard/page.tsx   â† "Bu HaftayÄ± PaylaÅŸ" butonu
app/(app)/coaching/[id]/page.tsx â† rapor Ã¼stÃ¼ne "PaylaÅŸ" butonu
```

---

## Tier Gating

- **Free:** HaftalÄ±k kart, `lolaicoach.com` watermark ile
- **Pro:** TÃ¼m kart tipleri, watermark yok
- **Elite:** Ã–zel arka plan rengi tercihi (data'ya ekle)

---

## Test Plan

```typescript
describe("cardService", () => {
  it("buildWeeklyCardData: LP delta hesabÄ± doÄŸru");
  it("buildWeeklyCardData: WR son 7 gÃ¼nden hesaplanÄ±yor");
  it("token 7 gÃ¼n TTL ile oluÅŸturuluyor");
});

// E2E: GET /api/cards/[token] â†’ Content-Type: image/png
// E2E: expire sonrasÄ± â†’ 410 Gone
```

---

## Dependencies

- TASK-071 (Champion Mastery Score) â€” mastery kartÄ± iÃ§in gerekli
- `next/og` â€” Next.js 13+ built-in, ek paket gerekmez

---

## Definition of Done

- PNG olarak tarayÄ±cÄ±da aÃ§Ä±ldÄ±ÄŸÄ±nda doÄŸru gÃ¶rÃ¼nÃ¼yor
- Discord'da link paylaÅŸÄ±lÄ±nca OG preview Ã§Ä±kÄ±yor
- Token expire mekanizmasÄ± test edildi
- Watermark Free/Pro farkÄ± Ã§alÄ±ÅŸÄ±yor
- `docs/API_DESIGN.md` gÃ¼ncellendi
