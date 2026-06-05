# TASK-045 — [F1-1] Matchup Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Matchup Coach feature'ı için domain iskeletini ve TypeScript tip tanımlarını oluştur.

---

## Acceptance Criteria

- [ ] `src/domains/matchup/` klasör yapısı oluşturuldu
- [ ] `src/domains/matchup/types/matchup.types.ts` yazıldı
- [ ] Tüm tipler TypeScript strict modda geçiyor
- [ ] `src/domains/matchup/index.ts` public API export dosyası oluşturuldu
- [ ] Component placeholder dosyaları oluşturuldu

---

## Teknik Gereksinimler

### Klasör Yapısı

```
src/domains/matchup/
├── services/
│   └── matchupAnalysisService.ts
├── prompts/
│   └── matchupPrompt.ts
├── types/
│   └── matchup.types.ts
├── components/
│   ├── MatchupResult.tsx
│   ├── MatchupSection.tsx
│   └── MatchupSkeleton.tsx
└── index.ts
```

### Tip Tanımları (`matchup.types.ts`)

```typescript
import type { Position } from '@/types/common.types';

export interface PowerSpike {
  level?: number;
  item?: string;
  description: string;
}

export interface TradeScenario {
  scenario: string;
  advantage: 'you' | 'opponent' | 'even';
  tip: string;
}

export interface MatchupAnalysis {
  champion: string;
  opponent: string;
  role: Position;
  laneAnalysis: {
    advantage: 'favorable' | 'unfavorable' | 'even';
    summary: string;
    levels1to3: string;
    level6Plan: string;
    powerSpikes: PowerSpike[];
  };
  tradeGuide: {
    shortTrade: TradeScenario;
    longTrade: TradeScenario;
    winConditions: string[];
    loseConditions: string[];
  };
  buildAdvice: {
    startingItems: string[];
    coreItems: string[];
    situationalItems: string[];
    reasoning: string;
  };
  criticalMistakes: {
    avoidTrades: string[];
    riskyTimings: string[];
    keyMistakes: string[];
  };
  generatedAt: string;
  patchNote: string;
}
```

---

## Bağımlılıklar

- Bağımsız — paralel başlanabilir.
