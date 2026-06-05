# TASK-063 — [F2-3] Draft Analyzer API Endpoint

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Draft analiz servisini HTTP API olarak expose et.

---

## Acceptance Criteria

- [ ] `app/api/draft/analyze/route.ts` oluşturuldu (POST)
- [ ] Tüm 10 pozisyon zorunlu validasyonu var
- [ ] Duplicate champion tespiti ve 400 hatası var
- [ ] Bilinmeyen champion için 404 dönüyor
- [ ] Auth gerektirmiyor (public)
- [ ] IP başına 10 req/dakika rate limit
- [ ] Free kullanıcılar: günde 3 draft analizi
- [ ] Route handler 80 satırı geçmiyor

---

## Teknik Gereksinimler

### Route Handler

```
POST /api/draft/analyze
Body: {
  blueTeam: { TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY: string },
  redTeam:  { TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY: string }
}
```

Zod body schema:
```typescript
const teamSchema = z.object({
  TOP: z.string().min(1),
  JUNGLE: z.string().min(1),
  MIDDLE: z.string().min(1),
  BOTTOM: z.string().min(1),
  UTILITY: z.string().min(1),
});

const bodySchema = z.object({
  blueTeam: teamSchema,
  redTeam: teamSchema,
});
```

Tüm 10 champion için DB validation (batch query — tek sorguda).

### PLAN_LIMITS Güncellemesi

```typescript
draftAnalysis: {
  free: 3,    // günde 3
  pro: -1,
  elite: -1,
}
```

---

## Bağımlılıklar

- TASK-062 (draftAnalysisService) tamamlanmış olmalı
