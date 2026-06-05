# TASK-055 — [F7-3] OTP Assistant API Endpoint

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

OTP analiz servisini HTTP API olarak expose et. Free kullanıcılara kısmi sonuç dön, Pro kullanıcılara tam analiz ver.

---

## Acceptance Criteria

- [ ] `app/api/otp/route.ts` oluşturuldu (GET)
- [ ] `GET /api/otp?champion=Yasuo&role=MIDDLE` çalışıyor
- [ ] Auth opsiyonel — auth olmadan limited sonuç, Pro ile tam sonuç
- [ ] Free/anonim: `hiddenMechanics` array'i max 2 element ile truncate edilmiş
- [ ] Pro: tam analiz dönüyor
- [ ] IP başına 10 req/dakika rate limit
- [ ] Champion DB validation var
- [ ] Route handler 80 satırı geçmiyor

---

## Teknik Gereksinimler

### Route Handler

```typescript
// app/api/otp/route.ts
export async function GET(request: NextRequest) {
  // 1. Rate limit
  // 2. Query params parse + validate
  // 3. Champion DB validate
  // 4. getOtpAnalysis(champion, role) çağır
  // 5. Plan kontrolü (opsiyonel auth)
  // 6. Free ise result.hiddenMechanics = result.hiddenMechanics.slice(0, 2)
  // 7. apiSuccess(result) döndür
}
```

### Plan Gating Mantığı

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

### PLAN_LIMITS Güncellemesi

```typescript
otpAnalysis: {
  free: 3,    // günde 3 analiz
  pro: -1,
  elite: -1,
}
```

---

## Bağımlılıklar

- TASK-054 (otpAssistantService) tamamlanmış olmalı
