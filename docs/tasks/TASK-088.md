# TASK-088: SEO Champion Sayfaları — `/champions/[name]`

## Status: Open

## Context

`/api/public/champions` endpoint'i DDragon champion listesini döndürüyor. Ancak hiçbir public, bot-taranabilir champion sayfası yok. "Ahri guide", "Viktor counter", "best mid laners" gibi aramalarda Google'dan organik trafik çekmek için SSG champion sayfaları gerekiyor.

## Deliverables

### 1. Route

`app/(marketing)/champions/[name]/page.tsx`

- `generateStaticParams()` ile DDragon'dan tüm champion adlarını çek, build-time render
- `revalidate = 86400` (günde bir yenile)
- `generateMetadata()` ile her şampiyona özgü `<title>` ve `<description>`

### 2. Sayfa İçeriği

Her champion sayfasında:

- **Hero**: splash art (`fill` ile Next.js Image), şampiyonun adı, lakabı, sınıfı
- **Genel Bakış**: lore özeti (DDragon'dan alınan kısa bio)
- **İstatistikler**: base stats (HP, armor, MR, attack damage, range)
- **İpuçları** (statik, curated): 3 madde — laning, teamfight, itemization
- **Neden LoL AI Coach?** CTA blok: "Ahri ile daha iyi oynamak için AI koçunla analiz et → Ücretsiz Başla"
- **İlgili Şampiyonlar**: aynı sınıftan 4 şampiyona link

### 3. Champion Listesi Sayfası

`app/(marketing)/champions/page.tsx`

- Tüm şampiyonların grid görünümü (ikon + isim + sınıf)
- Sınıfa göre filtre: Mage, Assassin, Tank, Support, Marksman, Fighter
- Her kart `/champions/[name]`'e link

### 4. Sitemap Güncellemesi

`app/sitemap.ts` (yoksa oluştur) — `/champions/[name]` URL'lerini dahil et

### 5. Metadata Örnekleri

```
title: "Ahri Rehberi — LoL AI Coach ile Ustalaş"
description: "Ahri'nin yeteneklerini, counter pick'lerini ve build ipuçlarını öğren. AI koçunla Ahri performansını analiz et."
```

## Acceptance Criteria

- [ ] Build-time'da tüm şampiyonlar için statik HTML üretiliyor
- [ ] Her sayfa Lighthouse SEO skorunda 90+ alıyor
- [ ] OG image tag'i mevcut (champion splash kullanılabilir)
- [ ] `/champions` listesi sınıfa göre filtrelenebilir
- [ ] `sitemap.ts`'te tüm champion URL'leri listeleniyor
- [ ] Hiçbir sayfada `no-img-element` ESLint hatası yok

## Technical Notes

- DDragon base URL: `https://ddragon.leagueoflegends.com/cdn/{{version}}/data/en_US/champion/{{name}}.json`
- Version için `getOrCreateCurrentPatch()` yerine build-time fetch kullan: `https://ddragon.leagueoflegends.com/api/versions.json`
- Sayfa içeriği tamamen statik — bu sayfalarda Prisma/DB çağrısı yok
- `next.config.mjs`'te `ddragon.leagueoflegends.com` zaten `remotePatterns`'te var
- Marketing layout kullan (`(marketing)` route group)
