# TASK-077 — Patch Impact Notifier

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 1.5 days  
**Priority:** P0

---

## Objective

Riot her iki haftada bir yama yayınlıyor. Kullanıcının champion pool'undaki şampiyonlar
buff/nerf aldığında ve kullanıcının kendi metriklerinde yama öncesi/sonrası istatistiksel
bir değişim tespit edildiğinde otomatik bildirim gönder. "14.21 yamasından sonra Ahri
win rate'in %3 düştü" gibi kişiselleştirilmiş patch analizi.

---

## User Story

> "Yama çıktı, değişiklikler neydi bilmiyorum. Sadece son zamanlarda kötü
> oynadığımı hissediyorum ama nedenini anlamıyorum."

---

## Acceptance Criteria

- [ ] `PatchVersion` tablosu: yama tarihleri ve versiyonlar tutuluyor
- [ ] Her yama çıkışında (haftalık cron veya DDragon API polling) yeni yama kaydediliyor
- [ ] Kullanıcının champion pool'undaki şampiyonlar için buff/nerf DB'ye yazılıyor
- [ ] Yama sonrası 15+ maç oynandıysa otomatik analiz tetikleniyor
- [ ] "Yama etkisi" bildirimi: in-app notification + email (opsiyonel)
- [ ] Dashboard'da "Son Yama Etkisi" widget'ı
- [ ] Patch notes URL'i (DDragon veya community API) bildirimde yer alıyor
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Patch Versiyonu Takibi

DDragon API'den versiyon listesi:
```
https://ddragon.leagueoflegends.com/api/versions.json
```
En son versiyon değiştiyse yeni `PatchVersion` kaydı oluştur.

```prisma
model PatchVersion {
  id          String   @id @default(uuid()) @db.Uuid
  version     String   @unique  // "14.21.1"
  releasedAt  DateTime
  patchNotes  String?  // community API URL veya Riot URL
  createdAt   DateTime @default(now())

  championChanges PatchChampionChange[]

  @@map("patch_versions")
}

model PatchChampionChange {
  id             String       @id @default(uuid()) @db.Uuid
  patchVersionId String       @db.Uuid
  championId     Int
  championName   String
  changeType     String       // 'buff' | 'nerf' | 'adjusted' | 'rework'
  summary        String       // "Q cooldown azaltıldı, W hasarı düşürüldü"
  createdAt      DateTime     @default(now())

  patchVersion PatchVersion @relation(fields: [patchVersionId], references: [id])

  @@index([championId])
  @@map("patch_champion_changes")
}
```

### Patch Polling Cron (Inngest)

```typescript
// src/inngest/functions/patchVersionPoller.ts
// Her gün 08:00 UTC çalışır
export const patchVersionPoller = inngest.createFunction(
  { id: 'patch-version-poller' },
  { cron: '0 8 * * *' },
  async ({ step }) => {
    const latestVersion = await step.run('fetch-ddragon-version', fetchLatestDDragonVersion);
    const existing = await step.run('check-db', () =>
      prisma.patchVersion.findUnique({ where: { version: latestVersion } })
    );
    if (existing) return { upToDate: true };

    await step.run('save-patch', () =>
      prisma.patchVersion.create({
        data: { version: latestVersion, releasedAt: new Date() }
      })
    );

    // Tüm kullanıcılara patch impact analizi tetikle
    await step.sendEvent('patch/new-version-detected', {
      data: { version: latestVersion }
    });

    return { newPatch: latestVersion };
  }
);
```

### Patch Impact Analizi

```typescript
// src/inngest/functions/patchImpactAnalyzer.ts
// Yeni yama sonrası kullanıcı başına tetiklenir
// 15+ maç oynandıktan sonra analiz yapar

async function analyzePatchImpact(userId: string, riotAccountId: string, patchVersion: string) {
  // Yama öncesi son 20 maç WR (yama tarihinden önceki)
  // Yama sonrası maçlar (yama tarihinden sonraki)
  // Her şampiyon için karşılaştır
  // Delta > %5 → bildirim oluştur
}
```

### Frontend: Patch Impact Widget

```
┌─────────────────────────────────────────────────┐
│  Yama 14.21 Etkisi (2 gün önce)                │
├─────────────────────────────────────────────────┤
│  Ahri     ▼ -4.2% WR   (yama öncesi: %58)     │
│  Viktor   ▲ +2.1% WR   (yama öncesi: %61)     │
│  Syndra   ≈ Değişmedi                          │
├─────────────────────────────────────────────────┤
│  [Patch Notlarını Gör →]                        │
└─────────────────────────────────────────────────┘
```

### In-App Notification

```typescript
// app/api/notifications/route.ts — mevcut notification sistemi varsa kullan
// yoksa basit: kullanıcı dashboard'a girince göster
interface PatchNotification {
  type: 'patch_impact';
  patchVersion: string;
  affectedChampions: { name: string; changeType: string; wrDelta: number }[];
  message: string; // AI üretilmiş özet
}
```

---

## Patch Notes Kaynağı

Resmi Riot patch notes URL pattern'i:
```
https://www.leagueoflegends.com/tr-tr/news/game-updates/patch-{major}-{minor}-notes/
```
Bunu link olarak widget'ta göster, içeriği parse etmeye çalışma (ToS riski).

Şampiyon değişikliklerini community API'den al:
```
https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/
```
veya manuel olarak DDragon'dan champion stat karşılaştırması yap (önceki versiyon vs yeni).

---

## Files

```
prisma/schema.prisma                                    ← PatchVersion, PatchChampionChange
prisma/migrations/YYYYMMDD_add_patch_tracking/          ← YENİ
src/inngest/functions/patchVersionPoller.ts             ← YENİ cron
src/inngest/functions/patchImpactAnalyzer.ts            ← YENİ function
src/inngest/index.ts                                    ← functionları kaydet
src/domains/analysis/services/patchService.ts           ← YENİ servis
app/api/patch/impact/route.ts                           ← GET kullanıcının patch impact verisi
src/components/dashboard/PatchImpactWidget.tsx          ← YENİ
src/hooks/usePatchImpact.ts                             ← YENİ TanStack Query
app/(app)/dashboard/page.tsx                            ← widget ekle
```

---

## Test Plan

```typescript
describe('patchVersionPoller', () => {
  it('yeni versiyon tespit edilince DB kaydı oluşturulur')
  it('aynı versiyon tekrar gelince duplicate oluşturulmaz')
})

describe('patchImpactAnalyzer', () => {
  it('yama öncesi/sonrası WR delta doğru hesaplanıyor')
  it('delta < %2 → bildirim tetiklenmiyor')
  it('15 maçtan az → analiz bekleniyor')
})
```

---

## Dependencies

- Inngest ✅
- DDragon API ✅ (mevcut kullanımda)
- `matchSyncService.ts` ✅

---

## Definition of Done

- Yeni yama cron ile tespit ediliyor
- Dashboard widget WR değişimini gösteriyor
- Patch notes linki görünüyor
- Unit test coverage ≥ 80%
- `docs/DATABASE_SCHEMA.md` güncellendi
