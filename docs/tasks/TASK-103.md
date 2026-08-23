# TASK-103 — Multi-Region Riot API Support

**Phase:** 4 — Scale & Expansion  
**Status:** Done  
**Estimated Effort:** 3 gün  
**Priority:** P2

---

## Objective

Şu an yalnızca EUW ve NA sunucularını destekleyen Riot entegrasyonunu KR, TR, BR
ve LAN bölgelerini de kapsayacak şekilde genişlet. Bölge seçimi hesap bağlama
adımında kullanıcı tarafından yapılacak; tüm Riot API çağrıları doğru routing
ve platform endpoint'lerine yönlendirilecek.

---

## User Story

> "Türkiye sunucusunda (TR1) oynuyorum ama uygulama hesabımı bulmuyor. Kendi
> sunucumu seçebilmek istiyorum."

---

## Acceptance Criteria

- [ ] Desteklenen sunucular: EUW1, EUW2, EUNE1, NA1, KR, TR1, BR1, LAN1, LAS1, OC1, JP1
- [ ] Hesap bağlama sayfasında sunucu seçimi dropdown'u var
- [ ] Her sunucu doğru Riot platform ve regional endpoint'e map'leniyor
- [ ] Mevcut `RiotAccount` kayıtlarında `region` alanı var (migration ile backfill)
- [ ] Riot API rate limiter sunucu bazında çalışıyor (TR ve EUW ayrı bucket)
- [ ] Kullanıcı arayüzü Türkçe sunucu adlarını gösteriyor (TR → "Türkiye")
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Riot Sunucu Topolojisi

Riot API'de iki katman var:

```
Platform (sunucu bazı):          Regional (kıta bazı):
  EUW1 → euw1.api.riotgames.com    EUW1, EUNE1, TR1, RU → europe.api.riotgames.com
  TR1  → tr1.api.riotgames.com     NA1, BR1, LAN1, LAS1 → americas.api.riotgames.com
  KR   → kr.api.riotgames.com      KR, JP1              → asia.api.riotgames.com
  NA1  → na1.api.riotgames.com
  BR1  → br1.api.riotgames.com
```

Platform endpoint: summoner data, match IDs  
Regional endpoint: match details, account lookup by puuid

### Region Konfigürasyonu

```typescript
// src/domains/riot/config/regions.ts

export const RIOT_REGIONS = {
  EUW1: { label: "Batı Avrupa", platform: "euw1", regional: "europe" },
  EUNE1: { label: "Kuzey Doğu Avrupa", platform: "eune1", regional: "europe" },
  TR1: { label: "Türkiye", platform: "tr1", regional: "europe" },
  RU: { label: "Rusya", platform: "ru", regional: "europe" },
  NA1: { label: "Kuzey Amerika", platform: "na1", regional: "americas" },
  BR1: { label: "Brezilya", platform: "br1", regional: "americas" },
  LAN1: { label: "Latin Am. Kuzey", platform: "lan", regional: "americas" },
  LAS1: { label: "Latin Am. Güney", platform: "las", regional: "americas" },
  KR: { label: "Kore", platform: "kr", regional: "asia" },
  JP1: { label: "Japonya", platform: "jp1", regional: "asia" },
  OC1: { label: "Okyanusya", platform: "oc1", regional: "sea" },
} as const;

export type RiotRegion = keyof typeof RIOT_REGIONS;
```

### Riot API Client Güncellemesi

```typescript
// src/domains/riot/services/riotApiClient.ts

export class RiotApiClient {
  private platformUrl(region: RiotRegion): string {
    return `https://${RIOT_REGIONS[region].platform}.api.riotgames.com`;
  }

  private regionalUrl(region: RiotRegion): string {
    return `https://${RIOT_REGIONS[region].regional}.api.riotgames.com`;
  }

  async getMatchIds(puuid: string, region: RiotRegion): Promise<string[]> {
    const base = this.regionalUrl(region);
    // ...
  }

  async getMatchDetail(matchId: string, region: RiotRegion): Promise<RiotMatchDto> {
    const base = this.regionalUrl(region);
    // ...
  }
}
```

### Rate Limiter — Sunucu Bazlı Bucket

```typescript
// src/lib/riot/rateLimit.ts
// Her platform için ayrı Redis key: rate-limit:euw1, rate-limit:tr1
const key = `riot:rate-limit:${region}`;
```

### DB Migrasyonu

```prisma
model RiotAccount {
  // ... mevcut alanlar
  region  String  @default("EUW1")  // yeni alan
}
```

Backfill: mevcut kayıtlar için default "EUW1".

### Hesap Bağlama UI

```typescript
// app/(app)/settings/accounts/page.tsx
// Mevcut form'a RegionSelector component ekle

// src/domains/riot/components/RegionSelector.tsx
// shadcn Select component ile sunucu listesi
```

---

## Files

```
src/domains/riot/config/regions.ts                    ← YENİ
src/domains/riot/services/riotApiClient.ts            ← GÜNCELLE (region param)
src/domains/riot/services/accountService.ts           ← GÜNCELLE (region kaydet)
src/domains/riot/services/matchSyncService.ts         ← GÜNCELLE (region ilet)
src/domains/riot/components/RegionSelector.tsx        ← YENİ
src/lib/riot/rateLimit.ts                             ← GÜNCELLE (per-region bucket)
app/(app)/settings/accounts/page.tsx                  ← GÜNCELLE (RegionSelector ekle)
prisma/schema.prisma                                   ← region alanı
prisma/migrations/YYYYMMDD_riot_account_region/       ← YENİ (backfill EUW1)
src/types/common.types.ts                             ← RiotRegion tipi ekle
```

---

## Test Plan

```typescript
describe("RiotApiClient", () => {
  it("TR1 region → tr1.api.riotgames.com platform URL kullanıyor");
  it("TR1 region → europe.api.riotgames.com regional URL kullanıyor");
  it("KR region → asia.api.riotgames.com regional URL kullanıyor");
  it("geçersiz region → type error (TS compile-time)");
});

describe("rateLimit", () => {
  it("EUW1 ve TR1 için ayrı Redis key kullanıyor");
});
```

---

## Definition of Done

- Tüm desteklenen sunucular hesap bağlama ekranında görünüyor
- TR1, KR, BR1 hesapları başarıyla senkronize ediliyor
- Rate limiter sunucu bazında çalışıyor
- Mevcut EUW1/NA1 hesaplar etkilenmiyor (backfill migration doğrulandı)
- Testler yeşil
- `.env.example` güncellendi (bölge bazlı notlar)
