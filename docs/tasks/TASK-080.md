# TASK-080 â€” Ã–lÃ¼m IsÄ± HaritasÄ± (Death Heat Map)

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2.5 days  
**Priority:** P1

---

## Objective

KullanÄ±cÄ±nÄ±n son 20-50 maÃ§Ä±ndaki Ã¶lÃ¼m koordinatlarÄ±nÄ± LoL haritasÄ± Ã¼zerinde Ä±sÄ±
haritasÄ± olarak gÃ¶rselleÅŸtir. KullanÄ±cÄ± hangi bÃ¶lgede, hangi zamanlarda Ã¶ldÃ¼ÄŸÃ¼nÃ¼
gÃ¶rsel olarak anlasÄ±n. Riot Match Timeline API'si koordinat verisi saÄŸlÄ±yor.

---

## User Story

> "Her raporumda 'tÃ¼nel gÃ¶rÃ¼ÅŸÃ¼ var, tehlikeli pozisyon alÄ±yorsun' yazÄ±yor ama
> bunu somut olarak gÃ¶rmÃ¼yorum. Nerede Ã¶ldÃ¼ÄŸÃ¼mÃ¼ haritada gÃ¶rmek istiyorum."

---

## Acceptance Criteria

- [ ] Match Timeline API'den Ã¶lÃ¼m event'leri Ã§ekiliyor (koordinatlarÄ±yla)
- [ ] Son 20 maÃ§Ä±n Ã¶lÃ¼m koordinatlarÄ± DB'ye kaydediliyor
- [ ] LoL haritasÄ± Ã¼zerine Ä±sÄ± haritasÄ± overlay (SVG veya Canvas)
- [ ] Filtreler: ÅŸampiyon, maÃ§ sayÄ±sÄ± (10/20/50), erken/geÃ§ oyun (0-15dk / 15-30dk / 30+dk)
- [ ] Hover: o konumdaki maÃ§ sayÄ±sÄ± tooltip
- [ ] "En tehlikeli bÃ¶lge" AI Ã¶zeti: "Ã–lÃ¼mlerinin %40'Ä± dÃ¼ÅŸman jungle'da gerÃ§ekleÅŸiyor"
- [ ] Ward haritasÄ± toggle (ward yerleÅŸtirme vs Ã¶lÃ¼m â€” karÅŸÄ±laÅŸtÄ±rma)
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### Riot Match Timeline API

```
GET /lol/match/v5/matches/{matchId}/timeline
```

Event tipi `CHAMPION_KILL`:

```json
{
  "type": "CHAMPION_KILL",
  "timestamp": 847234,
  "killerId": 3,
  "victimId": 7,
  "position": { "x": 7521, "y": 6234 }
}
```

Koordinat sistemi: 0-14820 (x), 0-14881 (y) â€” standart LoL harita koordinatlarÄ±.

### DB Schema

```prisma
model MatchDeathEvent {
  id            String @id @default(uuid()) @db.Uuid
  matchId       String @db.Uuid
  riotAccountId String @db.Uuid
  positionX     Int
  positionY     Int
  gameTimeMs    Int    // Ã¶lÃ¼m zamanÄ± (ms)
  championName  String
  createdAt     DateTime @default(now())

  match       Match       @relation(fields: [matchId], references: [id], onDelete: Cascade)
  riotAccount RiotAccount @relation(fields: [riotAccountId], references: [id], onDelete: Cascade)

  @@index([riotAccountId, championName])
  @@map("match_death_events")
}
```

### Timeline Fetch Servisi

```typescript
// src/domains/riot/services/timelineService.ts

export async function fetchAndPersistDeathEvents(
  matchId: string,
  riotMatchId: string,
  riotAccountId: string,
  participantId: number
): Promise<number>; // kaydedilen event sayÄ±sÄ±
```

Match sync sÄ±rasÄ±nda veya lazy (ilk heat map isteÄŸinde) Ã§alÄ±ÅŸabilir.
Timeline API rate limit'e dikkat: background job olarak Inngest ile Ã§alÄ±ÅŸtÄ±r.

### Koordinat â†’ Piksel DÃ¶nÃ¼ÅŸÃ¼mÃ¼

LoL haritasÄ± 14820Ã—14881 birim. Harita gÃ¶rseli genellikle 512Ã—512 piksel.

```typescript
function toPixel(coord: number, mapSize: number, displaySize: number): number {
  return Math.round((coord / mapSize) * displaySize);
}
```

### IsÄ± HaritasÄ± Render (Canvas)

