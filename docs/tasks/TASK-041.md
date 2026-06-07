# TASK-041 â€” [F3-3] Counter Pick API Endpoint

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

Counter Pick servisini HTTP API olarak expose et. Auth gerektirmeyen public endpoint â€” acquisition funnel iÃ§in kritik. Rate limiting ile kÃ¶tÃ¼ye kullanÄ±mÄ± engelle.

---

## Acceptance Criteria

- [ ] `app/api/counter/route.ts` oluÅŸturuldu
- [ ] `GET /api/counter?champion=Yasuo&role=MIDDLE` Ã§alÄ±ÅŸÄ±yor
- [ ] Auth gerektirmiyor (public endpoint)
- [ ] IP baÅŸÄ±na 20 req/dakika rate limit uygulanÄ±yor
- [ ] Champion DB'de bulunamazsa 404 dÃ¶nÃ¼yor
- [ ] GeÃ§ersiz rol parametresi iÃ§in 400 dÃ¶nÃ¼yor
- [ ] Eksik parametre iÃ§in 400 dÃ¶nÃ¼yor
- [ ] BaÅŸarÄ±lÄ± response `apiSuccess(result)` envelope ile dÃ¶nÃ¼yor
- [ ] Hata response'larÄ± mevcut `Errors` class formatÄ±nda
- [ ] TypeScript strict â€” `any` yok

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
  // 1. Rate limit (IP bazlÄ±, 20/dakika)
  // 2. Query param parse + Zod validation
  // 3. Champion normalize (trim, lowercase iÃ§in DB lookup)
  // 4. DB'de champion varlÄ±ÄŸÄ± kontrolÃ¼
  // 5. getGeneralCounters(champion, role) Ã§aÄŸÄ±r
  // 6. apiSuccess(result) dÃ¶ndÃ¼r
}
```

### Rate Limiting

Mevcut `rateLimit` helper'Ä±nÄ± kullan. Config:
```typescript
{ requests: 20, window: '1m', prefix: 'counter-api' }
```

### Champion Validation

`prisma.champion.findFirst({ where: { name: { equals: champion, mode: 'insensitive' } } })`
Bulunamazsa: `Errors.notFound('Åampiyon bulunamadÄ±')`

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-040 (generalCounterService) tamamlanmÄ±ÅŸ olmalÄ±

---

## Notlar

- Route handler 80 satÄ±rÄ± geÃ§memeli (CLAUDE.md kuralÄ±). Ä°ÅŸ mantÄ±ÄŸÄ± servise delegat et.
- Rol parametresi URL'den geldiÄŸi iÃ§in string olarak gelir â€” `z.nativeEnum(Position)` ile validate et.
- Champion adÄ±nÄ± normalize ederken DB'deki canonical ismi kullan (Ã¶r. "leesin" â†’ "Lee Sin").

