# TASK-066 — [F2-6] Draft Analyzer Unit Testleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

`draftAnalysisService` ve `draftPrompt` için unit testleri yaz.

---

## Acceptance Criteria

- [ ] `src/domains/draft/services/draftAnalysisService.test.ts` yazıldı ve geçiyor
- [ ] `src/domains/draft/prompts/draftPrompt.test.ts` yazıldı ve geçiyor
- [ ] Gerçek AI veya DB çağrısı yok (mock)
- [ ] Coverage: servis için minimum %80

---

## Test Senaryoları

### `draftAnalysisService.test.ts`

```
✓ 10 farklı champion → DraftAnalysis döner (tüm alanlar dolu)
✓ cache hit → aiClient.complete() çağrılmaz
✓ cache miss → AI çağrılır, cache yazılır
✓ duplicate champion (Yasuo iki takımda) → Error fırlatır
✓ eksik pozisyon (9 champion) → Error fırlatır
✓ AI malformed JSON → ZodError fırlatır
✓ TeamComposition skoru 1-10 dışında → ZodError fırlatır
```

### `draftPrompt.test.ts`

```
✓ tüm 10 champion adı prompt'ta geçiyor
✓ 'TOP', 'JUNGLE', 'MIDDLE' pozisyon etiketleri var
✓ 'TeamComposition', 'winConditions', 'scaling' kelimeleri var
✓ sayısal skor (1-10) talebi var
✓ JSON format talimatı var
```

---

## Bağımlılıklar

- TASK-062 (draftAnalysisService + prompt) tamamlanmış olmalı
