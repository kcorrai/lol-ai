# TASK-066 â€” [F2-6] Draft Analyzer Unit Testleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

`draftAnalysisService` ve `draftPrompt` iÃ§in unit testleri yaz.

---

## Acceptance Criteria

- [ ] `src/domains/draft/services/draftAnalysisService.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] `src/domains/draft/prompts/draftPrompt.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] GerÃ§ek AI veya DB Ã§aÄŸrÄ±sÄ± yok (mock)
- [ ] Coverage: servis iÃ§in minimum %80

---

## Test SenaryolarÄ±

### `draftAnalysisService.test.ts`

```
âœ“ 10 farklÄ± champion â†’ DraftAnalysis dÃ¶ner (tÃ¼m alanlar dolu)
âœ“ cache hit â†’ aiClient.complete() Ã§aÄŸrÄ±lmaz
âœ“ cache miss â†’ AI Ã§aÄŸrÄ±lÄ±r, cache yazÄ±lÄ±r
âœ“ duplicate champion (Yasuo iki takÄ±mda) â†’ Error fÄ±rlatÄ±r
âœ“ eksik pozisyon (9 champion) â†’ Error fÄ±rlatÄ±r
âœ“ AI malformed JSON â†’ ZodError fÄ±rlatÄ±r
âœ“ TeamComposition skoru 1-10 dÄ±ÅŸÄ±nda â†’ ZodError fÄ±rlatÄ±r
```

### `draftPrompt.test.ts`

```
âœ“ tÃ¼m 10 champion adÄ± prompt'ta geÃ§iyor
âœ“ 'TOP', 'JUNGLE', 'MIDDLE' pozisyon etiketleri var
âœ“ 'TeamComposition', 'winConditions', 'scaling' kelimeleri var
âœ“ sayÄ±sal skor (1-10) talebi var
âœ“ JSON format talimatÄ± var
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-062 (draftAnalysisService + prompt) tamamlanmÄ±ÅŸ olmalÄ±
