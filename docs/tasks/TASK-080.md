# TASK-080 — Ölüm Isı Haritası (Death Heat Map)

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2.5 days  
**Priority:** P1

---

## Objective

Kullanıcının son 20-50 maçındaki ölüm koordinatlarını LoL haritası üzerinde ısı
haritası olarak görselleştir. Kullanıcı hangi bölgede, hangi zamanlarda öldüğünü
görsel olarak anlasın. Riot Match Timeline API'si koordinat verisi sağlıyor.

---

## User Story

> "Her raporumda 'tünel görüşü var, tehlikeli pozisyon alıyorsun' yazıyor ama
> bunu somut olarak görmüyorum. Nerede öldüğümü haritada görmek istiyorum."

---

## Acceptance Criteria

- [ ] Match Timeline API'den ölüm event'leri çekiliyor (koordinatlarıyla)
- [ ] Son 20 maçın ölüm koordinatları DB'ye kaydediliyor
- [ ] LoL haritası üzerine ısı haritası overlay (SVG veya Canvas)
- [ ] Filtreler: şampiyon, maç sayısı (10/20/50), erken/geç oyun (0-15dk / 15-30dk / 30+dk)
- [ ] Hover: o konumdaki maç sayısı tooltip
- [ ] "En tehlikeli bölge" AI özeti: "Ölümlerinin %40'ı düşman jungle'da gerçekleşiyor"
- [ ] Ward haritası toggle (ward yerleştirme vs ölüm — karşılaştırma)
- [ ] TypeScript strict — no `any`

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

Koordinat sistemi: 0-14820 (x), 0-14881 (y) — standart LoL harita koordinatları.

### DB Schema

```prisma
model MatchDeathEvent {
  id            String @id @default(uuid()) @db.Uuid
  matchId       String @db.Uuid
  riotAccountId String @db.Uuid
  positionX     Int
  positionY     Int
  gameTimeMs    Int    // ölüm zamanı (ms)
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
): Promise<number> // kaydedilen event sayısı
```

Match sync sırasında veya lazy (ilk heat map isteğinde) çalışabilir.
Timeline API rate limit'e dikkat: background job olarak Inngest ile çalıştır.

### Koordinat → Piksel Dönüşümü

LoL haritası 14820×14881 birim. Harita görseli genellikle 512×512 piksel.

```typescript
function toPixel(coord: number, mapSize: number, displaySize: number): number {
  return Math.round((coord / mapSize) * displaySize);
}
```

### Isı Haritası Render (Canvas)

```typescript
// src/domains/analysis/components/DeathHeatMap.tsx
// <canvas> + konuşlandırılan blur circle'lar
// Kütüphane: heatmap.js (lightweight, MIT lisansı)
// Harita görseli: /public/images/lol-map.png (static asset)
```

Alternatif: SVG overlay (daha hafif, daha az animasyon).

### AI Özet

```typescript
// Koordinatları bölgelere dönüştür:
// x < 4000: kendi base/jungle
// 4000-10000: orta bölge / lane
// x > 10000: düşman bölgesi

async function generateDeathSummary(deathEvents: MatchDeathEvent[]): Promise<string>
// "Ölümlerinin %47'si düşman jungleda, genellikle 20-30. dakikada."
```

### API

```
GET /api/analysis/heatmap?riotAccountId=<id>&champion=Ahri&timeRange=early
Response: { deaths: { x, y, gameTimeMs }[], summary: string, totalDeaths: number }
```

---

## Ward Haritası (İkinci Aşama)

Aynı altyapıyla ward event'leri de eklenebilir:
```json
{ "type": "WARD_PLACED", "position": { "x": ..., "y": ... } }
```
Toggle ile ölüm haritası ↔ ward haritası geçişi.

---

## Files

```
prisma/schema.prisma                                        ← MatchDeathEvent model
prisma/migrations/YYYYMMDD_add_death_events/                ← YENİ
src/domains/riot/services/timelineService.ts                ← YENİ
src/inngest/functions/timelineFetcher.ts                    ← YENİ (background job)
src/domains/analysis/services/heatmapService.ts             ← koordinat → bölge, AI özet
src/domains/analysis/components/DeathHeatMap.tsx            ← YENİ (Canvas/SVG)
src/domains/analysis/components/HeatMapControls.tsx         ← YENİ (filtreler)
app/api/analysis/heatmap/route.ts                           ← YENİ
src/hooks/useDeathHeatmap.ts                                ← YENİ TanStack Query
app/(app)/analysis/page.tsx                                 ← YENİ sayfa veya mevcut
public/images/lol-map.png                                   ← statik harita görseli
```

---

## Tier Gating

- **Free:** Son 10 maç, filtre yok
- **Pro:** Son 50 maç, tüm filtreler, AI özet
- **Elite:** Ward haritası overlay

---

## Test Plan

```typescript
describe('timelineService', () => {
  it('CHAMPION_KILL event → MatchDeathEvent kaydı oluşturulur')
  it('katil olmak ölüm olarak sayılmaz (victimId kontrolü)')
  it('duplicate event → upsert ile çift kayıt olmaz')
})

describe('heatmapService', () => {
  it('x > 10000 → düşman bölgesi doğru etiketleniyor')
  it('gameTimeMs < 900000 → erken oyun (0-15dk) doğru gruplanıyor')
})
```

---

## Performance Notu

Timeline API response'ları büyük olabilir (1-2MB). Sadece `CHAMPION_KILL`
ve `WARD_PLACED` event'lerini parse et, geri kalanını discard et.

---

## Dependencies

- Riot Match Timeline API (v5) ✅ (kota var, background queue kullan)
- Inngest ✅
- heatmap.js (yeni dependency — `docs/DEPENDENCIES.md` güncelle)

---

## Definition of Done

- Koordinatlar DB'ye kaydediliyor
- Harita üzerinde ısı haritası görünüyor
- Filtreler çalışıyor
- AI özet doğru bölge analizi yapıyor
- Mobile'da harita kabul edilebilir boyutta görünüyor
- `docs/DATABASE_SCHEMA.md` güncellendi
- `docs/DEPENDENCIES.md` güncellendi
