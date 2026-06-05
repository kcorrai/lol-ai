# TASK-056 — [F7-4] useOtpAssistant React Hook

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

OTP sayfasının kullanacağı TanStack Query hook'unu yaz.

---

## Acceptance Criteria

- [ ] `src/hooks/useOtpAssistant.ts` oluşturuldu
- [ ] `champion` veya `role` null iken API çağrısı yapılmıyor
- [ ] 7 gün stale time ile cache çalışıyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

```typescript
// src/hooks/useOtpAssistant.ts
import { useQuery } from '@tanstack/react-query';
import type { OtpAnalysis } from '@/domains/otp/types/otp.types';
import type { Position } from '@/types/common.types';

export function useOtpAssistant(
  champion: string | null,
  role: Position | null
) {
  return useQuery<OtpAnalysis>({
    queryKey: ['otp', champion, role],
    queryFn: () =>
      fetch(`/api/otp?champion=${champion}&role=${role}`)
        .then(res => res.json())
        .then(data => data.data),
    enabled: !!champion && !!role,
    staleTime: 1000 * 60 * 60 * 24 * 7,
    gcTime: 1000 * 60 * 60 * 24 * 14,
    retry: 1,
  });
}
```

---

## Bağımlılıklar

- TASK-055 (OTP API endpoint) tamamlanmış olmalı
