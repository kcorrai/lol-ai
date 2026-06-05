# TASK-050 — [F1-6] Matchup Coach Unit Testleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

`matchupAnalysisService` ve `matchupPrompt` için unit testleri yaz.

---

## Acceptance Criteria

- [ ] `src/domains/matchup/services/matchupAnalysisService.test.ts` yazıldı ve geçiyor
- [ ] `src/domains/matchup/prompts/matchupPrompt.test.ts` yazıldı ve geçiyor
- [ ] Gerçek AI veya DB çağrısı yok (mock)
- [ ] Coverage: servis için minimum %80

---

## Test Senaryoları

### `matchupAnalysisService.test.ts`

```
✓ Yasuo vs Zed Mid → MatchupAnalysis döner (tüm alanlar dolu)
✓ cache hit → aiClient.complete() çağrılmaz
✓ cache miss → aiClient.complete() çağrılır, setCached çalışır
✓ yasuo vs yasuo → Error('İki farklı şampiyon seçilmelidir') fırlatır
✓ AI malformed JSON → ZodError fırlatır
✓ AI hata → propagate edilir
```

### `matchupPrompt.test.ts`

```
✓ champion adı prompt'ta geçiyor
✓ opponent adı prompt'ta geçiyor
✓ role string olarak prompt'ta geçiyor
✓ 'laneAnalysis', 'tradeGuide', 'buildAdvice', 'criticalMistakes' kelimeleri var
✓ JSON format talimatı var
```

---

## Bağımlılıklar

- TASK-046 (matchupAnalysisService + prompt) tamamlanmış olmalı
