# TASK-040 — [F3-2] generalCounterService + counterPrompt

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Counter Pick feature'ının iş mantığını yaz. AI çağrısı yap, sonucu AiCache'e kaydet, aynı sorgu için cache'den dön. Prompt kalitesi bu feature'ın kullanıcı değerini doğrudan belirler.

---

## Acceptance Criteria

- [ ] `src/domains/counter/services/generalCounterService.ts` yazıldı
- [ ] `getGeneralCounters(champion, role)` cache hit durumunda AI çağırmıyor
- [ ] `getGeneralCounters(champion, role)` cache miss durumunda AI çağırıyor ve sonucu cache'e yazıyor
- [ ] AI çıktısı Zod schema ile validate ediliyor; hatalı JSON düzgün handle ediliyor
- [ ] `src/domains/counter/prompts/counterPrompt.ts` yazıldı
- [ ] Prompt, structured JSON output talep ediyor
- [ ] Prompt'ta "Bu analiz AI tahminidir, gerçek win rate verisi değildir" açıklaması var
- [ ] `generalCounterService.ts` 250 satırı geçmiyor (CLAUDE.md kuralı)
- [ ] TypeScript strict — `any` yok

---

## Teknik Gereksinimler

### Servis (`generalCounterService.ts`)

```typescript
import { getCached, setCached, buildCacheKey } from '@/lib/ai/aiCache';
import { aiClient } from '@/lib/ai/client';
import { buildCounterSystemPrompt, buildCounterUserPrompt } from '../prompts/counterPrompt';
import { counterResultSchema } from '../types/counter.types';
import type { GeneralCounterResult } from '../types/counter.types';
import type { Position } from '@/types/common.types';

export async function getGeneralCounters(
  champion: string,
  role: Position
): Promise<GeneralCounterResult> {
  const cacheKey = buildCacheKey('counter', { champion: champion.toLowerCase(), role });

  const cached = await getCached(cacheKey);
  if (cached) return cached as GeneralCounterResult;

  const result = await aiClient.complete({
    systemPrompt: buildCounterSystemPrompt(),
    userMessage: buildCounterUserPrompt(champion, role),
  });

  const parsed = counterResultSchema.parse(JSON.parse(result.content));
  await setCached(cacheKey, 'counter', parsed, 14);
  return parsed;
}
```

### Prompt (`counterPrompt.ts`)

`buildCounterSystemPrompt()`: "Sen bir League of Legends uzman koçusun..." framing.

`buildCounterUserPrompt(champion, role)`:
- `topCounters` (5 adet), `easyCounters` (3 adet), `soloQueueCounters` (3 adet) iste
- Her counter için: `champion`, `difficulty`, `reasonWhy`, `laneAdvantage`, `watchOut`, `buildHint`, `tier`
- `tips`: genel 3-5 ipucu listesi
- `patchNote`: sabit string "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir."
- JSON formatında yanıt ver talimatı

### Zod Schema

`counter.types.ts` dosyasına Zod import ederek schema ekle:

```typescript
import { z } from 'zod';

export const counterEntrySchema = z.object({ ... });
export const generalCounterResultSchema = z.object({ ... });
```

---

## Bağımlılıklar

- TASK-037 (AiCache) tamamlanmış olmalı
- TASK-039 (Counter domain tipleri) tamamlanmış olmalı

---

## Notlar

- `aiClient.complete()` mevcut `src/lib/ai/client.ts` provider'ını kullanıyor. Yeni AI bağlantısı açma.
- JSON parse hatası durumunda `src/lib/ai/responseParser.ts`'deki mevcut helper'ı incele — benzer pattern kullan.
- Cache TTL 14 gün: bir League patch'i yaklaşık 14 gündür.
