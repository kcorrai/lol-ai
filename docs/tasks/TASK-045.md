# TASK-045 â€” [F1-1] Matchup Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Matchup Coach feature'Ä± iÃ§in domain iskeletini ve TypeScript tip tanÄ±mlarÄ±nÄ± oluÅŸtur.

---

## Acceptance Criteria

- [ ] `src/domains/matchup/` klasÃ¶r yapÄ±sÄ± oluÅŸturuldu
- [ ] `src/domains/matchup/types/matchup.types.ts` yazÄ±ldÄ±
- [ ] TÃ¼m tipler TypeScript strict modda geÃ§iyor
- [ ] `src/domains/matchup/index.ts` public API export dosyasÄ± oluÅŸturuldu
- [ ] Component placeholder dosyalarÄ± oluÅŸturuldu

---

## Teknik Gereksinimler

### KlasÃ¶r YapÄ±sÄ±

```
src/domains/matchup/
â”œâ”€â”€ services/
â”‚   â””â”€â”€ matchupAnalysisService.ts
â”œâ”€â”€ prompts/
â”‚   â””â”€â”€ matchupPrompt.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ matchup.types.ts
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ MatchupResult.tsx
â”‚   â”œâ”€â”€ MatchupSection.tsx
â”‚   â””â”€â”€ MatchupSkeleton.tsx
â””â”€â”€ index.ts
```

### Tip TanÄ±mlarÄ± (`matchup.types.ts`)

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

## BaÄŸÄ±mlÄ±lÄ±klar

- BaÄŸÄ±msÄ±z â€” paralel baÅŸlanabilir.

