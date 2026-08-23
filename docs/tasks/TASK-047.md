# TASK-047 â€” [F1-3] Matchup Coach API Endpoint

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Matchup analiz servisini HTTP API olarak expose et. Public endpoint, rate limited. Free kullanÄ±cÄ±lar iÃ§in gÃ¼nlÃ¼k limit uygula.

---

## Acceptance Criteria

- [ ] `app/api/matchup/route.ts` oluÅŸturuldu (POST)
- [ ] Body validation: champion, opponent, role zorunlu
- [ ] AynÄ± champion seÃ§ilirse 400 dÃ¶nÃ¼yor
- [ ] Bilinmeyen champion iÃ§in 404 dÃ¶nÃ¼yor
- [ ] Auth gerektirmiyor (public)
- [ ] IP baÅŸÄ±na 15 req/dakika rate limit var
- [ ] Free kullanÄ±cÄ±lar iÃ§in gÃ¼nde 5 sorgu limiti (userId varsa user bazlÄ±, yoksa IP bazlÄ±)
- [ ] `PLAN_LIMITS` objesine `matchupAnalysis` eklendi
- [ ] Route handler 80 satÄ±rÄ± geÃ§miyor

---

## Teknik Gereksinimler

### Route Handler

```
POST /api/matchup/analyze
Body: { champion: string, opponent: string, role: Position }
```

AdÄ±mlar:

1. Rate limit (IP, 15/dakika)
2. Body Zod validation
3. Her iki champion iÃ§in DB validate (case-insensitive)
4. AynÄ± champion guard
5. Opsiyonel auth check (session varsa plan limit kontrol et)
6. `getMatchupAnalysis(champion, opponent, role)` Ã§aÄŸÄ±r
7. `apiSuccess(result)` dÃ¶ndÃ¼r

### Plan Limits

Mevcut `PLAN_LIMITS` objesini bul ve gÃ¼ncelle:

```typescript
matchupAnalysis: {
  free: 5,    // gÃ¼nde 5
  pro: -1,    // sÄ±nÄ±rsÄ±z
  elite: -1,
}
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-046 (matchupAnalysisService) tamamlanmÄ±ÅŸ olmalÄ±
