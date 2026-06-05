# TASK-037 — [INFRA-1] AiCache Prisma Modeli + Migration

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

F3 (Counter Pick), F1 (Matchup Coach), F7 (OTP Assistant) ve F2 (Draft Analyzer) feature'larının tamamı için ortak bir AI sonuç cache mekanizması kur. Aynı sorgu için AI tekrar çağrılmasın; hem maliyet hem latency azalsın.

---

## Acceptance Criteria

- [ ] `prisma/schema.prisma` dosyasına `AiCache` modeli eklendi
- [ ] `npx prisma migrate dev --name add_ai_cache` başarıyla çalıştı
- [ ] `src/lib/ai/aiCache.ts` helper dosyası oluşturuldu
- [ ] `getCached`, `setCached`, `incrementHit`, `buildCacheKey` fonksiyonları export ediliyor
- [ ] `buildCacheKey` dış dependency olmadan Node.js `crypto` modülü ile sha256 üretiyor
- [ ] Cache expire kontrolü (`expiresAt < now()`) `getCached` içinde yapılıyor
- [ ] Süresi dolmuş entry'ler `getCached` tarafından `null` döndürüyor (silmiyor)
- [ ] TypeScript strict — `any` yok, tam tip dönüşleri var
- [ ] `src/lib/ai/aiCache.test.ts` unit testleri geçiyor

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
// expiresAt kontrolü yap; süresi dolmuşsa null döndür; hit ise incrementHit çağır

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
// inputs sıralı olmalı — key order farklılığı aynı hash üretmeli
```

### Unit Testler (`src/lib/ai/aiCache.test.ts`)

- `getCached`: hit varsa ve süresi dolmamışsa doğru content döner
- `getCached`: süresi dolmuş entry için `null` döner
- `getCached`: mevcut değilse `null` döner
- `setCached`: doğru `expiresAt` ile yazar
- `buildCacheKey`: aynı inputs (farklı key order) → aynı hash
- `buildCacheKey`: farklı inputs → farklı hash

---

## Bağımlılıklar

Yok — bu task diğer tüm feature task'larının ön koşuludur.

---

## Notlar

- `crypto` modülü Node.js built-in — yeni npm paketi ekleme.
- Süresi dolmuş kayıtları silmek için ayrı bir cron job gerekmez; `expiresAt` index yeterli. İleride toplu temizlik için `DELETE WHERE expiresAt < NOW()` eklenebilir.
- Default TTL: 14 gün (≈ 1 patch cycle). Her servis kendi TTL'ini belirler.
