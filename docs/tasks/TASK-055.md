# TASK-055 â€” [F7-3] OTP Assistant API Endpoint

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

OTP analiz servisini HTTP API olarak expose et. Free kullanÄ±cÄ±lara kÄ±smi sonuÃ§ dÃ¶n, Pro kullanÄ±cÄ±lara tam analiz ver.

---

## Acceptance Criteria

- [ ] `app/api/otp/route.ts` oluÅŸturuldu (GET)
- [ ] `GET /api/otp?champion=Yasuo&role=MIDDLE` Ã§alÄ±ÅŸÄ±yor
- [ ] Auth opsiyonel â€” auth olmadan limited sonuÃ§, Pro ile tam sonuÃ§
- [ ] Free/anonim: `hiddenMechanics` array'i max 2 element ile truncate edilmiÅŸ
- [ ] Pro: tam analiz dÃ¶nÃ¼yor
- [ ] IP baÅŸÄ±na 10 req/dakika rate limit
- [ ] Champion DB validation var
- [ ] Route handler 80 satÄ±rÄ± geÃ§miyor

---

## Teknik Gereksinimler

### Route Handler

```typescript
// app/api/otp/route.ts
export async function GET(request: NextRequest) {
  // 1. Rate limit
  // 2. Query params parse + validate
  // 3. Champion DB validate
  // 4. getOtpAnalysis(champion, role) Ã§aÄŸÄ±r
  // 5. Plan kontrolÃ¼ (opsiyonel auth)
  // 6. Free ise result.hiddenMechanics = result.hiddenMechanics.slice(0, 2)
  // 7. apiSuccess(result) dÃ¶ndÃ¼r
}
```

### Plan Gating MantÄ±ÄŸÄ±

```typescript
const session = await getServerSession(authOptions);
const isPro = session
  ? await checkUserPlan(session.user.id)  // Pro veya Elite mi?
  : false;

if (!isPro) {
  result = {
    ...result,
    hiddenMechanics: result.hiddenMechanics.slice(0, 2),
  };
}
```

### PLAN_LIMITS GÃ¼ncellemesi

```typescript
otpAnalysis: {
  free: 3,    // gÃ¼nde 3 analiz
  pro: -1,
  elite: -1,
}
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-054 (otpAssistantService) tamamlanmÄ±ÅŸ olmalÄ±

