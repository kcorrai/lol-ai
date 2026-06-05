# TASK-053 — [F7-1] OTP Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

OTP Assistant feature'ı için domain iskeletini ve TypeScript tip tanımlarını oluştur.

---

## Acceptance Criteria

- [ ] `src/domains/otp/` klasör yapısı oluşturuldu
- [ ] `src/domains/otp/types/otp.types.ts` yazıldı
- [ ] Tüm tipler TypeScript strict modda geçiyor
- [ ] `src/domains/otp/index.ts` oluşturuldu
- [ ] Component placeholder dosyaları oluşturuldu

---

## Teknik Gereksinimler

### Klasör Yapısı

```
src/domains/otp/
├── services/
│   └── otpAssistantService.ts
├── prompts/
│   └── otpPrompt.ts
├── types/
│   └── otp.types.ts
├── components/
│   ├── MatchupTierList.tsx
│   ├── BanPriority.tsx
│   ├── OtpTips.tsx
│   ├── MetaRating.tsx
│   └── OtpSkeleton.tsx
└── index.ts
```

### Tip Tanımları (`otp.types.ts`)

```typescript
import type { Position } from '@/types/common.types';

export interface OtpMatchupEntry {
  opponent: string;
  difficulty: 'easy' | 'medium' | 'hard';
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

## Bağımlılıklar

- Bağımsız — paralel başlanabilir.
