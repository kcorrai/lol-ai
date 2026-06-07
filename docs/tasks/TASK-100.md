# TASK-100 — Match Sync Service Extraction

**Phase:** 4 — Scale & Expansion  
**Status:** Pending  
**Estimated Effort:** 3 gün  
**Priority:** P1

---

## Objective

`matchSyncService.ts` içindeki match senkronizasyon mantığını monolitten çıkarıp
tam bir Inngest background worker mimarisine taşı. Şu an sync işlemi API route
içinde senkron çalışıyor; bu hem Vercel timeout riskini hem de kullanıcı bekleme
süresini artırıyor. Phase 4'te 10K+ kullanıcı hedefiyle bu iş akışı async olmalı,
retry/backoff desteklemeli ve gözlemlenebilir olmalı.

---

## User Story

> "Riot hesabımı bağladığımda maçlarım arka planda yükleniyor ve ben dashboard'a
> döndüğümde hazır oluyor. Sayfa yüklenirken beklemiyorum."

---

## Acceptance Criteria

- [ ] Match sync işlemi API route'ta bloke etmiyor — Inngest event tetikleyen fire-and-forget pattern
- [ ] `riot/sync` endpoint hemen `202 Accepted` dönüyor
- [ ] Inngest function: her maç ayrı adım olarak işleniyor (fan-out pattern)
- [ ] Başarısız maç fetch'leri otomatik retry yapıyor (max 3, exponential backoff)
- [ ] Riot API 429 rate limit tepkisi: Inngest `sleep` ile bekleme
- [ ] Sync durumu DB'ye yazılıyor: `pending | running | completed | failed`
- [ ] Dashboard'da sync progress göstergesi çalışıyor
- [ ] Duplicate sync engellenmiş: aynı `riotAccountId` için paralel sync yok
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Mevcut Durum

```
POST /api/riot/sync
  → matchSyncService.syncMatches()   ← senkron, timeout riski
    → riotApiClient.getMatchIds()
    → for each matchId: riotApiClient.getMatch()
    → persist()
  → 200 OK (maçlar yüklendiyse)
```

### Hedef Mimari

```
POST /api/riot/sync
  → inngest.send("riot/sync.requested", { riotAccountId })
  → 202 Accepted

Inngest: "riot/sync.requested"
  → step.run("fetch-match-ids") → getMatchIds()
  → step.run("filter-new-matches") → DB'de olmayanları filtrele
  → for each matchId:
      inngest.send("riot/match.fetch-requested", { matchId, riotAccountId })

Inngest: "riot/match.fetch-requested"
  → step.run("fetch-match") → riotApiClient.getMatch()
  → step.run("persist-match") → upsert Match + MatchParticipant
  → step.run("trigger-analysis") → inngest.send("analysis/match.ready")
```

### Yeni DB Alanı

```prisma
model RiotAccount {
  // ... mevcut alanlar
  syncStatus    SyncStatus @default(IDLE)
  syncStartedAt DateTime?
  syncCompletedAt DateTime?
  lastSyncError  String?
}

enum SyncStatus {
  IDLE
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

### Inngest Functions

```typescript
// src/inngest/functions/matchSync.ts
export const matchSyncOrchestrator = inngest.createFunction(
  { id: "match-sync-orchestrator", concurrency: { limit: 1, key: "event.data.riotAccountId" } },
  { event: "riot/sync.requested" },
  async ({ event, step }) => { ... }
)

export const matchFetcher = inngest.createFunction(
  { id: "match-fetcher", retries: 3 },
  { event: "riot/match.fetch-requested" },
  async ({ event, step }) => { ... }
)
```

### Sync Progress API

```
GET /api/riot/sync/status?riotAccountId=xxx
→ { status: "running", totalMatches: 20, syncedMatches: 12 }
```

---

## Files

```
src/inngest/functions/matchSync.ts               ← YENİ (orchestrator + fetcher)
src/inngest/functions/matchSync.test.ts          ← YENİ
src/domains/riot/services/matchSyncService.ts    ← REFACTOR (senkron kodu kaldır, Inngest'e taşı)
app/api/riot/sync/route.ts                       ← GÜNCELLE (fire-and-forget)
app/api/riot/sync/status/route.ts                ← YENİ
src/hooks/useSyncStatus.ts                       ← YENİ (polling hook)
prisma/schema.prisma                             ← syncStatus alanları
prisma/migrations/YYYYMMDD_sync_status/          ← YENİ
```

---

## Test Plan

```typescript
describe('matchSyncOrchestrator', () => {
  it('riot account için sync tetiklenince status RUNNING oluyor')
  it('tüm maçlar senkronize edilince status COMPLETED oluyor')
  it('Riot API 429 → sleep + retry yapıyor')
  it('aynı riotAccountId için paralel sync başlamıyor (concurrency key)')
  it('3 başarısız retry sonrası status FAILED, hata mesajı DB\'ye yazılıyor')
})
```

---

## Definition of Done

- API route'tan senkron match fetch kodu kaldırıldı
- Inngest fan-out çalışıyor, her maç ayrı step
- Dashboard sync progress göstergesi gerçek zamanlı güncelleniyor
- `prisma migrate` çalışıyor
- Testler yeşil
- `docs/ARCHITECTURE.md` güncellendi (async sync flow diyagramı)
