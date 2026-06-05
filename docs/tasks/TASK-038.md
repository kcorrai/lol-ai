# TASK-038 — [INFRA-2] ChampionSelector Shared Component

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

F1 (Matchup), F2 (Draft), F3 (Counter), F7 (OTP) feature'larının tamamı champion seçimi gerektiriyor. Tekrar yazmak yerine tek bir reusable component oluştur. Ayrıca F2 Draft Analyzer için her role özel 5+5 picker varyantını hazırla.

---

## Acceptance Criteria

- [ ] `src/components/shared/ChampionSelector.tsx` oluşturuldu
- [ ] Arama alanında 300ms debounce çalışıyor
- [ ] Seçili champion ikon + isim olarak gösteriliyor (mevcut `ChampionIcon` kullanılıyor)
- [ ] Keyboard navigation çalışıyor (arrow keys + enter + escape)
- [ ] `/api/champions` endpoint'inden champion listesi çekiliyor
- [ ] `filterRole` prop ile pozisyona göre filtreleme yapılabiliyor
- [ ] Desktop: dropdown. Mobile: full-width drawer.
- [ ] Dark mode destekli, mevcut Tailwind tasarım sistemine uygun
- [ ] `src/components/shared/RoleBasedTeamPicker.tsx` oluşturuldu (F2 için)
- [ ] `RoleBasedTeamPicker` 5 pozisyon için 5 ayrı `ChampionSelector` render ediyor
- [ ] Seçili champion başka bir `ChampionSelector`'da gösterilemiyor (duplicate prevention)
- [ ] TypeScript strict — tam prop tipleri, `any` yok
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
  excludeChampions?: string[];  // bu listede olanları gösterme (duplicate prevention)
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
  excludeChampions?: string[]; // diğer takımın seçimleri
}
```

### Veri Çekme

`/api/champions` endpoint'i zaten var. `useQuery` ile champions listesi çek:
```typescript
queryKey: ['champions']
staleTime: Infinity  // champion listesi değişmez
```

---

## Bağımlılıklar

- TASK-037 değil — bağımsız, paralel geliştirilebilir.
- Mevcut `ChampionIcon` component'i kullanıyor (zaten var).
- Mevcut `/api/champions` endpoint'i kullanıyor (zaten var).

---

## Notlar

- Bu component F1, F2, F3, F7 task'larından önce tamamlanmalı — tüm sayfalar buna bağımlı.
- `size` prop: `sm` = 32px icon, `md` = 40px icon, `lg` = 48px icon.
- Seçim temizleme: `value` doluyken "×" butonu göster, tıklayınca `onChange(null)` çağır.
