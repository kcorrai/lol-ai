# TASK-049 â€” [F1-5] Matchup Coach SayfasÄ± UI

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 2 days

---

## Objective

Matchup Coach'un tam kullanÄ±cÄ± arayÃ¼zÃ¼nÃ¼ yaz. Ä°ki champion seÃ§imi, analiz tetikleme ve dÃ¶rt sekmeli sonuÃ§ gÃ¶sterimi (Lane / Trade / Build / Hatalar).

---

## Acceptance Criteria

- [ ] `app/(app)/matchup/page.tsx` oluÅŸturuldu
- [ ] Ä°ki `ChampionSelector` (TASK-038) yan yana Ã§alÄ±ÅŸÄ±yor
- [ ] Rol seÃ§ici (5 buton) Ã§alÄ±ÅŸÄ±yor
- [ ] "Analiz Et" butonu Ã¼Ã§ alan da doluyken aktif
- [ ] Loading skeleton gÃ¶steriliyor
- [ ] DÃ¶rt sekme Ã§alÄ±ÅŸÄ±yor: Lane Analizi, Trade Rehberi, Build, Kritik Hatalar
- [ ] Her sekmenin iÃ§eriÄŸi ilgili `MatchupAnalysis` alanÄ±nÄ± doÄŸru render ediyor
- [ ] Power spike'lar liste veya timeline olarak gÃ¶steriliyor
- [ ] Trade kartlarÄ± (Short / Long) gÃ¶rsel olarak ayrÄ±ÅŸÄ±yor
- [ ] Build itemler grid formatÄ±nda, reasoning altÄ±nda
- [ ] Kritik hatalar kÄ±rmÄ±zÄ± uyarÄ± kutucuklarÄ± olarak gÃ¶steriliyor
- [ ] Share butonu URL'yi panoya kopyalÄ±yor
- [ ] Dark mode Ã§alÄ±ÅŸÄ±yor, mobil responsive
- [ ] `MatchupSkeleton.tsx` yazÄ±ldÄ±
- [ ] `MatchupSection.tsx` yazÄ±ldÄ± (tab iÃ§eriklerini render eden component)

---

## Teknik Gereksinimler

### Sayfa YapÄ±sÄ±

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Matchup KoÃ§u                               â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  vs  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚[ChampSelector]â”‚     â”‚[ChampSelector]â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚  [Top][JGL][MID][ADC][SUP]                 â”‚
â”‚  [Analiz Et â†’]  (disabled until all set)   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Lane Analizi][Trade][Build][Hatalar]      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  <Tab iÃ§eriÄŸi â€” MatchupSection>             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Lane Analizi Sekmesi

- Avantaj/dezavantaj badge: favorable=yeÅŸil, unfavorable=kÄ±rmÄ±zÄ±, even=gri
- Summary metni
- "Level 1-3 PlanÄ±" ve "Level 6 PlanÄ±" aÃ§Ä±klama kutularÄ±
- Power spike'lar: level veya item tetikleyicili liste

### Trade Rehberi Sekmesi

- Short Trade kartÄ±: scenario + advantage badge + tip
- Long Trade kartÄ±: aynÄ± format
- Kazanma KoÅŸullarÄ±: yeÅŸil checkmark listesi
- Kaybetme KoÅŸullarÄ±: kÄ±rmÄ±zÄ± X listesi

### Build Sekmesi

- "BaÅŸlangÄ±Ã§ Itemleri": kÃ¼Ã§Ã¼k kutucuklar (ikon yoksa item adÄ±)
- "Core Itemler": bÃ¼yÃ¼k kutucuklar
- "Durumsal Itemler": kenarlÄ±klÄ± kutucuklar + aÃ§Ä±klama
- Reasoning metni italik olarak

### Kritik Hatalar Sekmesi

- ÃœÃ§ bÃ¶lÃ¼m kÄ±rmÄ±zÄ± arka planlÄ± kart: Avoid Trades / Risky Timings / Key Mistakes
- Her madde Ã¶nÃ¼nde âš  ikonu

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-038 (ChampionSelector)
- TASK-048 (useMatchupAnalysis hook)

---

## Notlar

- Sekme yÃ¶netimi iÃ§in `useState<'lane' | 'trade' | 'build' | 'mistakes'>` yeterli â€” Radix Tabs da kullanÄ±labilir.
- Page component 200 satÄ±rÄ± geÃ§erse `MatchupSection.tsx`'e daha fazla mantÄ±k taÅŸÄ±.
- Share: `navigator.clipboard.writeText(window.location.href)` + toast bildirimi.
