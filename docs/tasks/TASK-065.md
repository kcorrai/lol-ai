# TASK-065 â€” [F2-5] Draft Analyzer SayfasÄ± UI

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 2.5 days

---

## Objective

Draft Analyzer'Ä±n tam kullanÄ±cÄ± arayÃ¼zÃ¼nÃ¼ yaz. 10 champion picker, takÄ±m kompozisyon karÅŸÄ±laÅŸtÄ±rmasÄ±, win conditions, scaling chart ve risk analizi.

---

## Acceptance Criteria

- [ ] `app/(app)/draft/page.tsx` oluÅŸturuldu
- [ ] `RoleBasedTeamPicker` (TASK-038) iki takÄ±m iÃ§in Ã§alÄ±ÅŸÄ±yor
- [ ] SeÃ§ilen champion diÄŸer takÄ±mÄ±n picker'larÄ±nda gÃ¶sterilemiyor (duplicate prevention)
- [ ] "Analiz Et" butonu tÃ¼m 10 pozisyon doluyken aktif
- [ ] `TeamCompositionCard` 5 metriÄŸi bar chart ile gÃ¶steriyor
- [ ] `ScalingChart` Early/Mid/Late game gÃ¼Ã§ Ã§izgisini gÃ¶rselleÅŸtiriyor
- [ ] Win conditions her takÄ±m iÃ§in ayrÄ± gÃ¶steriliyor
- [ ] Key matchups listesi var
- [ ] Risk kartlarÄ± severity'e gÃ¶re renk kodlu
- [ ] Verdict sonuÃ§ metni Ã¶ne Ã§Ä±kÄ±yor
- [ ] Loading skeleton var
- [ ] Share butonu URL kopyalÄ±yor
- [ ] Dark mode, mobil responsive
- [ ] Component'lerin hiÃ§biri 200 satÄ±rÄ± geÃ§miyor

---

## Teknik Gereksinimler

### Sayfa YapÄ±sÄ±

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Draft Analizci                                      â”‚
â”‚  â”Œâ”€â”€â”€ Blue Team â”€â”€â”€â”€â”    â”Œâ”€â”€â”€ Red Team â”€â”€â”€â”€â”€â”       â”‚
â”‚  â”‚ Top:    [Sel]   â”‚    â”‚ Top:    [Sel]    â”‚       â”‚
â”‚  â”‚ Jungle: [Sel]   â”‚    â”‚ Jungle: [Sel]    â”‚       â”‚
â”‚  â”‚ Mid:    [Sel]   â”‚    â”‚ Mid:    [Sel]    â”‚       â”‚
â”‚  â”‚ ADC:    [Sel]   â”‚    â”‚ ADC:    [Sel]    â”‚       â”‚
â”‚  â”‚ Supp:   [Sel]   â”‚    â”‚ Supp:   [Sel]    â”‚       â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â”‚
â”‚  [Analiz Et â†’]  [SÄ±fÄ±rla]                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  TakÄ±m Kompozisyon KarÅŸÄ±laÅŸtÄ±rmasÄ±                  â”‚
â”‚  Blue â–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘ vs Red â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ  (5 metrik bar)          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Kazanma KoÅŸullarÄ±                                  â”‚
â”‚  Blue: [1][2]  |  Red: [1][2]                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Scaling: [Early][Mid][Late] power line             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Kritik EÅŸleÅŸmeler & Riskler                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  SonuÃ§: [verdict metni â€” Ã¶ne Ã§Ä±kan card]            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### TeamCompositionCard BileÅŸeni

5 metrik iÃ§in bar chart (CSS ile, external chart kÃ¼tÃ¼phanesi gerekmez):
- Her metrik: etiket + iki taraflÄ± bar (blue vs red)
- Blue = sol taraf mavi, Red = saÄŸ taraf kÄ±rmÄ±zÄ±
- SayÄ±sal deÄŸer (1-10) gÃ¶ster

### ScalingChart BileÅŸeni

Early/Mid/Late game iÃ§in basit progress gÃ¶sterge:
- Her aÅŸama iÃ§in iki renk dot (blue/red) + skor
- AÃ§Ä±klama metnini hover/click'te gÃ¶ster

### Risk KartlarÄ±

- High severity = kÄ±rmÄ±zÄ± kenarlÄ±k
- Medium = sarÄ± kenarlÄ±k
- Low = gri kenarlÄ±k
- TakÄ±m badge: Blue/Red etiket

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-038 (RoleBasedTeamPicker)
- TASK-064 (useDraftAnalysis hook)

