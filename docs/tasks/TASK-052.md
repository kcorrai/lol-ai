# TASK-052 — [F56-2] Roadmap Sayfasına Rank Hedefi Seçme Ekle

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Mevcut roadmap sayfasını (`app/(app)/roadmap/page.tsx`) enhance et. Kullanıcı bir rank hedefi seçsin, tahmini süre gösterilsin, görevler bu hedefe bağlansın.

---

## Acceptance Criteria

- [ ] Sayfa üstüne rank hedefi seçici eklendi
- [ ] Mevcut rank otomatik olarak `useRankedData` hook'undan çekiliyor
- [ ] Hedef rank kullanıcı tarafından seçilebiliyor (Tier + Division)
- [ ] Seçim `uiStore` Zustand store'una eklendi ve localStorage'a persist ediliyor
- [ ] `useRankUpProbability` hook'undan tahmini süre (maç sayısı) gösteriliyor
- [ ] Mevcut 14-day plan görevleri korunuyor, rank hedefi context'i altında gösteriliyor
- [ ] Progress bar: "Hedefe X% yakınsın" gösterimi
- [ ] Mevcut sayfa işlevselliği bozulmadı
- [ ] Dark mode, mobile responsive

---

## Teknik Gereksinimler

### Rank Hedefi Seçici Bileşeni

`src/domains/analysis/components/RankGoalSelector.tsx`:

```typescript
interface RankGoalSelectorProps {
  currentRank: { tier: RankTier; division: RankDivision; lp: number } | null;
  value: { tier: RankTier; division: RankDivision } | null;
  onChange: (goal: { tier: RankTier; division: RankDivision }) => void;
}
```

Gösterim:
```
Mevcut: [Gold III 45 LP]  →  Hedef: [Platinum IV ▼]
Tahmini: ~23 maç (60% WR ile)
```

### Zustand Store Güncellemesi

`src/lib/stores/uiStore.ts` dosyasına ekle:
```typescript
rankGoal: { tier: RankTier; division: RankDivision } | null;
setRankGoal: (goal: { tier: RankTier; division: RankDivision } | null) => void;
```
`persist` middleware zaten var — yeni alan otomatik localStorage'a yazılır.

### Progress Hesabı

`useRankUpProbability` hook'u LP proximity ve win rate skorlarını döndürüyor. Bu skoru kullanarak basit bir progress bar oluştur:
- Skor 0-100 arası normalize edilmiş değer
- Bar rengi: 0-33=kırmızı, 34-66=sarı, 67-100=yeşil

---

## Bağımlılıklar

- Bağımsız — mevcut kod üzerinde enhancement.
- `useRankedData` ve `useRankUpProbability` hook'ları zaten var.

---

## Notlar

- Hedef rank seçicisi mevcut rank'tan düşük seçilemez (validation).
- En fazla 2 tier ilerisi seçilebilir (ör. Gold → Diamond direkt seçilemesin).
- "Tahmini süre" yaklaşık değerdir — "≈ X maç" formatında göster, kesin vaat etme.
