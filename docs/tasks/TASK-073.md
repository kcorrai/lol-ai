# TASK-073 â€” Habit Detection Engine: Ã‡ok HaftalÄ± Pattern Analizi

**Phase:** 2 â€” AI Depth & Retention  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

`tiltService.ts` kÄ±sa vadeli tilt'i tespit ediyor (son 10 maÃ§). Bu task haftalar
boyunca tekrar eden kÃ¶tÃ¼ alÄ±ÅŸkanlÄ±klarÄ± tespit eden yeni bir servis ve DB tablosu
yazÄ±yor. Rakiplerde benzeri yok â€” retention'Ä± doÄŸrudan etkileyen Ã¶zgÃ¼n Ã¶zellik.

---

## User Story

> "Her hafta raporum 'vision score dÃ¼ÅŸÃ¼k' diyor ama 4 haftadÄ±r deÄŸiÅŸmedi.
> Biri bana 'bu problem 4 haftadÄ±r devam ediyor' deseydi belki ciddiye alÄ±rdÄ±m."

---

## Acceptance Criteria

- [ ] Son 4 haftanÄ±n `PerformanceSnapshot` kayÄ±tlarÄ± analiz ediliyor
- [ ] 2+ haftadÄ±r aynÄ± `weakestArea` varsa habit olarak iÅŸaretleniyor
- [ ] `PlayerHabit` DB tablosu oluÅŸturuldu
- [ ] Ã‡Ã¶zÃ¼len alÄ±ÅŸkanlÄ±klar `isResolved=true` olarak iÅŸaretleniyor
- [ ] `GET /api/analysis/habits` Ã§alÄ±ÅŸÄ±yor
- [ ] Match sync sonrasÄ± alÄ±ÅŸkanlÄ±klar otomatik yenileniyor
- [ ] Minimum 5 maÃ§ iÃ§eren snapshot'lar analiz ediliyor
- [ ] TypeScript strict â€” no `any`
- [ ] Unit test

---

## Desteklenen AlÄ±ÅŸkanlÄ±k Tipleri

| `habitType`         | Tespit Kriteri                                   | GÃ¶rÃ¼nen Ä°sim         |
| ------------------- | ------------------------------------------------ | ----------------------- |
| `low_vision`        | `weakestArea = 'vision_control'` 2+ hafta        | DÃ¼ÅŸÃ¼k Vizyon Skoru   |
| `high_deaths`       | `weakestArea = 'death_reduction'` 2+ hafta       | YÃ¼ksek Ã–lÃ¼m SayÄ±sÄ± |
| `low_cs`            | `weakestArea = 'cs_farming'` 2+ hafta            | DÃ¼ÅŸÃ¼k CS             |
| `late_game_throw`   | Son 3 haftada 30+ dk maÃ§larda WR < %40          | GeÃ§ Oyun HatasÄ±       |
| `tilt_prone`        | Son 4 haftada tiltScore ortalamasÄ± > 60         | Tilt EÄŸilimi           |
| `objective_neglect` | Son 3 haftada objectivesStolen ortalamasÄ± < 0.3 | AmaÃ§ Ä°hmali           |

---

## Technical Approach

### DB Migration

```prisma
model PlayerHabit {
  id            String    @id @default(uuid()) @db.Uuid
  riotAccountId String    @db.Uuid
  habitType     String    // enum benzeri string
  severity      String    // 'high' | 'medium' | 'low'
  weekCount     Int       // kaÃ§ haftadÄ±r devam ediyor
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
  severity: "high" | "medium" | "low";
  weekCount: number;
  firstDetected: string;
  isResolved: boolean;
  evidence: HabitEvidence[];
  message: string; // "Bu problem son N haftadÄ±r devam ediyor"
}

export async function detectAndPersistHabits(riotAccountId: string): Promise<DetectedHabit[]>;
export async function getActiveHabits(riotAccountId: string): Promise<DetectedHabit[]>;
```

### Tespit AlgoritmasÄ±

