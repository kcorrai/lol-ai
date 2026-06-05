# TASK-054 — [F7-2] otpAssistantService + otpPrompt

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

OTP Assistant'ın iş mantığını yaz. Bir champion ve rol için kapsamlı OTP rehberi üret: matchup tier list, ban öncelikleri, gizli mekanikler, power spike'lar, meta değerlendirmesi.

---

## Acceptance Criteria

- [ ] `src/domains/otp/services/otpAssistantService.ts` yazıldı
- [ ] Cache hit durumunda AI çağrılmıyor
- [ ] AI çıktısı Zod ile validate ediliyor
- [ ] `matchupTierList` her kategoride en az 3 entry içermeli (Zod ile enforce et)
- [ ] `src/domains/otp/prompts/otpPrompt.ts` yazıldı
- [ ] Prompt "OTP koçu" perspektifinden yazılmış (diğer promptlardan farklı tone)
- [ ] `otpAssistantService.ts` 250 satırı geçmiyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Servis (`otpAssistantService.ts`)

```typescript
export async function getOtpAnalysis(
  champion: string,
  role: Position
): Promise<OtpAnalysis>
```

Cache key: `buildCacheKey('otp', { champion: champion.toLowerCase(), role })`
TTL: 14 gün.

### Prompt (`otpPrompt.ts`)

`buildOtpSystemPrompt()`:
- "Sen {champion} konusunda uzmanlaşmış bir OTP koçusun. Bu şampiyonu yüzlerce saat oynadın."
- Casual overview değil, derinlemesine OTP-specific bilgi ver.

`buildOtpUserPrompt(champion, role)`:
- `matchupTierList`: easy (kolay), medium (eşit), hard (zor) — her kategoride en az 5 opponent
- `banPriority`: en öncelikli 3 ban + neden
- `hiddenMechanics`: 3-5 gizli mekanik veya interact (casual oyuncuların bilmediği)
- `powerSpikes`: level, item veya objective bazlı 4-6 spike
- `laneStrategies`: 3-5 lane strateji ipucu
- `metaRating`: 1-10 puan, değerlendirme, patch context
- JSON formatı talimatı

### Zod Schema

```typescript
export const otpAnalysisSchema = z.object({
  matchupTierList: z.object({
    easy: z.array(otpMatchupEntrySchema).min(3),
    medium: z.array(otpMatchupEntrySchema).min(3),
    hard: z.array(otpMatchupEntrySchema).min(3),
  }),
  banPriority: z.array(banEntrySchema).min(1).max(3),
  hiddenMechanics: z.array(z.string()).min(2),
  powerSpikes: z.array(otpPowerSpikeSchema).min(3),
  laneStrategies: z.array(z.string()).min(2),
  metaRating: z.object({
    score: z.number().min(1).max(10),
    assessment: z.string(),
    reasoning: z.string(),
    patchContext: z.string(),
  }),
  // ...
});
```

---

## Bağımlılıklar

- TASK-037 (AiCache)
- TASK-053 (OTP domain tipleri)
