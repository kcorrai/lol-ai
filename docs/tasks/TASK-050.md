# TASK-050 â€” [F1-6] Matchup Coach Unit Testleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

`matchupAnalysisService` ve `matchupPrompt` iÃ§in unit testleri yaz.

---

## Acceptance Criteria

- [ ] `src/domains/matchup/services/matchupAnalysisService.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] `src/domains/matchup/prompts/matchupPrompt.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] GerÃ§ek AI veya DB Ã§aÄŸrÄ±sÄ± yok (mock)
- [ ] Coverage: servis iÃ§in minimum %80

---

## Test SenaryolarÄ±

### `matchupAnalysisService.test.ts`

```
âœ“ Yasuo vs Zed Mid â†’ MatchupAnalysis dÃ¶ner (tÃ¼m alanlar dolu)
âœ“ cache hit â†’ aiClient.complete() Ã§aÄŸrÄ±lmaz
âœ“ cache miss â†’ aiClient.complete() Ã§aÄŸrÄ±lÄ±r, setCached Ã§alÄ±ÅŸÄ±r
âœ“ yasuo vs yasuo â†’ Error('Ä°ki farklÄ± ÅŸampiyon seÃ§ilmelidir') fÄ±rlatÄ±r
âœ“ AI malformed JSON â†’ ZodError fÄ±rlatÄ±r
âœ“ AI hata â†’ propagate edilir
```

### `matchupPrompt.test.ts`

```
âœ“ champion adÄ± prompt'ta geÃ§iyor
âœ“ opponent adÄ± prompt'ta geÃ§iyor
âœ“ role string olarak prompt'ta geÃ§iyor
âœ“ 'laneAnalysis', 'tradeGuide', 'buildAdvice', 'criticalMistakes' kelimeleri var
âœ“ JSON format talimatÄ± var
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-046 (matchupAnalysisService + prompt) tamamlanmÄ±ÅŸ olmalÄ±

