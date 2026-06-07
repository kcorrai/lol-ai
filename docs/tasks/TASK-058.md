# TASK-058 â€” [F7-6] OTP Assistant Unit Testleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

`otpAssistantService` ve `otpPrompt` iÃ§in unit testleri yaz.

---

## Acceptance Criteria

- [ ] `src/domains/otp/services/otpAssistantService.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] `src/domains/otp/prompts/otpPrompt.test.ts` yazÄ±ldÄ± ve geÃ§iyor
- [ ] GerÃ§ek AI veya DB Ã§aÄŸrÄ±sÄ± yok (mock)
- [ ] `matchupTierList` min 3 entry validation test ediliyor
- [ ] Coverage: servis iÃ§in minimum %80

---

## Test SenaryolarÄ±

### `otpAssistantService.test.ts`

```
âœ“ Yasuo Mid â†’ OtpAnalysis dÃ¶ner (tÃ¼m alanlar dolu)
âœ“ cache hit â†’ aiClient.complete() Ã§aÄŸrÄ±lmaz
âœ“ cache miss â†’ aiClient.complete() Ã§aÄŸrÄ±lÄ±r
âœ“ AI malformed JSON â†’ ZodError fÄ±rlatÄ±r
âœ“ matchupTierList her kategoride < 3 entry â†’ ZodError fÄ±rlatÄ±r
âœ“ metaRating.score 1-10 dÄ±ÅŸÄ±nda â†’ ZodError fÄ±rlatÄ±r
```

### `otpPrompt.test.ts`

```
âœ“ champion adÄ± prompt'ta geÃ§iyor
âœ“ 'hiddenMechanics', 'powerSpikes', 'banPriority' kelimeleri var
âœ“ 'easy', 'medium', 'hard' kategorileri talep ediliyor
âœ“ JSON format talimatÄ± var
âœ“ OTP/uzman perspektifi system prompt'ta geÃ§iyor
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-054 (otpAssistantService + prompt) tamamlanmÄ±ÅŸ olmalÄ±

