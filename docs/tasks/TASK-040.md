# TASK-040 â€” [F3-2] generalCounterService + counterPrompt

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

Counter Pick feature'Ä±nÄ±n iÅŸ mantÄ±ÄŸÄ±nÄ± yaz. AI Ã§aÄŸrÄ±sÄ± yap, sonucu AiCache'e kaydet, aynÄ± sorgu iÃ§in cache'den dÃ¶n. Prompt kalitesi bu feature'Ä±n kullanÄ±cÄ± deÄŸerini doÄŸrudan belirler.

---

## Acceptance Criteria

- [ ] `src/domains/counter/services/generalCounterService.ts` yazÄ±ldÄ±
- [ ] `getGeneralCounters(champion, role)` cache hit durumunda AI Ã§aÄŸÄ±rmÄ±yor
- [ ] `getGeneralCounters(champion, role)` cache miss durumunda AI Ã§aÄŸÄ±rÄ±yor ve sonucu cache'e yazÄ±yor
- [ ] AI Ã§Ä±ktÄ±sÄ± Zod schema ile validate ediliyor; hatalÄ± JSON dÃ¼zgÃ¼n handle ediliyor
- [ ] `src/domains/counter/prompts/counterPrompt.ts` yazÄ±ldÄ±
- [ ] Prompt, structured JSON output talep ediyor
- [ ] Prompt'ta "Bu analiz AI tahminidir, gerÃ§ek win rate verisi deÄŸildir" aÃ§Ä±klamasÄ± var
- [ ] `generalCounterService.ts` 250 satÄ±rÄ± geÃ§miyor (CLAUDE.md kuralÄ±)
- [ ] TypeScript strict â€” `any` yok

---

## Teknik Gereksinimler

### Servis (`generalCounterService.ts`)

```typescript
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { aiClient } from "@/lib/ai/client";
import { buildCounterSystemPrompt, buildCounterUserPrompt } from "../prompts/counterPrompt";
import { counterResultSchema } from "../types/counter.types";
import type { GeneralCounterResult } from "../types/counter.types";
import type { Position } from "@/types/common.types";

export async function getGeneralCounters(
  champion: string,
  role: Position
): Promise<GeneralCounterResult> {
  const cacheKey = buildCacheKey("counter", { champion: champion.toLowerCase(), role });

  const cached = await getCached(cacheKey);
  if (cached) return cached as GeneralCounterResult;

  const result = await aiClient.complete({
    systemPrompt: buildCounterSystemPrompt(),
    userMessage: buildCounterUserPrompt(champion, role),
  });

  const parsed = counterResultSchema.parse(JSON.parse(result.content));
  await setCached(cacheKey, "counter", parsed, 14);
  return parsed;
}
```

### Prompt (`counterPrompt.ts`)

`buildCounterSystemPrompt()`: "Sen bir League of Legends uzman koÃ§usun..." framing.

`buildCounterUserPrompt(champion, role)`:

- `topCounters` (5 adet), `easyCounters` (3 adet), `soloQueueCounters` (3 adet) iste
- Her counter iÃ§in: `champion`, `difficulty`, `reasonWhy`, `laneAdvantage`, `watchOut`, `buildHint`, `tier`
- `tips`: genel 3-5 ipucu listesi
- `patchNote`: sabit string "Bu analiz AI tarafÄ±ndan Ã¼retilmiÅŸtir. GÃ¼ncel patch verilerini yansÄ±tmayabilir."
- JSON formatÄ±nda yanÄ±t ver talimatÄ±

### Zod Schema

`counter.types.ts` dosyasÄ±na Zod import ederek schema ekle:

```typescript
import { z } from 'zod';

export const counterEntrySchema = z.object({ ... });
export const generalCounterResultSchema = z.object({ ... });
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 (AiCache) tamamlanmÄ±ÅŸ olmalÄ±
- TASK-039 (Counter domain tipleri) tamamlanmÄ±ÅŸ olmalÄ±

---

## Notlar

- `aiClient.complete()` mevcut `src/lib/ai/client.ts` provider'Ä±nÄ± kullanÄ±yor. Yeni AI baÄŸlantÄ±sÄ± aÃ§ma.
- JSON parse hatasÄ± durumunda `src/lib/ai/responseParser.ts`'deki mevcut helper'Ä± incele â€” benzer pattern kullan.
- Cache TTL 14 gÃ¼n: bir League patch'i yaklaÅŸÄ±k 14 gÃ¼ndÃ¼r.
