# TASK-061 â€” [F2-1] Draft Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Draft Analyzer feature'Ä± iÃ§in domain iskeletini ve TypeScript tip tanÄ±mlarÄ±nÄ± oluÅŸtur.

---

## Acceptance Criteria

- [ ] `src/domains/draft/` klasÃ¶r yapÄ±sÄ± oluÅŸturuldu
- [ ] `src/domains/draft/types/draft.types.ts` yazÄ±ldÄ±
- [ ] TÃ¼m tipler TypeScript strict modda geÃ§iyor
- [ ] `src/domains/draft/index.ts` oluÅŸturuldu
- [ ] Component placeholder dosyalarÄ± oluÅŸturuldu

---

## Teknik Gereksinimler

### KlasÃ¶r YapÄ±sÄ±

```
src/domains/draft/
â”œâ”€â”€ services/
â”‚   â””â”€â”€ draftAnalysisService.ts
â”œâ”€â”€ prompts/
â”‚   â””â”€â”€ draftPrompt.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ draft.types.ts
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ DraftInput.tsx
â”‚   â”œâ”€â”€ TeamCompositionCard.tsx
â”‚   â”œâ”€â”€ WinConditionsCard.tsx
â”‚   â”œâ”€â”€ ScalingChart.tsx
â”‚   â””â”€â”€ DraftSkeleton.tsx
â””â”€â”€ index.ts
```

### Tip TanÄ±mlarÄ± (`draft.types.ts`)

```typescript
import type { Position } from "@/types/common.types";

export type TeamSide = "blue" | "red";

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
  priority: "primary" | "secondary";
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
  advantage: "blue" | "red" | "even";
  note: string;
}

export interface DraftRisk {
  team: TeamSide;
  risk: string;
  severity: "high" | "medium" | "low";
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

## BaÄŸÄ±mlÄ±lÄ±klar

- BaÄŸÄ±msÄ±z â€” paralel baÅŸlanabilir.