```typescript
async function detectHabits(riotAccountId: string) {
  // 1. Son 4 haftanÄ±n snapshot'larÄ±nÄ± Ã§ek (min 5 maÃ§ iÃ§erenler)
  const snapshots = await prisma.performanceSnapshot.findMany({
    where: {
      riotAccountId,
      gamesAnalyzed: { gte: 5 },
      periodEnd: { gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { periodEnd: "desc" },
    take: 4,
  });

  if (snapshots.length < 2) return; // yetersiz veri

  const detectedHabits: HabitCandidate[] = [];

  // 2. weakestArea tekrarÄ± kontrolÃ¼
  const weakAreas = snapshots.map((s) => s.weakestArea).filter(Boolean);
  const areaCounts = countOccurrences(weakAreas);
  for (const [area, count] of Object.entries(areaCounts)) {
    if (count >= 2) {
      detectedHabits.push(buildWeakAreaHabit(area, count, snapshots));
    }
  }

  // 3. tilt pattern kontrolÃ¼
  const tiltScores = snapshots.map((s) => Number(s.tiltScore ?? 0));
  const avgTilt = average(tiltScores);
  if (avgTilt > 60) {
    detectedHabits.push(buildTiltHabit(avgTilt, snapshots));
  }

  // 4. DB'ye upsert (yeni ise create, varsa weekCount++, Ã§Ã¶zÃ¼ldÃ¼yse resolve)
  await upsertHabits(riotAccountId, detectedHabits);
  await resolveFixedHabits(riotAccountId, detectedHabits);
}
```

### Åiddet HesabÄ±

| weekCount | severity |
| --------- | -------- |
| 2         | `medium` |
| 3         | `high`   |
| 4+        | `high`   |

### Otomatik Tetiklenme

`matchSyncService.ts`'te sync tamamlandÄ±ÄŸÄ±nda:

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

## UI Notu (Bu Task DÄ±ÅŸÄ±nda â€” AyrÄ± Ticket AÃ§Ä±labilir)

Dashboard'da "Tespit Edilen AlÄ±ÅŸkanlÄ±klar" widget'Ä±. Bu task sadece backend.

---

## Files

```
prisma/schema.prisma                                           â† PlayerHabit model
prisma/migrations/YYYYMMDD_add_player_habits/migration.sql    â† YENÄ°
src/domains/analysis/services/habitDetectionService.ts        â† YENÄ°
src/domains/analysis/services/tiltService.ts                  â† habit detection'a veri saÄŸla
src/domains/riot/services/matchSyncService.ts                 â† sync sonrasÄ± detectAndPersistHabits Ã§aÄŸÄ±r
app/api/analysis/habits/route.ts                              â† YENÄ°
src/hooks/usePlayerHabits.ts                                  â† YENÄ° (TanStack Query)
```

---

## Tier Gating

- **Free:** En kritik 1 alÄ±ÅŸkanlÄ±k (severity=high)
- **Pro:** TÃ¼m aktif alÄ±ÅŸkanlÄ±klar + geÃ§miÅŸ (Ã§Ã¶zÃ¼lenler)
- **Elite:** Mini AI aÃ§Ä±klamasÄ± her alÄ±ÅŸkanlÄ±k iÃ§in (cheap model)

---

## Test Plan

```typescript
describe("habitDetectionService", () => {
  it("2 haftada aynÄ± weakestArea â†’ habit oluÅŸturulur");
  it("1 haftada aynÄ± weakestArea â†’ habit oluÅŸturulmaz");
  it("habit Ã§Ã¶zÃ¼ldÃ¼ÄŸÃ¼nde isResolved=true olur");
  it("tilt ortalamasÄ± > 60 â†’ tilt_prone habit");
  it("5 maÃ§tan az snapshot â†’ analiz yapÄ±lmaz");
  it("severity: 2 hafta = medium, 3+ hafta = high");
});
```

---

## Dependencies

- TASK-004 (match sync) âœ…
- `PerformanceSnapshot` kayÄ±tlarÄ± mevcut olmalÄ± (weekly snapshot cron gerekebilir)

---

## Definition of Done

- Servis tÃ¼m acceptance criteria'yÄ± geÃ§iyor
- DB migration Ã§alÄ±ÅŸÄ±yor
- Sync tetiklemesi Ã§alÄ±ÅŸÄ±yor (test et: sync yap, habits endpoint'ini Ã§aÄŸÄ±r)
- Unit test coverage â‰¥ 80%
- `docs/DATABASE_SCHEMA.md` gÃ¼ncellendi
