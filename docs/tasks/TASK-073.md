# TASK-073 — Habit Detection Engine: Çok Haftalı Pattern Analizi

**Phase:** 2 — AI Depth & Retention  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

`tiltService.ts` kısa vadeli tilt'i tespit ediyor (son 10 maç). Bu task haftalar
boyunca tekrar eden kötü alışkanlıkları tespit eden yeni bir servis ve DB tablosu
yazıyor. Rakiplerde benzeri yok — retention'ı doğrudan etkileyen özgün özellik.

---

## User Story

> "Her hafta raporum 'vision score düşük' diyor ama 4 haftadır değişmedi.
> Biri bana 'bu problem 4 haftadır devam ediyor' deseydi belki ciddiye alırdım."

---

## Acceptance Criteria

- [ ] Son 4 haftanın `PerformanceSnapshot` kayıtları analiz ediliyor
- [ ] 2+ haftadır aynı `weakestArea` varsa habit olarak işaretleniyor
- [ ] `PlayerHabit` DB tablosu oluşturuldu
- [ ] Çözülen alışkanlıklar `isResolved=true` olarak işaretleniyor
- [ ] `GET /api/analysis/habits` çalışıyor
- [ ] Match sync sonrası alışkanlıklar otomatik yenileniyor
- [ ] Minimum 5 maç içeren snapshot'lar analiz ediliyor
- [ ] TypeScript strict — no `any`
- [ ] Unit test

---

## Desteklenen Alışkanlık Tipleri

| `habitType` | Tespit Kriteri | Görünen İsim |
|---|---|---|
| `low_vision` | `weakestArea = 'vision_control'` 2+ hafta | Düşük Vizyon Skoru |
| `high_deaths` | `weakestArea = 'death_reduction'` 2+ hafta | Yüksek Ölüm Sayısı |
| `low_cs` | `weakestArea = 'cs_farming'` 2+ hafta | Düşük CS |
| `late_game_throw` | Son 3 haftada 30+ dk maçlarda WR < %40 | Geç Oyun Hatası |
| `tilt_prone` | Son 4 haftada tiltScore ortalaması > 60 | Tilt Eğilimi |
| `objective_neglect` | Son 3 haftada objectivesStolen ortalaması < 0.3 | Amaç İhmali |

---

## Technical Approach

### DB Migration

```prisma
model PlayerHabit {
  id            String    @id @default(uuid()) @db.Uuid
  riotAccountId String    @db.Uuid
  habitType     String    // enum benzeri string
  severity      String    // 'high' | 'medium' | 'low'
  weekCount     Int       // kaç haftadır devam ediyor
  firstDetected DateTime
  lastDetected  DateTime
  isResolved    Boolean   @default(false)
  resolvedAt    DateTime?
  evidence      Json      // [ { snapshotId, weekLabel, value } ]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  riotAccount RiotAccount @relation(fields: [riotAccountId], references: [id], onDelete: Cascade)

  @@index([riotAccountId, isResolved])
  @@map("player_habits")
}
```

`RiotAccount` modeline ekle: `habits PlayerHabit[]`

### Servis: `src/domains/analysis/services/habitDetectionService.ts`

```typescript
export interface DetectedHabit {
  id: string;
  habitType: string;
  displayName: string;
  severity: 'high' | 'medium' | 'low';
  weekCount: number;
  firstDetected: string;
  isResolved: boolean;
  evidence: HabitEvidence[];
  message: string;  // "Bu problem son N haftadır devam ediyor"
}

export async function detectAndPersistHabits(riotAccountId: string): Promise<DetectedHabit[]>
export async function getActiveHabits(riotAccountId: string): Promise<DetectedHabit[]>
```

### Tespit Algoritması

