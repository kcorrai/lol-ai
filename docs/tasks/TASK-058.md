# TASK-058 — [F7-6] OTP Assistant Unit Testleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

`otpAssistantService` ve `otpPrompt` için unit testleri yaz.

---

## Acceptance Criteria

- [ ] `src/domains/otp/services/otpAssistantService.test.ts` yazıldı ve geçiyor
- [ ] `src/domains/otp/prompts/otpPrompt.test.ts` yazıldı ve geçiyor
- [ ] Gerçek AI veya DB çağrısı yok (mock)
- [ ] `matchupTierList` min 3 entry validation test ediliyor
- [ ] Coverage: servis için minimum %80

---

## Test Senaryoları

### `otpAssistantService.test.ts`

```
✓ Yasuo Mid → OtpAnalysis döner (tüm alanlar dolu)
✓ cache hit → aiClient.complete() çağrılmaz
✓ cache miss → aiClient.complete() çağrılır
✓ AI malformed JSON → ZodError fırlatır
✓ matchupTierList her kategoride < 3 entry → ZodError fırlatır
✓ metaRating.score 1-10 dışında → ZodError fırlatır
```

### `otpPrompt.test.ts`

```
✓ champion adı prompt'ta geçiyor
✓ 'hiddenMechanics', 'powerSpikes', 'banPriority' kelimeleri var
✓ 'easy', 'medium', 'hard' kategorileri talep ediliyor
✓ JSON format talimatı var
✓ OTP/uzman perspektifi system prompt'ta geçiyor
```

---

## Bağımlılıklar

- TASK-054 (otpAssistantService + prompt) tamamlanmış olmalı
