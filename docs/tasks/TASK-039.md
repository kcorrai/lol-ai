# TASK-039 — [F3-1] Counter Pick Domain Kurulumu + TypeScript Tipleri

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

F3 Counter Pick Generator feature'ı için domain iskeletini ve TypeScript tip tanımlarını oluştur. Bu task sonraki F3 task'larının (servis, API, hook, UI) temelini kurar.

---

## Acceptance Criteria

- [ ] `src/domains/counter/` klasör yapısı oluşturuldu
- [ ] `src/domains/counter/types/counter.types.ts` dosyası yazıldı
- [ ] Tüm tipler TypeScript strict modda geçiyor (`any` yok)
- [ ] `src/domains/counter/index.ts` public API export dosyası oluşturuldu
- [ ] Component placeholder dosyaları oluşturuldu (boş export, içi dolu olmak zorunda değil)

---

## Teknik Gereksinimler

### Klasör Yapısı

```
src/domains/counter/
├── services/
│   ├── generalCounterService.ts
│   └── personalCounterService.ts
├── prompts/
│   └── counterPrompt.ts
├── types/
│   └── counter.types.ts
├── components/
│   ├── CounterList.tsx
│   ├── CounterCard.tsx
│   └── CounterPageSkeleton.tsx
└── index.ts
```

### Tip Tanımları (`counter.types.ts`)

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

## Bağımlılıklar

- TASK-037 (AiCache) — servis yazılırken gerekecek, tip tanımları için değil.
- Bu task bağımsız olarak başlanabilir.

---

## Notlar

- `index.ts`'de şimdilik sadece tipleri export et. Servis ve component'ler ilgili task'larda eklenecek.
- Component dosyaları şimdilik `export {}` ile boş bırakılabilir — sadece klasör yapısı kurulsun.
