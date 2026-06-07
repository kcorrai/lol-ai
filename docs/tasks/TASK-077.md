# TASK-077 â€” Patch Impact Notifier

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 1.5 days  
**Priority:** P0

---

## Objective

Riot her iki haftada bir yama yayÄ±nlÄ±yor. KullanÄ±cÄ±nÄ±n champion pool'undaki ÅŸampiyonlar
buff/nerf aldÄ±ÄŸÄ±nda ve kullanÄ±cÄ±nÄ±n kendi metriklerinde yama Ã¶ncesi/sonrasÄ± istatistiksel
bir deÄŸiÅŸim tespit edildiÄŸinde otomatik bildirim gÃ¶nder. "14.21 yamasÄ±ndan sonra Ahri
win rate'in %3 dÃ¼ÅŸtÃ¼" gibi kiÅŸiselleÅŸtirilmiÅŸ patch analizi.

---

## User Story

> "Yama Ã§Ä±ktÄ±, deÄŸiÅŸiklikler neydi bilmiyorum. Sadece son zamanlarda kÃ¶tÃ¼
> oynadÄ±ÄŸÄ±mÄ± hissediyorum ama nedenini anlamÄ±yorum."

---

## Acceptance Criteria

- [ ] `PatchVersion` tablosu: yama tarihleri ve versiyonlar tutuluyor
- [ ] Her yama Ã§Ä±kÄ±ÅŸÄ±nda (haftalÄ±k cron veya DDragon API polling) yeni yama kaydediliyor
- [ ] KullanÄ±cÄ±nÄ±n champion pool'undaki ÅŸampiyonlar iÃ§in buff/nerf DB'ye yazÄ±lÄ±yor
- [ ] Yama sonrasÄ± 15+ maÃ§ oynandÄ±ysa otomatik analiz tetikleniyor
- [ ] "Yama etkisi" bildirimi: in-app notification + email (opsiyonel)
- [ ] Dashboard'da "Son Yama Etkisi" widget'Ä±
- [ ] Patch notes URL'i (DDragon veya community API) bildirimde yer alÄ±yor
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### Patch Versiyonu Takibi

DDragon API'den versiyon listesi:
```
https://ddragon.leagueoflegends.com/api/versions.json
```
En son versiyon deÄŸiÅŸtiyse yeni `PatchVersion` kaydÄ± oluÅŸtur.

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
  summary        String       // "Q cooldown azaltÄ±ldÄ±, W hasarÄ± dÃ¼ÅŸÃ¼rÃ¼ldÃ¼"
  createdAt      DateTime     @default(now())

  patchVersion PatchVersion @relation(fields: [patchVersionId], references: [id])

  @@index([championId])
  @@map("patch_champion_changes")
}
```

### Patch Polling Cron (Inngest)

```typescript
// src/inngest/functions/patchVersionPoller.ts
// Her gÃ¼n 08:00 UTC Ã§alÄ±ÅŸÄ±r
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

    // TÃ¼m kullanÄ±cÄ±lara patch impact analizi tetikle
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
// Yeni yama sonrasÄ± kullanÄ±cÄ± baÅŸÄ±na tetiklenir
// 15+ maÃ§ oynandÄ±ktan sonra analiz yapar

async function analyzePatchImpact(userId: string, riotAccountId: string, patchVersion: string) {
  // Yama Ã¶ncesi son 20 maÃ§ WR (yama tarihinden Ã¶nceki)
  // Yama sonrasÄ± maÃ§lar (yama tarihinden sonraki)
  // Her ÅŸampiyon iÃ§in karÅŸÄ±laÅŸtÄ±r
  // Delta > %5 â†’ bildirim oluÅŸtur
}
```

### Frontend: Patch Impact Widget

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Yama 14.21 Etkisi (2 gÃ¼n Ã¶nce)                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Ahri     â–¼ -4.2% WR   (yama Ã¶ncesi: %58)     â”‚
â”‚  Viktor   â–² +2.1% WR   (yama Ã¶ncesi: %61)     â”‚
â”‚  Syndra   â‰ˆ DeÄŸiÅŸmedi                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Patch NotlarÄ±nÄ± GÃ¶r â†’]                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### In-App Notification

```typescript
// app/api/notifications/route.ts â€” mevcut notification sistemi varsa kullan
// yoksa basit: kullanÄ±cÄ± dashboard'a girince gÃ¶ster
interface PatchNotification {
  type: 'patch_impact';
  patchVersion: string;
  affectedChampions: { name: string; changeType: string; wrDelta: number }[];
  message: string; // AI Ã¼retilmiÅŸ Ã¶zet
}
```

---

## Patch Notes KaynaÄŸÄ±

Resmi Riot patch notes URL pattern'i:
```
https://www.leagueoflegends.com/tr-tr/news/game-updates/patch-{major}-{minor}-notes/
```
Bunu link olarak widget'ta gÃ¶ster, iÃ§eriÄŸi parse etmeye Ã§alÄ±ÅŸma (ToS riski).

Åampiyon deÄŸiÅŸikliklerini community API'den al:
```
https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/
```
veya manuel olarak DDragon'dan champion stat karÅŸÄ±laÅŸtÄ±rmasÄ± yap (Ã¶nceki versiyon vs yeni).

---

## Files

```
prisma/schema.prisma                                    â† PatchVersion, PatchChampionChange
prisma/migrations/YYYYMMDD_add_patch_tracking/          â† YENÄ°
src/inngest/functions/patchVersionPoller.ts             â† YENÄ° cron
src/inngest/functions/patchImpactAnalyzer.ts            â† YENÄ° function
src/inngest/index.ts                                    â† functionlarÄ± kaydet
src/domains/analysis/services/patchService.ts           â† YENÄ° servis
app/api/patch/impact/route.ts                           â† GET kullanÄ±cÄ±nÄ±n patch impact verisi
src/components/dashboard/PatchImpactWidget.tsx          â† YENÄ°
src/hooks/usePatchImpact.ts                             â† YENÄ° TanStack Query
app/(app)/dashboard/page.tsx                            â† widget ekle
```

---

## Test Plan

```typescript
describe('patchVersionPoller', () => {
  it('yeni versiyon tespit edilince DB kaydÄ± oluÅŸturulur')
  it('aynÄ± versiyon tekrar gelince duplicate oluÅŸturulmaz')
})

describe('patchImpactAnalyzer', () => {
  it('yama Ã¶ncesi/sonrasÄ± WR delta doÄŸru hesaplanÄ±yor')
  it('delta < %2 â†’ bildirim tetiklenmiyor')
  it('15 maÃ§tan az â†’ analiz bekleniyor')
})
```

---

## Dependencies

- Inngest âœ…
- DDragon API âœ… (mevcut kullanÄ±mda)
- `matchSyncService.ts` âœ…

---

## Definition of Done

- Yeni yama cron ile tespit ediliyor
- Dashboard widget WR deÄŸiÅŸimini gÃ¶steriyor
- Patch notes linki gÃ¶rÃ¼nÃ¼yor
- Unit test coverage â‰¥ 80%
- `docs/DATABASE_SCHEMA.md` gÃ¼ncellendi

