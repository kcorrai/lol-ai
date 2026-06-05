# TASK-064 — [F2-4] useDraftAnalysis React Hook

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Draft Analyzer sayfasının kullanacağı TanStack Query mutation hook'unu yaz.

---

## Acceptance Criteria

- [ ] `src/hooks/useDraftAnalysis.ts` oluşturuldu
- [ ] `analyze(input)` POST isteği gönderiyor
- [ ] `reset()` sonucu temizliyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

```typescript
// src/hooks/useDraftAnalysis.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DraftInput, DraftAnalysis } from '@/domains/draft/types/draft.types';

export function useDraftAnalysis() {
  const queryClient = useQueryClient();

  const mutation = useMutation<DraftAnalysis, Error, DraftInput>({
    mutationFn: (input) =>
      fetch('/api/draft/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
        .then(res => res.json())
        .then(data => data.data),
  });

  return {
    analyze: mutation.mutate,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
```

---

## Bağımlılıklar

- TASK-063 (Draft API endpoint) tamamlanmış olmalı
