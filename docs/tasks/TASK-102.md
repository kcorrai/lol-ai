# TASK-102 — Analytics Read Replica & Query Optimization

**Phase:** 4 — Scale & Expansion  
**Status:** Done  
**Estimated Effort:** 2 gün  
**Priority:** P1

---

## Objective

Büyük analitik sorgularını (admin dashboard, leaderboard, funnel metrics) ana
veritabanı yazma yükünden ayır. Neon'un yerleşik read replica özelliğini kullanarak
okuma ağırlıklı sorgular için ayrı bir bağlantı kur; kritik sorguları optimize et
ve yavaş query'leri tespit eden bir mekanizma ekle.

---

## Acceptance Criteria

- [ ] Neon read replica bağlantısı yapılandırılmış ve çalışıyor
- [ ] Admin analytics sorguları read replica üzerinden çalışıyor
- [ ] Leaderboard sorguları read replica üzerinden çalışıyor
- [ ] Ana Prisma client yalnızca yazma işlemleri için kullanılıyor (repo layer'da)
- [ ] Yavaş sorgular (>500ms) log'a yazılıyor
- [ ] En az 3 kritik sorguya index eklenmiş, sorgu süresi ölçülmüş
- [ ] `DATABASE_READONLY_URL` env var `.env.example`'a eklenmiş
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Neon Read Replica Kurulumu

Neon Console'dan read replica oluştur → `DATABASE_READONLY_URL` al.

```typescript
// src/lib/db/prisma.ts — mevcut

// YENİ: read replica client
// src/lib/db/prismaReadonly.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaReadonly: PrismaClient;
};

export const prismaReadonly =
  globalForPrisma.prismaReadonly ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_READONLY_URL } },
    log: [{ emit: "event", level: "query" }],
  });

prismaReadonly.$on("query", (e) => {
  if (e.duration > 500) {
    logger.warn("slow-query", { query: e.query, duration: e.duration });
  }
});
```

### Hangi Sorgular Read Replica'ya Taşınır

| Servis                 | Fonksiyon                                       | Taşı?      |
| ---------------------- | ----------------------------------------------- | ---------- |
| `adminMetricsService`  | `getDau`, `getMau`, `getSignupFunnel`           | ✅         |
| `leaderboardService`   | `getWeeklyLeaderboard`, `getMonthlyLeaderboard` | ✅         |
| `championStatsService` | `getPoolSummary`                                | ✅         |
| `matchAnalysisService` | `getMatchHistory` (liste sorgusu)               | ✅         |
| `userService`          | `createUser`, `updateSubscription`              | ❌ (write) |
| `matchSyncService`     | `upsertMatch`                                   | ❌ (write) |

### Repository Pattern Güncellemesi

```typescript
// src/domains/admin/repositories/metricsRepository.ts
import { prismaReadonly } from "@/lib/db/prismaReadonly";

export async function getDau(date: Date): Promise<number> {
  // prismaReadonly kullan
}
```

### Kritik Index'ler

```sql
-- prisma/migrations/YYYYMMDD_analytics_indexes/migration.sql

-- Leaderboard: LP kazanım sıralama
CREATE INDEX IF NOT EXISTS idx_ranked_history_user_lp
  ON ranked_histories (user_id, lp_gain, created_at DESC);

-- Match history liste sorgusu
CREATE INDEX IF NOT EXISTS idx_match_participants_user_champion
  ON match_participants (user_id, champion_id, created_at DESC);

-- Admin DAU: session tablosu veya user updated_at
CREATE INDEX IF NOT EXISTS idx_users_updated_at
  ON users (updated_at DESC);
```

### Yavaş Sorgu Tespiti

```typescript
// src/lib/db/queryMonitor.ts
// Prisma middleware olarak bağlanır, 500ms+ sorguları Sentry'e iletir

export function attachQueryMonitor(client: PrismaClient): void {
  client.$use(async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn("slow-query", { model: params.model, action: params.action, duration });
    }
    return result;
  });
}
```

---

## Files

```
src/lib/db/prismaReadonly.ts                              ← YENİ
src/lib/db/queryMonitor.ts                                ← YENİ
src/domains/admin/repositories/metricsRepository.ts      ← GÜNCELLE (readonly client)
src/domains/admin/services/leaderboardService.ts          ← GÜNCELLE (readonly client)
src/domains/analysis/services/matchAnalysisService.ts    ← GÜNCELLE (liste sorguları)
prisma/migrations/YYYYMMDD_analytics_indexes/            ← YENİ
.env.example                                              ← DATABASE_READONLY_URL ekle
```

---

## Test Plan

```typescript
describe("prismaReadonly", () => {
  it("DATABASE_READONLY_URL tanımlı değilse hata fırlatıyor");
  it("500ms+ sorgular logger.warn çağırıyor");
});

describe("metricsRepository", () => {
  it("getDau readonly client kullanıyor (spy ile doğrula)");
  it("upsert işlemleri readonly client kullanmıyor");
});
```

---

## Definition of Done

- Read replica bağlantısı production ortamında aktif
- Admin analytics ve leaderboard sorguları read replica'dan geliyor
- 3 kritik index eklenmiş, sorgu süresi öncesi/sonrası belgelenmiş
- Yavaş sorgu log'u çalışıyor
- `.env.example` güncel
- `docs/DATABASE_SCHEMA.md` read replica notları ile güncellendi
