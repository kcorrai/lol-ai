# TASK-048 — [F1-4] useMatchupAnalysis React Hook

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Matchup sayfasının kullanacağı TanStack Query mutation hook'unu yaz. Kullanıcı "Analiz Et" butonuna basınca tetiklenir, sonuç query cache'e yazılır.

---

## Acceptance Criteria

- [ ] `src/hooks/useMatchupAnalysis.ts` oluşturuldu
- [ ] `analyze(champion, opponent, role)` çağrısı POST isteği gönderiyor
- [ ] Mutation sonucu `queryClient.setQueryData` ile cache'e yazılıyor
- [ ] Aynı kombinasyon için cache'den hızlı dönüş yapılıyor
- [ ] `reset()` fonksiyonu data ve error state'ini temizliyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

```typescript
// src/hooks/useMatchupAnalysis.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MatchupAnalysis } from '@/domains/matchup/types/matchup.types';
import type { Position } from '@/types/common.types';

interface AnalyzeParams {
  champion: string;
  opponent: string;
  role: Position;
}

export function useMatchupAnalysis() {
  const queryClient = useQueryClient();

  const mutation = useMutation<MatchupAnalysis, Error, AnalyzeParams>({
    mutationFn: (params) =>
      fetch('/api/matchup/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
        .then(res => res.json())
        .then(data => data.data),
    onSuccess: (data, params) => {
      queryClient.setQueryData(
        ['matchup', params.champion, params.opponent, params.role],
        data
      );
    },
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

- TASK-047 (Matchup API endpoint) tamamlanmış olmalı
