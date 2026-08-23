# TASK-043 â€” [F3-5] Counter Pick SayfasÄ± UI

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1.5 days

---

## Objective

Counter Pick Generator'Ä±n kullanÄ±cÄ± arayÃ¼zÃ¼nÃ¼ yaz. KullanÄ±cÄ± rakip champion ve rol seÃ§sin, AI counter listesini gÃ¶rsel olarak sunsun. Sayfa auth gerektirmeden Ã§alÄ±ÅŸmalÄ±.

---

## Acceptance Criteria

- [ ] `app/(app)/counter/page.tsx` oluÅŸturuldu
- [ ] `ChampionSelector` (TASK-038) ve rol seÃ§ici kullanÄ±lÄ±yor
- [ ] SeÃ§im yapÄ±lmadan sayfa boÅŸ state gÃ¶steriyor
- [ ] Analiz yÃ¼klenirken skeleton gÃ¶steriliyor
- [ ] Hata durumunda retry butonlu hata mesajÄ± gÃ¶steriliyor
- [ ] `CounterCard` bileÅŸeni: champion ikon, tier badge, detay alanlarÄ±
- [ ] ÃœÃ§ liste ayrÄ± section'da gÃ¶steriliyor: En GÃ¼Ã§lÃ¼ / Kolay / Solo Queue
- [ ] SayfanÄ±n altÄ±nda AI disclaimer metni var
- [ ] Dark mode Ã§alÄ±ÅŸÄ±yor
- [ ] Mobil responsive
- [ ] `CounterCard.tsx`, `CounterList.tsx`, `CounterPageSkeleton.tsx` yazÄ±ldÄ±
- [ ] `useGeneralCounterPick` (TASK-042) hook kullanÄ±lÄ±yor

---

## Teknik Gereksinimler

### Sayfa YapÄ±sÄ± (`page.tsx`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Rakip Åampiyonu Kim?               â”‚
â”‚  [ChampionSelector]  [Rol â–¼]       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  En GÃ¼Ã§lÃ¼ Counterlar (topCounters) â”‚
â”‚  [CounterCard S] [CounterCard S]   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Kolay Oynanabilir (easyCounters)  â”‚
â”‚  [CounterCard A] [CounterCard B]   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Solo Queue Ã–nerileri              â”‚
â”‚  [CounterCard] [CounterCard]       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Genel Ä°puÃ§larÄ±                    â”‚
â”‚  â€¢ ipucu 1                         â”‚
â”‚  â€¢ ipucu 2                         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  âš  Bu analizler AI tarafÄ±ndan...   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### CounterCard BileÅŸeni

- Champion ikon (`ChampionIcon`) + isim
- Tier badge: S=mavi, A=yeÅŸil, B=sarÄ±
- Difficulty badge: easy=yeÅŸil, medium=sarÄ±, hard=kÄ±rmÄ±zÄ±
- "Neden gÃ¼Ã§lÃ¼" metni (collapsed default, expand on click)
- "Lane avantajÄ±", "Dikkat et", "Build ipucu" â€” expand olduÄŸunda gÃ¶rÃ¼nÃ¼r

### Loading State

`CounterPageSkeleton`: 6 adet card skeleton (2x3 grid veya list).

### Empty State

Åampiyon ve rol seÃ§ilmemiÅŸken: "KarÅŸÄ± oynadÄ±ÄŸÄ±n ÅŸampiyonu seÃ§ ve counter'larÄ±nÄ± keÅŸfet" metni + ikon.

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-038 (ChampionSelector)
- TASK-042 (useGeneralCounterPick hook)

---

## Notlar

- Sayfa `app/(app)/` altÄ±nda â€” layout'u otomatik alacak (Sidebar, TopBar vs.).
- Component dosyalarÄ± 200 satÄ±rÄ± geÃ§memeli (CLAUDE.md kuralÄ±). CounterCard karmaÅŸÄ±klaÅŸÄ±rsa alt component'lere bÃ¶l.
- `CounterCard` expand/collapse iÃ§in Radix UI `Collapsible` veya basit `useState` ile yÃ¶net.