```typescript
// src/domains/analysis/components/DeathHeatMap.tsx
// <canvas> + konuÅŸlandÄ±rÄ±lan blur circle'lar
// KÃ¼tÃ¼phane: heatmap.js (lightweight, MIT lisansÄ±)
// Harita gÃ¶rseli: /public/images/lol-map.png (static asset)
```

Alternatif: SVG overlay (daha hafif, daha az animasyon).

### AI Ã–zet

```typescript
// KoordinatlarÄ± bÃ¶lgelere dÃ¶nÃ¼ÅŸtÃ¼r:
// x < 4000: kendi base/jungle
// 4000-10000: orta bÃ¶lge / lane
// x > 10000: dÃ¼ÅŸman bÃ¶lgesi

async function generateDeathSummary(deathEvents: MatchDeathEvent[]): Promise<string>;
// "Ã–lÃ¼mlerinin %47'si dÃ¼ÅŸman jungleda, genellikle 20-30. dakikada."
```

### API

```
GET /api/analysis/heatmap?riotAccountId=<id>&champion=Ahri&timeRange=early
Response: { deaths: { x, y, gameTimeMs }[], summary: string, totalDeaths: number }
```

---

## Ward HaritasÄ± (Ä°kinci AÅŸama)

AynÄ± altyapÄ±yla ward event'leri de eklenebilir:

```json
{ "type": "WARD_PLACED", "position": { "x": ..., "y": ... } }
```

Toggle ile Ã¶lÃ¼m haritasÄ± â†” ward haritasÄ± geÃ§iÅŸi.

---

## Files

```
prisma/schema.prisma                                        â† MatchDeathEvent model
prisma/migrations/YYYYMMDD_add_death_events/                â† YENÄ°
src/domains/riot/services/timelineService.ts                â† YENÄ°
src/inngest/functions/timelineFetcher.ts                    â† YENÄ° (background job)
src/domains/analysis/services/heatmapService.ts             â† koordinat â†’ bÃ¶lge, AI Ã¶zet
src/domains/analysis/components/DeathHeatMap.tsx            â† YENÄ° (Canvas/SVG)
src/domains/analysis/components/HeatMapControls.tsx         â† YENÄ° (filtreler)
app/api/analysis/heatmap/route.ts                           â† YENÄ°
src/hooks/useDeathHeatmap.ts                                â† YENÄ° TanStack Query
app/(app)/analysis/page.tsx                                 â† YENÄ° sayfa veya mevcut
public/images/lol-map.png                                   â† statik harita gÃ¶rseli
```

---

## Tier Gating

- **Free:** Son 10 maÃ§, filtre yok
- **Pro:** Son 50 maÃ§, tÃ¼m filtreler, AI Ã¶zet
- **Elite:** Ward haritasÄ± overlay

---

## Test Plan

```typescript
describe("timelineService", () => {
  it("CHAMPION_KILL event â†’ MatchDeathEvent kaydÄ± oluÅŸturulur");
  it("katil olmak Ã¶lÃ¼m olarak sayÄ±lmaz (victimId kontrolÃ¼)");
  it("duplicate event â†’ upsert ile Ã§ift kayÄ±t olmaz");
});

describe("heatmapService", () => {
  it("x > 10000 â†’ dÃ¼ÅŸman bÃ¶lgesi doÄŸru etiketleniyor");
  it("gameTimeMs < 900000 â†’ erken oyun (0-15dk) doÄŸru gruplanÄ±yor");
});
```

---

## Performance Notu

Timeline API response'larÄ± bÃ¼yÃ¼k olabilir (1-2MB). Sadece `CHAMPION_KILL`
ve `WARD_PLACED` event'lerini parse et, geri kalanÄ±nÄ± discard et.

---

## Dependencies

- Riot Match Timeline API (v5) âœ… (kota var, background queue kullan)
- Inngest âœ…
- heatmap.js (yeni dependency â€” `docs/DEPENDENCIES.md` gÃ¼ncelle)

---

## Definition of Done

- Koordinatlar DB'ye kaydediliyor
- Harita Ã¼zerinde Ä±sÄ± haritasÄ± gÃ¶rÃ¼nÃ¼yor
- Filtreler Ã§alÄ±ÅŸÄ±yor
- AI Ã¶zet doÄŸru bÃ¶lge analizi yapÄ±yor
- Mobile'da harita kabul edilebilir boyutta gÃ¶rÃ¼nÃ¼yor
- `docs/DATABASE_SCHEMA.md` gÃ¼ncellendi
- `docs/DEPENDENCIES.md` gÃ¼ncellendi