```typescript
async function detectHabits(riotAccountId: string) {
  // 1. Son 4 haftanın snapshot'larını çek (min 5 maç içerenler)
  const snapshots = await prisma.performanceSnapshot.findMany({
    where: {
      riotAccountId,
      gamesAnalyzed: { gte: 5 },
      periodEnd: { gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) }
    },
    orderBy: { periodEnd: 'desc' },
    take: 4
  });

  if (snapshots.length < 2) return; // yetersiz veri

  const detectedHabits: HabitCandidate[] = [];

  // 2. weakestArea tekrarı kontrolü
  const weakAreas = snapshots.map(s => s.weakestArea).filter(Boolean);
  const areaCounts = countOccurrences(weakAreas);
  for (const [area, count] of Object.entries(areaCounts)) {
    if (count >= 2) {
      detectedHabits.push(buildWeakAreaHabit(area, count, snapshots));
    }
  }

  // 3. tilt pattern kontrolü
  const tiltScores = snapshots.map(s => Number(s.tiltScore ?? 0));
  const avgTilt = average(tiltScores);
  if (avgTilt > 60) {
    detectedHabits.push(buildTiltHabit(avgTilt, snapshots));
  }

  // 4. DB'ye upsert (yeni ise create, varsa weekCount++, çözüldüyse resolve)
  await upsertHabits(riotAccountId, detectedHabits);
  await resolveFixedHabits(riotAccountId, detectedHabits);
}
```

### Şiddet Hesabı

| weekCount | severity |
|---|---|
| 2 | `medium` |
| 3 | `high` |
| 4+ | `high` |

### Otomatik Tetiklenme

`matchSyncService.ts`'te sync tamamlandığında:
```typescript
// sync bittikten sonra fire-and-forget
detectAndPersistHabits(riotAccountId).catch(logger.error);
```

### Endpoint

```
GET /api/analysis/habits?riotAccountId=<uuid>

Response 200:
{
  "habits": DetectedHabit[],
  "lastAnalyzed": "ISO date",
  "snapshotsAnalyzed": 4
}
```

---

## UI Notu (Bu Task Dışında — Ayrı Ticket Açılabilir)

Dashboard'da "Tespit Edilen Alışkanlıklar" widget'ı. Bu task sadece backend.

---

## Files

```
prisma/schema.prisma                                           ← PlayerHabit model
prisma/migrations/YYYYMMDD_add_player_habits/migration.sql    ← YENİ
src/domains/analysis/services/habitDetectionService.ts        ← YENİ
src/domains/analysis/services/tiltService.ts                  ← habit detection'a veri sağla
src/domains/riot/services/matchSyncService.ts                 ← sync sonrası detectAndPersistHabits çağır
app/api/analysis/habits/route.ts                              ← YENİ
src/hooks/usePlayerHabits.ts                                  ← YENİ (TanStack Query)
```

---

## Tier Gating

- **Free:** En kritik 1 alışkanlık (severity=high)
- **Pro:** Tüm aktif alışkanlıklar + geçmiş (çözülenler)
- **Elite:** Mini AI açıklaması her alışkanlık için (cheap model)

---

## Test Plan

```typescript
describe('habitDetectionService', () => {
  it('2 haftada aynı weakestArea → habit oluşturulur')
  it('1 haftada aynı weakestArea → habit oluşturulmaz')
  it('habit çözüldüğünde isResolved=true olur')
  it('tilt ortalaması > 60 → tilt_prone habit')
  it('5 maçtan az snapshot → analiz yapılmaz')
  it('severity: 2 hafta = medium, 3+ hafta = high')
})
```

---

## Dependencies

- TASK-004 (match sync) ✅
- `PerformanceSnapshot` kayıtları mevcut olmalı (weekly snapshot cron gerekebilir)

---

## Definition of Done

- Servis tüm acceptance criteria'yı geçiyor
- DB migration çalışıyor
- Sync tetiklemesi çalışıyor (test et: sync yap, habits endpoint'ini çağır)
- Unit test coverage ≥ 80%
- `docs/DATABASE_SCHEMA.md` güncellendi
