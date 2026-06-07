# TASK-052 â€” [F56-2] Roadmap SayfasÄ±na Rank Hedefi SeÃ§me Ekle

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

Mevcut roadmap sayfasÄ±nÄ± (`app/(app)/roadmap/page.tsx`) enhance et. KullanÄ±cÄ± bir rank hedefi seÃ§sin, tahmini sÃ¼re gÃ¶sterilsin, gÃ¶revler bu hedefe baÄŸlansÄ±n.

---

## Acceptance Criteria

- [ ] Sayfa Ã¼stÃ¼ne rank hedefi seÃ§ici eklendi
- [ ] Mevcut rank otomatik olarak `useRankedData` hook'undan Ã§ekiliyor
- [ ] Hedef rank kullanÄ±cÄ± tarafÄ±ndan seÃ§ilebiliyor (Tier + Division)
- [ ] SeÃ§im `uiStore` Zustand store'una eklendi ve localStorage'a persist ediliyor
- [ ] `useRankUpProbability` hook'undan tahmini sÃ¼re (maÃ§ sayÄ±sÄ±) gÃ¶steriliyor
- [ ] Mevcut 14-day plan gÃ¶revleri korunuyor, rank hedefi context'i altÄ±nda gÃ¶steriliyor
- [ ] Progress bar: "Hedefe X% yakÄ±nsÄ±n" gÃ¶sterimi
- [ ] Mevcut sayfa iÅŸlevselliÄŸi bozulmadÄ±
- [ ] Dark mode, mobile responsive

---

## Teknik Gereksinimler

### Rank Hedefi SeÃ§ici BileÅŸeni

`src/domains/analysis/components/RankGoalSelector.tsx`:

```typescript
interface RankGoalSelectorProps {
  currentRank: { tier: RankTier; division: RankDivision; lp: number } | null;
  value: { tier: RankTier; division: RankDivision } | null;
  onChange: (goal: { tier: RankTier; division: RankDivision }) => void;
}
```

GÃ¶sterim:
```
Mevcut: [Gold III 45 LP]  â†’  Hedef: [Platinum IV â–¼]
Tahmini: ~23 maÃ§ (60% WR ile)
```

### Zustand Store GÃ¼ncellemesi

`src/lib/stores/uiStore.ts` dosyasÄ±na ekle:
```typescript
rankGoal: { tier: RankTier; division: RankDivision } | null;
setRankGoal: (goal: { tier: RankTier; division: RankDivision } | null) => void;
```
`persist` middleware zaten var â€” yeni alan otomatik localStorage'a yazÄ±lÄ±r.

### Progress HesabÄ±

`useRankUpProbability` hook'u LP proximity ve win rate skorlarÄ±nÄ± dÃ¶ndÃ¼rÃ¼yor. Bu skoru kullanarak basit bir progress bar oluÅŸtur:
- Skor 0-100 arasÄ± normalize edilmiÅŸ deÄŸer
- Bar rengi: 0-33=kÄ±rmÄ±zÄ±, 34-66=sarÄ±, 67-100=yeÅŸil

---

## BaÄŸÄ±mlÄ±lÄ±klar

- BaÄŸÄ±msÄ±z â€” mevcut kod Ã¼zerinde enhancement.
- `useRankedData` ve `useRankUpProbability` hook'larÄ± zaten var.

---

## Notlar

- Hedef rank seÃ§icisi mevcut rank'tan dÃ¼ÅŸÃ¼k seÃ§ilemez (validation).
- En fazla 2 tier ilerisi seÃ§ilebilir (Ã¶r. Gold â†’ Diamond direkt seÃ§ilemesin).
- "Tahmini sÃ¼re" yaklaÅŸÄ±k deÄŸerdir â€” "â‰ˆ X maÃ§" formatÄ±nda gÃ¶ster, kesin vaat etme.

