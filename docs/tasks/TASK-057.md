# TASK-057 — [F7-5] OTP Assistant Sayfası UI

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 2 days

---

## Objective

OTP Assistant'ın tam kullanıcı arayüzünü yaz. Champion seçimi, matchup tier list grid, ban öncelikleri, gizli mekanikler, power spike'lar ve meta rating gösterimi.

---

## Acceptance Criteria

- [ ] `app/(app)/otp/page.tsx` oluşturuldu
- [ ] `ChampionSelector` (TASK-038) + rol seçici çalışıyor
- [ ] `MetaRating.tsx` animasyonlu progress bar ile 1-10 skor gösteriyor
- [ ] `MatchupTierList.tsx` üç sütunlu grid render ediyor (kolay/orta/zor)
- [ ] Her matchup kartı hover'da detay açıyor
- [ ] `BanPriority.tsx` 3 ban önceliğini sıralı gösteriyor
- [ ] Gizli mekanikler bullet liste olarak gösteriliyor
- [ ] Power spike'lar trigger → description formatında gösteriliyor
- [ ] Free kullanıcılar için `hiddenMechanics` blur overlay + "Pro'ya Geç" CTA
- [ ] `OtpSkeleton.tsx` yazıldı
- [ ] Loading, error, empty state'ler var
- [ ] Dark mode, mobil responsive
- [ ] `useOtpAssistant` (TASK-056) hook kullanılıyor

---

## Teknik Gereksinimler

### Sayfa Yapısı

```
┌──────────────────────────────────────────┐
│  OTP Asistanı                            │
│  [ChampionSelector]  [Rol Seçici]       │
├──────────────────────────────────────────┤
│  Meta Rating                             │
│  ████████░░  8/10 "Güçlü"               │
│  [reasoning metni]                       │
├──────────────────────────────────────────┤
│  Matchup Tier List                       │
│  KOLAY        ORTA         ZOR          │
│  [Kart]      [Kart]       [Kart]        │
│  [Kart]      [Kart]       [Kart]        │
├──────────────────────────────────────────┤
│  Ban Öncelikleri                         │
│  #1 [Champ] — [Sebep]                   │
│  #2 [Champ] — [Sebep]                   │
│  #3 [Champ] — [Sebep]                   │
├──────────────────────────────────────────┤
│  Power Spike'lar                         │
│  ⚡ Level 6 → [açıklama]               │
│  ⚡ Trinity Force → [açıklama]         │
├──────────────────────────────────────────┤
│  Gizli Mekanikler  [PRO badge]          │
│  • [mekanik 1]   ← blur (free user)    │
│  • [mekanik 2]   ← blur (free user)    │
│  [Pro'ya Geç →]                         │
└──────────────────────────────────────────┘
```

### MatchupTierList Bileşeni

- 3 sütunlu grid (responsive: tek sütun mobilde)
- Kolay = yeşil kenarlık, Orta = sarı, Zor = kırmızı
- Her kart: ChampionIcon + opponent adı + difficulty badge
- Hover/click: `keyTip` ve `summary` göster (tooltip veya expand)

### MetaRating Bileşeni

- CSS animasyonlu progress bar (0→score değerine)
- Skor rengi: 8-10=yeşil, 5-7=sarı, 1-4=kırmızı
- `assessment` badge + `reasoning` metni
- Alt kısımda küçük font: `patchContext`

### Free Kullanıcı Gating

`hiddenMechanics` bölümüne:
- İlk 2 mekanik görünür
- Gerisi için blur CSS filter uygula
- "Tüm gizli mekanikleri görmek için Pro'ya geçin" overlay CTA

---

## Bağımlılıklar

- TASK-038 (ChampionSelector)
- TASK-056 (useOtpAssistant hook)
- `useSubscription` hook'u (plan kontrolü için, zaten var)
