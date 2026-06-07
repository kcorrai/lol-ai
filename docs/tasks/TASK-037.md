# TASK-037 â€” [INFRA-1] AiCache Prisma Modeli + Migration

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

F3 (Counter Pick), F1 (Matchup Coach), F7 (OTP Assistant) ve F2 (Draft Analyzer) feature'larÄ±nÄ±n tamamÄ± iÃ§in ortak bir AI sonuÃ§ cache mekanizmasÄ± kur. AynÄ± sorgu iÃ§in AI tekrar Ã§aÄŸrÄ±lmasÄ±n; hem maliyet hem latency azalsÄ±n.

---

## Acceptance Criteria

- [ ] `prisma/schema.prisma` dosyasÄ±na `AiCache` modeli eklendi
- [ ] `npx prisma migrate dev --name add_ai_cache` baÅŸarÄ±yla Ã§alÄ±ÅŸtÄ±
- [ ] `src/lib/ai/aiCache.ts` helper dosyasÄ± oluÅŸturuldu
- [ ] `getCached`, `setCached`, `incrementHit`, `buildCacheKey` fonksiyonlarÄ± export ediliyor
- [ ] `buildCacheKey` dÄ±ÅŸ dependency olmadan Node.js `crypto` modÃ¼lÃ¼ ile sha256 Ã¼retiyor
- [ ] Cache expire kontrolÃ¼ (`expiresAt < now()`) `getCached` iÃ§inde yapÄ±lÄ±yor
- [ ] SÃ¼resi dolmuÅŸ entry'ler `getCached` tarafÄ±ndan `null` dÃ¶ndÃ¼rÃ¼yor (silmiyor)
- [ ] TypeScript strict â€” `any` yok, tam tip dÃ¶nÃ¼ÅŸleri var
- [ ] `src/lib/ai/aiCache.test.ts` unit testleri geÃ§iyor

---

## Teknik Gereksinimler

### Prisma Modeli

```prisma
model AiCache {
  id        String   @id @default(cuid())
  cacheKey  String   @unique
  type      String   // matchup | draft | counter | otp | build-explanation
  content   Json
  hitCount  Int      @default(0)
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([type])
  @@index([expiresAt])
}
```

### Helper Fonksiyonlar (`src/lib/ai/aiCache.ts`)

```typescript
export async function getCached(cacheKey: string): Promise<unknown | null>
// expiresAt kontrolÃ¼ yap; sÃ¼resi dolmuÅŸsa null dÃ¶ndÃ¼r; hit ise incrementHit Ã§aÄŸÄ±r

export async function setCached(
  cacheKey: string,
  type: string,
  content: unknown,
  ttlDays: number
): Promise<void>

export async function incrementHit(cacheKey: string): Promise<void>

export function buildCacheKey(
  type: string,
  inputs: Record<string, string>
): string
// sha256(type + ":" + JSON.stringify(sortedInputs))
// inputs sÄ±ralÄ± olmalÄ± â€” key order farklÄ±lÄ±ÄŸÄ± aynÄ± hash Ã¼retmeli
```

### Unit Testler (`src/lib/ai/aiCache.test.ts`)

- `getCached`: hit varsa ve sÃ¼resi dolmamÄ±ÅŸsa doÄŸru content dÃ¶ner
- `getCached`: sÃ¼resi dolmuÅŸ entry iÃ§in `null` dÃ¶ner
- `getCached`: mevcut deÄŸilse `null` dÃ¶ner
- `setCached`: doÄŸru `expiresAt` ile yazar
- `buildCacheKey`: aynÄ± inputs (farklÄ± key order) â†’ aynÄ± hash
- `buildCacheKey`: farklÄ± inputs â†’ farklÄ± hash

---

## BaÄŸÄ±mlÄ±lÄ±klar

Yok â€” bu task diÄŸer tÃ¼m feature task'larÄ±nÄ±n Ã¶n koÅŸuludur.

---

## Notlar

- `crypto` modÃ¼lÃ¼ Node.js built-in â€” yeni npm paketi ekleme.
- SÃ¼resi dolmuÅŸ kayÄ±tlarÄ± silmek iÃ§in ayrÄ± bir cron job gerekmez; `expiresAt` index yeterli. Ä°leride toplu temizlik iÃ§in `DELETE WHERE expiresAt < NOW()` eklenebilir.
- Default TTL: 14 gÃ¼n (â‰ˆ 1 patch cycle). Her servis kendi TTL'ini belirler.

