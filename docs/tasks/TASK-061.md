# TASK-061 — [F2-1] Draft Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Draft Analyzer feature'ı için domain iskeletini ve TypeScript tip tanımlarını oluştur.

---

## Acceptance Criteria

- [ ] `src/domains/draft/` klasör yapısı oluşturuldu
- [ ] `src/domains/draft/types/draft.types.ts` yazıldı
- [ ] Tüm tipler TypeScript strict modda geçiyor
- [ ] `src/domains/draft/index.ts` oluşturuldu
- [ ] Component placeholder dosyaları oluşturuldu

---

## Teknik Gereksinimler

### Klasör Yapısı

```
src/domains/draft/
├── services/
│   └── draftAnalysisService.ts
├── prompts/
│   └── draftPrompt.ts
├── types/
│   └── draft.types.ts
├── components/
│   ├── DraftInput.tsx
│   ├── TeamCompositionCard.tsx
│   ├── WinConditionsCard.tsx
│   ├── ScalingChart.tsx
│   └── DraftSkeleton.tsx
└── index.ts
```

### Tip Tanımları (`draft.types.ts`)

```typescript
import type { Position } from '@/types/common.types';

export type TeamSide = 'blue' | 'red';

export interface TeamComposition {
  engagePower: number;
  disengagePower: number;
  teamfightPower: number;
  pickPotential: number;
  splitPushPower: number;
  summary: string;
}

export interface WinCondition {
  description: string;
  priority: 'primary' | 'secondary';
  howToAchieve: string;
}

export interface ScalingProfile {
  earlyGame: { score: number; description: string };
  midGame: { score: number; description: string };
  lateGame: { score: number; description: string };
}

export interface KeyMatchup {
  blue: string;
  red: string;
  advantage: 'blue' | 'red' | 'even';
  note: string;
}

export interface DraftRisk {
  team: TeamSide;
  risk: string;
  severity: 'high' | 'medium' | 'low';
}

export type TeamPicks = Record<Position, string>;

export interface DraftInput {
  blueTeam: TeamPicks;
  redTeam: TeamPicks;
}

export interface DraftAnalysis {
  blueTeam: TeamPicks;
  redTeam: TeamPicks;
  blueTeamComposition: TeamComposition;
  redTeamComposition: TeamComposition;
  blueWinConditions: WinCondition[];
  redWinConditions: WinCondition[];
  blueScaling: ScalingProfile;
  redScaling: ScalingProfile;
  keyMatchups: KeyMatchup[];
  risks: DraftRisk[];
  verdict: string;
  generatedAt: string;
}
```

---

## Bağımlılıklar

- Bağımsız — paralel başlanabilir.
