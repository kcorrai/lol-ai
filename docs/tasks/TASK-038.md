# TASK-038 â€” [INFRA-2] ChampionSelector Shared Component

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

F1 (Matchup), F2 (Draft), F3 (Counter), F7 (OTP) feature'larÄ±nÄ±n tamamÄ± champion seÃ§imi gerektiriyor. Tekrar yazmak yerine tek bir reusable component oluÅŸtur. AyrÄ±ca F2 Draft Analyzer iÃ§in her role Ã¶zel 5+5 picker varyantÄ±nÄ± hazÄ±rla.

---

## Acceptance Criteria

- [ ] `src/components/shared/ChampionSelector.tsx` oluÅŸturuldu
- [ ] Arama alanÄ±nda 300ms debounce Ã§alÄ±ÅŸÄ±yor
- [ ] SeÃ§ili champion ikon + isim olarak gÃ¶steriliyor (mevcut `ChampionIcon` kullanÄ±lÄ±yor)
- [ ] Keyboard navigation Ã§alÄ±ÅŸÄ±yor (arrow keys + enter + escape)
- [ ] `/api/champions` endpoint'inden champion listesi Ã§ekiliyor
- [ ] `filterRole` prop ile pozisyona gÃ¶re filtreleme yapÄ±labiliyor
- [ ] Desktop: dropdown. Mobile: full-width drawer.
- [ ] Dark mode destekli, mevcut Tailwind tasarÄ±m sistemine uygun
- [ ] `src/components/shared/RoleBasedTeamPicker.tsx` oluÅŸturuldu (F2 iÃ§in)
- [ ] `RoleBasedTeamPicker` 5 pozisyon iÃ§in 5 ayrÄ± `ChampionSelector` render ediyor
- [ ] SeÃ§ili champion baÅŸka bir `ChampionSelector`'da gÃ¶sterilemiyor (duplicate prevention)
- [ ] TypeScript strict â€” tam prop tipleri, `any` yok
- [ ] Component'ler `src/components/shared/index.ts`'den export ediliyor

---

## Teknik Gereksinimler

### ChampionSelector Props

```typescript
interface ChampionSelectorProps {
  value: string | null;
  onChange: (champion: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  filterRole?: Position;
  excludeChampions?: string[];  // bu listede olanlarÄ± gÃ¶sterme (duplicate prevention)
  className?: string;
}
```

### RoleBasedTeamPicker Props

```typescript
interface TeamSelection {
  TOP: string | null;
  JUNGLE: string | null;
  MIDDLE: string | null;
  BOTTOM: string | null;
  UTILITY: string | null;
}

interface RoleBasedTeamPickerProps {
  value: TeamSelection;
  onChange: (team: TeamSelection) => void;
  label?: string;           // "Blue Team" / "Red Team"
  excludeChampions?: string[]; // diÄŸer takÄ±mÄ±n seÃ§imleri
}
```

### Veri Ã‡ekme

`/api/champions` endpoint'i zaten var. `useQuery` ile champions listesi Ã§ek:
```typescript
queryKey: ['champions']
staleTime: Infinity  // champion listesi deÄŸiÅŸmez
```

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 deÄŸil â€” baÄŸÄ±msÄ±z, paralel geliÅŸtirilebilir.
- Mevcut `ChampionIcon` component'i kullanÄ±yor (zaten var).
- Mevcut `/api/champions` endpoint'i kullanÄ±yor (zaten var).

---

## Notlar

- Bu component F1, F2, F3, F7 task'larÄ±ndan Ã¶nce tamamlanmalÄ± â€” tÃ¼m sayfalar buna baÄŸÄ±mlÄ±.
- `size` prop: `sm` = 32px icon, `md` = 40px icon, `lg` = 48px icon.
- SeÃ§im temizleme: `value` doluyken "Ã—" butonu gÃ¶ster, tÄ±klayÄ±nca `onChange(null)` Ã§aÄŸÄ±r.

