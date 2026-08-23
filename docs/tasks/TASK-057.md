# TASK-057 â€” [F7-5] OTP Assistant SayfasÄ± UI

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 2 days

---

## Objective

OTP Assistant'Ä±n tam kullanÄ±cÄ± arayÃ¼zÃ¼nÃ¼ yaz. Champion seÃ§imi, matchup tier list grid, ban Ã¶ncelikleri, gizli mekanikler, power spike'lar ve meta rating gÃ¶sterimi.

---

## Acceptance Criteria

- [ ] `app/(app)/otp/page.tsx` oluÅŸturuldu
- [ ] `ChampionSelector` (TASK-038) + rol seÃ§ici Ã§alÄ±ÅŸÄ±yor
- [ ] `MetaRating.tsx` animasyonlu progress bar ile 1-10 skor gÃ¶steriyor
- [ ] `MatchupTierList.tsx` Ã¼Ã§ sÃ¼tunlu grid render ediyor (kolay/orta/zor)
- [ ] Her matchup kartÄ± hover'da detay aÃ§Ä±yor
- [ ] `BanPriority.tsx` 3 ban Ã¶nceliÄŸini sÄ±ralÄ± gÃ¶steriyor
- [ ] Gizli mekanikler bullet liste olarak gÃ¶steriliyor
- [ ] Power spike'lar trigger â†’ description formatÄ±nda gÃ¶steriliyor
- [ ] Free kullanÄ±cÄ±lar iÃ§in `hiddenMechanics` blur overlay + "Pro'ya GeÃ§" CTA
- [ ] `OtpSkeleton.tsx` yazÄ±ldÄ±
- [ ] Loading, error, empty state'ler var
- [ ] Dark mode, mobil responsive
- [ ] `useOtpAssistant` (TASK-056) hook kullanÄ±lÄ±yor

---

## Teknik Gereksinimler

### Sayfa YapÄ±sÄ±

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  OTP AsistanÄ±                            â”‚
â”‚  [ChampionSelector]  [Rol SeÃ§ici]       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Meta Rating                             â”‚
â”‚  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘  8/10 "GÃ¼Ã§lÃ¼"               â”‚
â”‚  [reasoning metni]                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Matchup Tier List                       â”‚
â”‚  KOLAY        ORTA         ZOR          â”‚
â”‚  [Kart]      [Kart]       [Kart]        â”‚
â”‚  [Kart]      [Kart]       [Kart]        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Ban Ã–ncelikleri                         â”‚
â”‚  #1 [Champ] â€” [Sebep]                   â”‚
â”‚  #2 [Champ] â€” [Sebep]                   â”‚
â”‚  #3 [Champ] â€” [Sebep]                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Power Spike'lar                         â”‚
â”‚  âš¡ Level 6 â†’ [aÃ§Ä±klama]               â”‚
â”‚  âš¡ Trinity Force â†’ [aÃ§Ä±klama]         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Gizli Mekanikler  [PRO badge]          â”‚
â”‚  â€¢ [mekanik 1]   â† blur (free user)    â”‚
â”‚  â€¢ [mekanik 2]   â† blur (free user)    â”‚
â”‚  [Pro'ya GeÃ§ â†’]                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### MatchupTierList BileÅŸeni

- 3 sÃ¼tunlu grid (responsive: tek sÃ¼tun mobilde)
- Kolay = yeÅŸil kenarlÄ±k, Orta = sarÄ±, Zor = kÄ±rmÄ±zÄ±
- Her kart: ChampionIcon + opponent adÄ± + difficulty badge
- Hover/click: `keyTip` ve `summary` gÃ¶ster (tooltip veya expand)

### MetaRating BileÅŸeni

- CSS animasyonlu progress bar (0â†’score deÄŸerine)
- Skor rengi: 8-10=yeÅŸil, 5-7=sarÄ±, 1-4=kÄ±rmÄ±zÄ±
- `assessment` badge + `reasoning` metni
- Alt kÄ±sÄ±mda kÃ¼Ã§Ã¼k font: `patchContext`

### Free KullanÄ±cÄ± Gating

`hiddenMechanics` bÃ¶lÃ¼mÃ¼ne:

- Ä°lk 2 mekanik gÃ¶rÃ¼nÃ¼r
- Gerisi iÃ§in blur CSS filter uygula
- "TÃ¼m gizli mekanikleri gÃ¶rmek iÃ§in Pro'ya geÃ§in" overlay CTA

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-038 (ChampionSelector)
- TASK-056 (useOtpAssistant hook)
- `useSubscription` hook'u (plan kontrolÃ¼ iÃ§in, zaten var)
