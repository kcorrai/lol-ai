# TASK-048 â€” [F1-4] useMatchupAnalysis React Hook

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Matchup sayfasÄ±nÄ±n kullanacaÄŸÄ± TanStack Query mutation hook'unu yaz. KullanÄ±cÄ± "Analiz Et" butonuna basÄ±nca tetiklenir, sonuÃ§ query cache'e yazÄ±lÄ±r.

---

## Acceptance Criteria

- [ ] `src/hooks/useMatchupAnalysis.ts` oluÅŸturuldu
- [ ] `analyze(champion, opponent, role)` Ã§aÄŸrÄ±sÄ± POST isteÄŸi gÃ¶nderiyor
- [ ] Mutation sonucu `queryClient.setQueryData` ile cache'e yazÄ±lÄ±yor
- [ ] AynÄ± kombinasyon iÃ§in cache'den hÄ±zlÄ± dÃ¶nÃ¼ÅŸ yapÄ±lÄ±yor
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

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-047 (Matchup API endpoint) tamamlanmÄ±ÅŸ olmalÄ±

