# TASK-047 — [F1-3] Matchup Coach API Endpoint

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Matchup analiz servisini HTTP API olarak expose et. Public endpoint, rate limited. Free kullanıcılar için günlük limit uygula.

---

## Acceptance Criteria

- [ ] `app/api/matchup/route.ts` oluşturuldu (POST)
- [ ] Body validation: champion, opponent, role zorunlu
- [ ] Aynı champion seçilirse 400 dönüyor
- [ ] Bilinmeyen champion için 404 dönüyor
- [ ] Auth gerektirmiyor (public)
- [ ] IP başına 15 req/dakika rate limit var
- [ ] Free kullanıcılar için günde 5 sorgu limiti (userId varsa user bazlı, yoksa IP bazlı)
- [ ] `PLAN_LIMITS` objesine `matchupAnalysis` eklendi
- [ ] Route handler 80 satırı geçmiyor

---

## Teknik Gereksinimler

### Route Handler

```
POST /api/matchup/analyze
Body: { champion: string, opponent: string, role: Position }
```

Adımlar:
1. Rate limit (IP, 15/dakika)
2. Body Zod validation
3. Her iki champion için DB validate (case-insensitive)
4. Aynı champion guard
5. Opsiyonel auth check (session varsa plan limit kontrol et)
6. `getMatchupAnalysis(champion, opponent, role)` çağır
7. `apiSuccess(result)` döndür

### Plan Limits

Mevcut `PLAN_LIMITS` objesini bul ve güncelle:
```typescript
matchupAnalysis: {
  free: 5,    // günde 5
  pro: -1,    // sınırsız
  elite: -1,
}
```

---

## Bağımlılıklar

- TASK-046 (matchupAnalysisService) tamamlanmış olmalı
