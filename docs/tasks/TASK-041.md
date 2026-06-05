# TASK-041 — [F3-3] Counter Pick API Endpoint

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Counter Pick servisini HTTP API olarak expose et. Auth gerektirmeyen public endpoint — acquisition funnel için kritik. Rate limiting ile kötüye kullanımı engelle.

---

## Acceptance Criteria

- [ ] `app/api/counter/route.ts` oluşturuldu
- [ ] `GET /api/counter?champion=Yasuo&role=MIDDLE` çalışıyor
- [ ] Auth gerektirmiyor (public endpoint)
- [ ] IP başına 20 req/dakika rate limit uygulanıyor
- [ ] Champion DB'de bulunamazsa 404 dönüyor
- [ ] Geçersiz rol parametresi için 400 dönüyor
- [ ] Eksik parametre için 400 dönüyor
- [ ] Başarılı response `apiSuccess(result)` envelope ile dönüyor
- [ ] Hata response'ları mevcut `Errors` class formatında
- [ ] TypeScript strict — `any` yok

---

## Teknik Gereksinimler

### Route Handler

```typescript
// app/api/counter/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess } from '@/lib/api/response';
import { Errors } from '@/lib/api/errors';
import { rateLimit } from '@/lib/riot/rateLimit';
import { getGeneralCounters } from '@/domains/counter/services/generalCounterService';
import { Position } from '@/types/common.types';

const querySchema = z.object({
  champion: z.string().min(1),
  role: z.nativeEnum(Position),
});

export async function GET(request: NextRequest) {
  // 1. Rate limit (IP bazlı, 20/dakika)
  // 2. Query param parse + Zod validation
  // 3. Champion normalize (trim, lowercase için DB lookup)
  // 4. DB'de champion varlığı kontrolü
  // 5. getGeneralCounters(champion, role) çağır
  // 6. apiSuccess(result) döndür
}
```

### Rate Limiting

Mevcut `rateLimit` helper'ını kullan. Config:
```typescript
{ requests: 20, window: '1m', prefix: 'counter-api' }
```

### Champion Validation

`prisma.champion.findFirst({ where: { name: { equals: champion, mode: 'insensitive' } } })`
Bulunamazsa: `Errors.notFound('Şampiyon bulunamadı')`

---

## Bağımlılıklar

- TASK-040 (generalCounterService) tamamlanmış olmalı

---

## Notlar

- Route handler 80 satırı geçmemeli (CLAUDE.md kuralı). İş mantığı servise delegat et.
- Rol parametresi URL'den geldiği için string olarak gelir — `z.nativeEnum(Position)` ile validate et.
- Champion adını normalize ederken DB'deki canonical ismi kullan (ör. "leesin" → "Lee Sin").
