# TASK-044 â€” [F3-6] Counter Pick Unit Testleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

`generalCounterService` ve `counterPrompt` iÃ§in unit testleri yaz. AI Ã§aÄŸrÄ±sÄ± ve cache mock'lanmalÄ± â€” gerÃ§ek network baÄŸlantÄ±sÄ± olmamalÄ±.

---

## Acceptance Criteria

- [ ] `src/domains/counter/services/generalCounterService.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] `src/domains/counter/prompts/counterPrompt.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] TÃ¼m testler `vitest` ile Ã§alÄ±ÅŸÄ±yor
- [ ] GerÃ§ek AI veya DB Ã§aÄŸrÄ±sÄ± yapÄ±lmÄ±yor (mock)
- [ ] Test coverage: servis iÃ§in minimum %80

---

## Test SenaryolarÄ±

### `generalCounterService.test.ts`

```
describe('getGeneralCounters')
  âœ“ geÃ§erli champion + role â†’ GeneralCounterResult dÃ¶ner
  âœ“ cache hit â†’ aiClient.complete() Ã§aÄŸrÄ±lmaz
  âœ“ cache miss â†’ aiClient.complete() Ã§aÄŸrÄ±lÄ±r, setCached() Ã§alÄ±ÅŸÄ±r
  âœ“ aiClient hata fÄ±rlatÄ±rsa â†’ hata propagate edilir
  âœ“ AI malformed JSON dÃ¶ndÃ¼rÃ¼rse â†’ ZodError fÄ±rlatÄ±lÄ±r
  âœ“ cache'den dÃ¶nen veri Zod ile validate edilmeden dÃ¶ndÃ¼rÃ¼lÃ¼r (trust cache)
```

### `counterPrompt.test.ts`

```
describe('buildCounterUserPrompt')
  âœ“ champion adÄ± prompt iÃ§inde geÃ§iyor
  âœ“ role string olarak prompt iÃ§inde geÃ§iyor
  âœ“ 'topCounters', 'easyCounters', 'soloQueueCounters' kelimeleri prompt'ta var
  âœ“ JSON format talimatÄ± prompt'ta var
  âœ“ patchNote aÃ§Ä±klamasÄ± prompt'ta var
```

### Mock Kurulumu

```typescript
vi.mock('@/lib/ai/client', () => ({
  aiClient: {
    complete: vi.fn(),
  },
}));

vi.mock('@/lib/ai/aiCache', () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
  buildCacheKey: vi.fn().mockReturnValue('test-cache-key'),
  incrementHit: vi.fn(),
}));
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-040 (generalCounterService + counterPrompt) tamamlanmÄ±ÅŸ olmalÄ±

---

## Notlar

- Mevcut test dosyalarÄ±na bak (Ã¶rn. `coachingPipeline.test.ts`) â€” mock pattern aynÄ±.
- Fixture olarak `validCounterResult` objesi oluÅŸtur â€” birden fazla test kullanacak.

