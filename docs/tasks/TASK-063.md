# TASK-063 â€” [F2-3] Draft Analyzer API Endpoint

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Draft analiz servisini HTTP API olarak expose et.

---

## Acceptance Criteria

- [ ] `app/api/draft/analyze/route.ts` oluÅŸturuldu (POST)
- [ ] TÃ¼m 10 pozisyon zorunlu validasyonu var
- [ ] Duplicate champion tespiti ve 400 hatasÄ± var
- [ ] Bilinmeyen champion iÃ§in 404 dÃ¶nÃ¼yor
- [ ] Auth gerektirmiyor (public)
- [ ] IP baÅŸÄ±na 10 req/dakika rate limit
- [ ] Free kullanÄ±cÄ±lar: gÃ¼nde 3 draft analizi
- [ ] Route handler 80 satÄ±rÄ± geÃ§miyor

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

TÃ¼m 10 champion iÃ§in DB validation (batch query â€” tek sorguda).

### PLAN_LIMITS GÃ¼ncellemesi

```typescript
draftAnalysis: {
  free: 3,    // gÃ¼nde 3
  pro: -1,
  elite: -1,
}
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-062 (draftAnalysisService) tamamlanmÄ±ÅŸ olmalÄ±

