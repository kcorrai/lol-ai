# TASK-054 â€” [F7-2] otpAssistantService + otpPrompt

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

OTP Assistant'Ä±n iÅŸ mantÄ±ÄŸÄ±nÄ± yaz. Bir champion ve rol iÃ§in kapsamlÄ± OTP rehberi Ã¼ret: matchup tier list, ban Ã¶ncelikleri, gizli mekanikler, power spike'lar, meta deÄŸerlendirmesi.

---

## Acceptance Criteria

- [ ] `src/domains/otp/services/otpAssistantService.ts` yazÄ±ldÄ±
- [ ] Cache hit durumunda AI Ã§aÄŸrÄ±lmÄ±yor
- [ ] AI Ã§Ä±ktÄ±sÄ± Zod ile validate ediliyor
- [ ] `matchupTierList` her kategoride en az 3 entry iÃ§ermeli (Zod ile enforce et)
- [ ] `src/domains/otp/prompts/otpPrompt.ts` yazÄ±ldÄ±
- [ ] Prompt "OTP koÃ§u" perspektifinden yazÄ±lmÄ±ÅŸ (diÄŸer promptlardan farklÄ± tone)
- [ ] `otpAssistantService.ts` 250 satÄ±rÄ± geÃ§miyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Servis (`otpAssistantService.ts`)

```typescript
export async function getOtpAnalysis(champion: string, role: Position): Promise<OtpAnalysis>;
```

Cache key: `buildCacheKey('otp', { champion: champion.toLowerCase(), role })`
TTL: 14 gÃ¼n.

### Prompt (`otpPrompt.ts`)

`buildOtpSystemPrompt()`:

- "Sen {champion} konusunda uzmanlaÅŸmÄ±ÅŸ bir OTP koÃ§usun. Bu ÅŸampiyonu yÃ¼zlerce saat oynadÄ±n."
- Casual overview deÄŸil, derinlemesine OTP-specific bilgi ver.

`buildOtpUserPrompt(champion, role)`:

- `matchupTierList`: easy (kolay), medium (eÅŸit), hard (zor) â€” her kategoride en az 5 opponent
- `banPriority`: en Ã¶ncelikli 3 ban + neden
- `hiddenMechanics`: 3-5 gizli mekanik veya interact (casual oyuncularÄ±n bilmediÄŸi)
- `powerSpikes`: level, item veya objective bazlÄ± 4-6 spike
- `laneStrategies`: 3-5 lane strateji ipucu
- `metaRating`: 1-10 puan, deÄŸerlendirme, patch context
- JSON formatÄ± talimatÄ±

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

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 (AiCache)
- TASK-053 (OTP domain tipleri)
