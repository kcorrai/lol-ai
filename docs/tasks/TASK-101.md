# TASK-101 — AI Pipeline Service Extraction

**Phase:** 4 — Scale & Expansion  
**Status:** Pending  
**Estimated Effort:** 2 gün  
**Priority:** P1

---

## Objective

Coaching AI pipeline'ını (`coachingService.ts` → `promptBuilder` → `aiClient` → `responseParser`)
Inngest tabanlı async bir iş akışına dönüştür. Şu an rapor üretimi API route'ta
senkron bekliyor; uzun AI yanıtları Vercel Function timeout'una çarpabilir (max 300s).
Bu task, rapor üretimini tamamen async yaparak hem güvenilirliği hem de
kullanıcı deneyimini iyileştirir.

---

## User Story

> "Rapor oluştur dedikten sonra sayfa beklemiyor. Rapor hazır olduğunda bildirim
> alıyorum ve rapor sayfasına yönlendiriliyorum."

---

## Acceptance Criteria

- [ ] `POST /api/coaching/generate` hemen `202 Accepted` + `reportId` dönüyor
- [ ] Rapor üretimi Inngest function olarak async çalışıyor
- [ ] Rapor durumu DB'de izleniyor: `queued | generating | ready | failed`
- [ ] Kullanıcı rapor sayfasını açtığında durum polling ile takip ediliyor
- [ ] Rapor hazır olduğunda in-app bildirim gösteriliyor
- [ ] AI provider hata verirse retry (max 2) + `failed` state
- [ ] Aynı input için cache hit: Inngest function tetiklenmeden mevcut rapor dönüyor
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Mevcut Durum

```
POST /api/coaching/generate
  → coachingService.generateReport()   ← AI çağrısı burada bekliyor (5-30s)
    → promptBuilder.build()
    → aiClient.complete()              ← blokeli
    → responseParser.parse()
    → reportAssembler.assemble()
    → persist(report)
  → 200 OK { report }
```

### Hedef Mimari

```
POST /api/coaching/generate
  → cache check: mevcut rapor var mı?  → varsa 200 + report
  → CoachingReport { status: QUEUED } oluştur
  → inngest.send("coaching/report.requested", { reportId, userId, matchIds })
  → 202 Accepted { reportId }

Inngest: "coaching/report.requested"
  → step.run("prepare-data") → dataPreparator.prepare()
  → step.run("build-prompt") → promptBuilder.build()
  → step.run("call-ai")      → aiClient.complete()  ← timeout yok, Inngest yönetiyor
  → step.run("parse-response") → responseParser.parse()
  → step.run("assemble-report") → reportAssembler.assemble()
  → step.run("persist") → upsert CoachingReport { status: READY }
  → step.run("notify") → inngest.send("notification/report.ready", { userId, reportId })
```

### DB Değişikliği

```prisma
model CoachingReport {
  // ... mevcut alanlar
  status      ReportStatus @default(QUEUED)
  queuedAt    DateTime     @default(now())
  generatedAt DateTime?
  failureReason String?
}

enum ReportStatus {
  QUEUED
  GENERATING
  READY
  FAILED
}
```

### Report Status Polling

```typescript
// src/hooks/useReportStatus.ts
// Her 2 saniyede bir status kontrol eder, READY olunca invalidate eder
export function useReportStatus(reportId: string): ReportStatus

// GET /api/coaching/[reportId]/status
// → { status: "generating" | "ready" | "failed", failureReason?: string }
```

### Maliyet Takibi Hook

```typescript
// src/inngest/functions/coachingPipeline.ts
// Her AI çağrısından sonra:
await step.run("track-cost", async () => {
  await aiCostService.record({
    provider,
    model,
    promptTokens,
    completionTokens,
    userId,
    reportId,
  });
});
```

---

## Files

```
src/inngest/functions/coachingPipeline.ts         ← YENİ
src/inngest/functions/coachingPipeline.test.ts    ← YENİ
src/domains/coaching/services/coachingService.ts  ← REFACTOR (orchestration kaldır)
app/api/coaching/generate/route.ts                ← GÜNCELLE (fire-and-forget)
app/api/coaching/[reportId]/status/route.ts       ← YENİ
src/hooks/useReportStatus.ts                      ← YENİ
prisma/schema.prisma                              ← ReportStatus enum + alanlar
prisma/migrations/YYYYMMDD_report_status/         ← YENİ
```

---

## Test Plan

```typescript
describe('coachingPipeline', () => {
  it('rapor queued → generating → ready geçişi yapıyor')
  it('AI API hata verince retry yapıyor, max 2')
  it('2 retry sonrası failed state + failureReason kaydediliyor')
  it('cache hit: aynı input için Inngest tetiklenmiyor')
  it('maliyet kaydı her başarılı AI çağrısından sonra oluşuyor')
})
```

---

## Definition of Done

- API route blokeli AI çağrısı içermiyor
- Rapor üretimi async, durum polling çalışıyor
- Rapor hazır olduğunda UI otomatik güncelleniyor
- Maliyet takibi çalışıyor (mevcut /admin/ai-cost sayfasında görünüyor)
- Testler yeşil
- `docs/AI_ARCHITECTURE.md` async flow ile güncellendi
