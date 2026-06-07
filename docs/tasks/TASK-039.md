# TASK-039 â€” [F3-1] Counter Pick Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

F3 Counter Pick Generator feature'Ä± iÃ§in domain iskeletini ve TypeScript tip tanÄ±mlarÄ±nÄ± oluÅŸtur. Bu task sonraki F3 task'larÄ±nÄ±n (servis, API, hook, UI) temelini kurar.

---

## Acceptance Criteria

- [ ] `src/domains/counter/` klasÃ¶r yapÄ±sÄ± oluÅŸturuldu
- [ ] `src/domains/counter/types/counter.types.ts` dosyasÄ± yazÄ±ldÄ±
- [ ] TÃ¼m tipler TypeScript strict modda geÃ§iyor (`any` yok)
- [ ] `src/domains/counter/index.ts` public API export dosyasÄ± oluÅŸturuldu
- [ ] Component placeholder dosyalarÄ± oluÅŸturuldu (boÅŸ export, iÃ§i dolu olmak zorunda deÄŸil)

---

## Teknik Gereksinimler

### KlasÃ¶r YapÄ±sÄ±

```
src/domains/counter/
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ generalCounterService.ts
â”‚   â””â”€â”€ personalCounterService.ts
â”œâ”€â”€ prompts/
â”‚   â””â”€â”€ counterPrompt.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ counter.types.ts
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ CounterList.tsx
â”‚   â”œâ”€â”€ CounterCard.tsx
â”‚   â””â”€â”€ CounterPageSkeleton.tsx
â””â”€â”€ index.ts
```

### Tip TanÄ±mlarÄ± (`counter.types.ts`)

```typescript
import type { Position } from '@/types/common.types';

export interface CounterEntry {
  champion: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reasonWhy: string;
  laneAdvantage: string;
  watchOut: string;
  buildHint: string;
  tier: 'S' | 'A' | 'B';
}

export interface GeneralCounterResult {
  champion: string;
  role: Position;
  topCounters: CounterEntry[];
  easyCounters: CounterEntry[];
  soloQueueCounters: CounterEntry[];
  tips: string[];
  generatedAt: string;
  patchNote: string;
}
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 (AiCache) â€” servis yazÄ±lÄ±rken gerekecek, tip tanÄ±mlarÄ± iÃ§in deÄŸil.
- Bu task baÄŸÄ±msÄ±z olarak baÅŸlanabilir.

---

## Notlar

- `index.ts`'de ÅŸimdilik sadece tipleri export et. Servis ve component'ler ilgili task'larda eklenecek.
- Component dosyalarÄ± ÅŸimdilik `export {}` ile boÅŸ bÄ±rakÄ±labilir â€” sadece klasÃ¶r yapÄ±sÄ± kurulsun.

