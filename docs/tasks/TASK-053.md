# TASK-053 â€” [F7-1] OTP Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

OTP Assistant feature'Ä± iÃ§in domain iskeletini ve TypeScript tip tanÄ±mlarÄ±nÄ± oluÅŸtur.

---

## Acceptance Criteria

- [ ] `src/domains/otp/` klasÃ¶r yapÄ±sÄ± oluÅŸturuldu
- [ ] `src/domains/otp/types/otp.types.ts` yazÄ±ldÄ±
- [ ] TÃ¼m tipler TypeScript strict modda geÃ§iyor
- [ ] `src/domains/otp/index.ts` oluÅŸturuldu
- [ ] Component placeholder dosyalarÄ± oluÅŸturuldu

---

## Teknik Gereksinimler

### KlasÃ¶r YapÄ±sÄ±

```
src/domains/otp/
â”œâ”€â”€ services/
â”‚   â””â”€â”€ otpAssistantService.ts
â”œâ”€â”€ prompts/
â”‚   â””â”€â”€ otpPrompt.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ otp.types.ts
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ MatchupTierList.tsx
â”‚   â”œâ”€â”€ BanPriority.tsx
â”‚   â”œâ”€â”€ OtpTips.tsx
â”‚   â”œâ”€â”€ MetaRating.tsx
â”‚   â””â”€â”€ OtpSkeleton.tsx
â””â”€â”€ index.ts
```

### Tip TanÄ±mlarÄ± (`otp.types.ts`)

```typescript
import type { Position } from "@/types/common.types";

export interface OtpMatchupEntry {
  opponent: string;
  difficulty: "easy" | "medium" | "hard";
  summary: string;
  keyTip: string;
}

export interface BanEntry {
  champion: string;
  priority: 1 | 2 | 3;
  reason: string;
}

export interface OtpPowerSpike {
  trigger: string;
  description: string;
}

export interface OtpAnalysis {
  champion: string;
  role: Position;
  matchupTierList: {
    easy: OtpMatchupEntry[];
    medium: OtpMatchupEntry[];
    hard: OtpMatchupEntry[];
  };
  banPriority: BanEntry[];
  hiddenMechanics: string[];
  powerSpikes: OtpPowerSpike[];
  laneStrategies: string[];
  metaRating: {
    score: number;
    assessment: string;
    reasoning: string;
    patchContext: string;
  };
  generatedAt: string;
}
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- BaÄŸÄ±msÄ±z â€” paralel baÅŸlanabilir.
