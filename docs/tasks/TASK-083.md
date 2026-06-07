# TASK-083 — Public Profil & Sosyal Paylaşım

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P2

---

## Objective

Her kullanıcı için paylaşılabilir public profil sayfası oluştur.
`/u/KaaN%23TR1` URL'ine giren herkes rank, rozet vitrini, favori şampiyon
ve sezon istatistiklerini görebilsin. Kullanıcı gizlilik ayarlarıyla neyin
görüneceğini kontrol edebilsin.

---

## User Story

> "Discord'da arkadaşlarıma 'LoL AI Coach kullanıyorum' diyorum ama
> gösterecek bir şeyim yok. Profil linkimi paylaşabilmek istiyorum."

---

## Acceptance Criteria

- [ ] `/u/[summonerSlug]` public sayfası — auth gerekmez
- [ ] Gösterilenler: rank, WR, favori şampiyonlar (top 3), kazanılan rozetler (top 6)
- [ ] Kullanıcı kendi profilinde hangi bilgilerin görüneceğini seçebiliyor
- [ ] OG meta tag: paylaşılınca Discord/Twitter'da önizleme çıkıyor
- [ ] "Bunu sen de dene → lolaicoach.com" conversion CTA
- [ ] Gizlenen veriler placeholder ile gösteriliyor (gizlenmiş etiketi)
- [ ] Profil URL'i: Riot hesabı bağlandıktan sonra otomatik oluşturuluyor
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### DB Schema (User modeline ekle)

```prisma
// User modeline ekle:
profileSlug     String?  @unique  // "KaaN-TR1" (özel karakter temizlenmiş)
profilePublic   Boolean  @default(true)
profileSettings Json?    // { showRank: true, showWR: true, showBadges: true, showChampions: true }
```

Slug üretimi:
```typescript
// Riot hesabı bağlanınca: "KaaN#TR1" → "KaaN-TR1"
function toProfileSlug(gameName: string, tagLine: string): string {
  return `${gameName}-${tagLine}`.replace(/[^a-zA-Z0-9-_]/g, '-');
}
```

### Public Profil Endpoint

```typescript
// app/api/public/profile/[slug]/route.ts
// GET — auth yok, rate limit 60/dk per IP

interface PublicProfileResponse {
  displayName: string;
  rank: { tier: string; division: string; lp: number } | null;
  winRate: number | null;  // gizliyse null
  topChampions: { name: string; games: number; winRate: number }[];
  badges: { id: string; name: string; tier: string; iconSlug: string }[];
  joinedAt: string;
  isPrivate: boolean;
}
```

### Public Profil Sayfası

```typescript
// app/u/[slug]/page.tsx — SSG + revalidate: 3600

// Layout:
┌────────────────────────────────────────┐
│  [Profil İkonu]  KaaN#TR1             │
│  Gold II · 127 LP · %56 WR            │
├────────────────────────────────────────┤
│  Rozetler                              │
│  [🏆][⚡][🛡️][🔥][📈][👑]           │
├────────────────────────────────────────┤
│  Favori Şampiyonlar                    │
│  Ahri 74 maç %61    [====]            │
│  Viktor 45 maç %58  [====]            │
├────────────────────────────────────────┤
│  "Sen de AI koçunla analiz et →"       │
│  [Ücretsiz Başla]                      │
└────────────────────────────────────────┘
```

### OG Image

```typescript
// app/api/og/profile/[slug]/route.ts
// next/og — 1200x630
// Rank rozeti, isim, top 3 şampiyon, kazanılan rozet sayısı
```

### Gizlilik Ayarları Sayfası

```typescript
// app/(app)/settings/privacy/page.tsx
// Toggle'lar: Rank / WR / Rozetler / Şampiyonlar / Profil görünürlüğü
// PATCH /api/user/profile-settings
```

### Profil URL Kopyalama

Kendi profil sayfasına "Profil linki kopyala" butonu ekle (authenticated view).

---

## Files

```
prisma/schema.prisma                                    ← User.profileSlug, profilePublic, profileSettings
prisma/migrations/YYYYMMDD_add_profile_fields/          ← YENİ
app/u/[slug]/page.tsx                                   ← YENİ public profil
app/api/public/profile/[slug]/route.ts                  ← YENİ public API
app/api/og/profile/[slug]/route.ts                      ← YENİ OG image
app/(app)/settings/privacy/page.tsx                     ← YENİ gizlilik ayarları
app/api/user/profile-settings/route.ts                  ← PATCH
src/domains/identity/services/profileService.ts         ← YENİ (slug üretimi, public data build)
src/hooks/useProfileSettings.ts                         ← YENİ TanStack Query
src/domains/riot/services/riotAccountService.ts         ← Riot bağlantısında slug üret
```

---

## Tier Gating

- **Herkes:** Public profil görüntüleme
- **Free:** Profil var, gizlilik kontrolü var
- **Pro:** OG image özelleştirme, "Verified Coach" badge

---

## Test Plan

```typescript
describe('profileService', () => {
  it('toProfileSlug: "KaaN#TR1" → "KaaN-TR1"')
  it('toProfileSlug: özel karakterler temizleniyor')
  it('getPublicProfile: gizli alan null döndürüyor')
  it('getPublicProfile: profil gizliyse isPrivate: true')
})
```

---

## Dependencies

- `achievementService` (TASK-078) — rozetler için
- Riot account slug üretimi Riot bağlantısında tetikleniyor

---

## Definition of Done

- `/u/KaaN-TR1` public sayfası çalışıyor
- Discord'da link paylaşılınca OG preview görünüyor
- Gizlilik ayarları kaydediliyor
- CTA ile landing page'e yönlendirme çalışıyor
