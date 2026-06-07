# TASK-083 â€” Public Profil & Sosyal PaylaÅŸÄ±m

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P2

---

## Objective

Her kullanÄ±cÄ± iÃ§in paylaÅŸÄ±labilir public profil sayfasÄ± oluÅŸtur.
`/u/KaaN%23TR1` URL'ine giren herkes rank, rozet vitrini, favori ÅŸampiyon
ve sezon istatistiklerini gÃ¶rebilsin. KullanÄ±cÄ± gizlilik ayarlarÄ±yla neyin
gÃ¶rÃ¼neceÄŸini kontrol edebilsin.

---

## User Story

> "Discord'da arkadaÅŸlarÄ±ma 'LoL AI Coach kullanÄ±yorum' diyorum ama
> gÃ¶sterecek bir ÅŸeyim yok. Profil linkimi paylaÅŸabilmek istiyorum."

---

## Acceptance Criteria

- [ ] `/u/[summonerSlug]` public sayfasÄ± â€” auth gerekmez
- [ ] GÃ¶sterilenler: rank, WR, favori ÅŸampiyonlar (top 3), kazanÄ±lan rozetler (top 6)
- [ ] KullanÄ±cÄ± kendi profilinde hangi bilgilerin gÃ¶rÃ¼neceÄŸini seÃ§ebiliyor
- [ ] OG meta tag: paylaÅŸÄ±lÄ±nca Discord/Twitter'da Ã¶nizleme Ã§Ä±kÄ±yor
- [ ] "Bunu sen de dene â†’ lolaicoach.com" conversion CTA
- [ ] Gizlenen veriler placeholder ile gÃ¶steriliyor (gizlenmiÅŸ etiketi)
- [ ] Profil URL'i: Riot hesabÄ± baÄŸlandÄ±ktan sonra otomatik oluÅŸturuluyor
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### DB Schema (User modeline ekle)

```prisma
// User modeline ekle:
profileSlug     String?  @unique  // "KaaN-TR1" (Ã¶zel karakter temizlenmiÅŸ)
profilePublic   Boolean  @default(true)
profileSettings Json?    // { showRank: true, showWR: true, showBadges: true, showChampions: true }
```

Slug Ã¼retimi:
```typescript
// Riot hesabÄ± baÄŸlanÄ±nca: "KaaN#TR1" â†’ "KaaN-TR1"
function toProfileSlug(gameName: string, tagLine: string): string {
  return `${gameName}-${tagLine}`.replace(/[^a-zA-Z0-9-_]/g, '-');
}
```

### Public Profil Endpoint

```typescript
// app/api/public/profile/[slug]/route.ts
// GET â€” auth yok, rate limit 60/dk per IP

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

### Public Profil SayfasÄ±

```typescript
// app/u/[slug]/page.tsx â€” SSG + revalidate: 3600

// Layout:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  [Profil Ä°konu]  KaaN#TR1             â”‚
â”‚  Gold II Â· 127 LP Â· %56 WR            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Rozetler                              â”‚
â”‚  [ğŸ†][âš¡][ğŸ›¡ï¸][ğŸ”¥][ğŸ“ˆ][ğŸ‘‘]           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Favori Åampiyonlar                    â”‚
â”‚  Ahri 74 maÃ§ %61    [====]            â”‚
â”‚  Viktor 45 maÃ§ %58  [====]            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  "Sen de AI koÃ§unla analiz et â†’"       â”‚
â”‚  [Ãœcretsiz BaÅŸla]                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### OG Image

```typescript
// app/api/og/profile/[slug]/route.ts
// next/og â€” 1200x630
// Rank rozeti, isim, top 3 ÅŸampiyon, kazanÄ±lan rozet sayÄ±sÄ±
```

### Gizlilik AyarlarÄ± SayfasÄ±

```typescript
// app/(app)/settings/privacy/page.tsx
// Toggle'lar: Rank / WR / Rozetler / Åampiyonlar / Profil gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼
// PATCH /api/user/profile-settings
```

### Profil URL Kopyalama

Kendi profil sayfasÄ±na "Profil linki kopyala" butonu ekle (authenticated view).

---

## Files

```
prisma/schema.prisma                                    â† User.profileSlug, profilePublic, profileSettings
prisma/migrations/YYYYMMDD_add_profile_fields/          â† YENÄ°
app/u/[slug]/page.tsx                                   â† YENÄ° public profil
app/api/public/profile/[slug]/route.ts                  â† YENÄ° public API
app/api/og/profile/[slug]/route.ts                      â† YENÄ° OG image
app/(app)/settings/privacy/page.tsx                     â† YENÄ° gizlilik ayarlarÄ±
app/api/user/profile-settings/route.ts                  â† PATCH
src/domains/identity/services/profileService.ts         â† YENÄ° (slug Ã¼retimi, public data build)
src/hooks/useProfileSettings.ts                         â† YENÄ° TanStack Query
src/domains/riot/services/riotAccountService.ts         â† Riot baÄŸlantÄ±sÄ±nda slug Ã¼ret
```

---

## Tier Gating

- **Herkes:** Public profil gÃ¶rÃ¼ntÃ¼leme
- **Free:** Profil var, gizlilik kontrolÃ¼ var
- **Pro:** OG image Ã¶zelleÅŸtirme, "Verified Coach" badge

---

## Test Plan

```typescript
describe('profileService', () => {
  it('toProfileSlug: "KaaN#TR1" â†’ "KaaN-TR1"')
  it('toProfileSlug: Ã¶zel karakterler temizleniyor')
  it('getPublicProfile: gizli alan null dÃ¶ndÃ¼rÃ¼yor')
  it('getPublicProfile: profil gizliyse isPrivate: true')
})
```

---

## Dependencies

- `achievementService` (TASK-078) â€” rozetler iÃ§in
- Riot account slug Ã¼retimi Riot baÄŸlantÄ±sÄ±nda tetikleniyor

---

## Definition of Done

- `/u/KaaN-TR1` public sayfasÄ± Ã§alÄ±ÅŸÄ±yor
- Discord'da link paylaÅŸÄ±lÄ±nca OG preview gÃ¶rÃ¼nÃ¼yor
- Gizlilik ayarlarÄ± kaydediliyor
- CTA ile landing page'e yÃ¶nlendirme Ã§alÄ±ÅŸÄ±yor

