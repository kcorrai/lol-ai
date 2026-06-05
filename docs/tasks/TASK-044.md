# TASK-044 — [F3-6] Counter Pick Unit Testleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

`generalCounterService` ve `counterPrompt` için unit testleri yaz. AI çağrısı ve cache mock'lanmalı — gerçek network bağlantısı olmamalı.

---

## Acceptance Criteria

- [ ] `src/domains/counter/services/generalCounterService.test.ts` yazıldı ve geçiyor
- [ ] `src/domains/counter/prompts/counterPrompt.test.ts` yazıldı ve geçiyor
- [ ] Tüm testler `vitest` ile çalışıyor
- [ ] Gerçek AI veya DB çağrısı yapılmıyor (mock)
- [ ] Test coverage: servis için minimum %80

---

## Test Senaryoları

### `generalCounterService.test.ts`

```
describe('getGeneralCounters')
  ✓ geçerli champion + role → GeneralCounterResult döner
  ✓ cache hit → aiClient.complete() çağrılmaz
  ✓ cache miss → aiClient.complete() çağrılır, setCached() çalışır
  ✓ aiClient hata fırlatırsa → hata propagate edilir
  ✓ AI malformed JSON döndürürse → ZodError fırlatılır
  ✓ cache'den dönen veri Zod ile validate edilmeden döndürülür (trust cache)
```

### `counterPrompt.test.ts`

```
describe('buildCounterUserPrompt')
  ✓ champion adı prompt içinde geçiyor
  ✓ role string olarak prompt içinde geçiyor
  ✓ 'topCounters', 'easyCounters', 'soloQueueCounters' kelimeleri prompt'ta var
  ✓ JSON format talimatı prompt'ta var
  ✓ patchNote açıklaması prompt'ta var
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

## Bağımlılıklar

- TASK-040 (generalCounterService + counterPrompt) tamamlanmış olmalı

---

## Notlar

- Mevcut test dosyalarına bak (örn. `coachingPipeline.test.ts`) — mock pattern aynı.
- Fixture olarak `validCounterResult` objesi oluştur — birden fazla test kullanacak.
