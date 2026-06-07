# TASK-042 â€” [F3-4] useGeneralCounterPick React Hook

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Counter Pick sayfasÄ±nÄ±n kullanacaÄŸÄ± TanStack Query hook'unu yaz. Champion ve rol seÃ§ildikten sonra otomatik tetiklenmeli, sonuÃ§ uzun sÃ¼re cache'de kalmalÄ±.

---

## Acceptance Criteria

- [ ] `src/hooks/useGeneralCounterPick.ts` oluÅŸturuldu
- [ ] `champion` veya `role` null iken API Ã§aÄŸrÄ±sÄ± yapÄ±lmÄ±yor
- [ ] Her ikisi de dolu olduÄŸunda otomatik fetch baÅŸlÄ±yor
- [ ] AynÄ± (champion, role) kombinasyonu iÃ§in 7 gÃ¼n iÃ§inde tekrar API Ã§aÄŸrÄ±sÄ± yapÄ±lmÄ±yor
- [ ] `isLoading`, `isError`, `error`, `data` state'leri doÄŸru dÃ¶ndÃ¼rÃ¼lÃ¼yor
- [ ] Mevcut hook pattern'leri ile tutarlÄ± (diÄŸer `src/hooks/` dosyalarÄ±na bak)
- [ ] TypeScript strict

---

## Teknik Gereksinimler

```typescript
// src/hooks/useGeneralCounterPick.ts
import { useQuery } from '@tanstack/react-query';
import type { GeneralCounterResult } from '@/domains/counter/types/counter.types';
import type { Position } from '@/types/common.types';

export function useGeneralCounterPick(
  champion: string | null,
  role: Position | null
) {
  return useQuery<GeneralCounterResult>({
    queryKey: ['counter', 'general', champion, role],
    queryFn: () =>
      fetch(`/api/counter?champion=${champion}&role=${role}`)
        .then(res => res.json())
        .then(data => data.data),
    enabled: !!champion && !!role,
    staleTime: 1000 * 60 * 60 * 24 * 7,   // 7 gÃ¼n
    gcTime: 1000 * 60 * 60 * 24 * 14,     // 14 gÃ¼n
    retry: 1,
  });
}
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-041 (Counter API endpoint) tamamlanmÄ±ÅŸ olmalÄ±

---

## Notlar

- `data.data` â€” mevcut `apiSuccess` envelope `{ data: ... }` formatÄ±nda dÃ¶ndÃ¼rÃ¼yor.
- Hook dosyasÄ± 50 satÄ±rÄ± geÃ§memeli; karmaÅŸÄ±k logic servis katmanÄ±nda.

