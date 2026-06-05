# TASK-042 — [F3-4] useGeneralCounterPick React Hook

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Counter Pick sayfasının kullanacağı TanStack Query hook'unu yaz. Champion ve rol seçildikten sonra otomatik tetiklenmeli, sonuç uzun süre cache'de kalmalı.

---

## Acceptance Criteria

- [ ] `src/hooks/useGeneralCounterPick.ts` oluşturuldu
- [ ] `champion` veya `role` null iken API çağrısı yapılmıyor
- [ ] Her ikisi de dolu olduğunda otomatik fetch başlıyor
- [ ] Aynı (champion, role) kombinasyonu için 7 gün içinde tekrar API çağrısı yapılmıyor
- [ ] `isLoading`, `isError`, `error`, `data` state'leri doğru döndürülüyor
- [ ] Mevcut hook pattern'leri ile tutarlı (diğer `src/hooks/` dosyalarına bak)
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
    staleTime: 1000 * 60 * 60 * 24 * 7,   // 7 gün
    gcTime: 1000 * 60 * 60 * 24 * 14,     // 14 gün
    retry: 1,
  });
}
```

---

## Bağımlılıklar

- TASK-041 (Counter API endpoint) tamamlanmış olmalı

---

## Notlar

- `data.data` — mevcut `apiSuccess` envelope `{ data: ... }` formatında döndürüyor.
- Hook dosyası 50 satırı geçmemeli; karmaşık logic servis katmanında.
