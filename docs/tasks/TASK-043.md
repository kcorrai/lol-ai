# TASK-043 — [F3-5] Counter Pick Sayfası UI

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1.5 days

---

## Objective

Counter Pick Generator'ın kullanıcı arayüzünü yaz. Kullanıcı rakip champion ve rol seçsin, AI counter listesini görsel olarak sunsun. Sayfa auth gerektirmeden çalışmalı.

---

## Acceptance Criteria

- [ ] `app/(app)/counter/page.tsx` oluşturuldu
- [ ] `ChampionSelector` (TASK-038) ve rol seçici kullanılıyor
- [ ] Seçim yapılmadan sayfa boş state gösteriyor
- [ ] Analiz yüklenirken skeleton gösteriliyor
- [ ] Hata durumunda retry butonlu hata mesajı gösteriliyor
- [ ] `CounterCard` bileşeni: champion ikon, tier badge, detay alanları
- [ ] Üç liste ayrı section'da gösteriliyor: En Güçlü / Kolay / Solo Queue
- [ ] Sayfanın altında AI disclaimer metni var
- [ ] Dark mode çalışıyor
- [ ] Mobil responsive
- [ ] `CounterCard.tsx`, `CounterList.tsx`, `CounterPageSkeleton.tsx` yazıldı
- [ ] `useGeneralCounterPick` (TASK-042) hook kullanılıyor

---

## Teknik Gereksinimler

### Sayfa Yapısı (`page.tsx`)

```
┌─────────────────────────────────────┐
│  Rakip Şampiyonu Kim?               │
│  [ChampionSelector]  [Rol ▼]       │
├─────────────────────────────────────┤
│  En Güçlü Counterlar (topCounters) │
│  [CounterCard S] [CounterCard S]   │
├─────────────────────────────────────┤
│  Kolay Oynanabilir (easyCounters)  │
│  [CounterCard A] [CounterCard B]   │
├─────────────────────────────────────┤
│  Solo Queue Önerileri              │
│  [CounterCard] [CounterCard]       │
├─────────────────────────────────────┤
│  Genel İpuçları                    │
│  • ipucu 1                         │
│  • ipucu 2                         │
├─────────────────────────────────────┤
│  ⚠ Bu analizler AI tarafından...   │
└─────────────────────────────────────┘
```

### CounterCard Bileşeni

- Champion ikon (`ChampionIcon`) + isim
- Tier badge: S=mavi, A=yeşil, B=sarı
- Difficulty badge: easy=yeşil, medium=sarı, hard=kırmızı
- "Neden güçlü" metni (collapsed default, expand on click)
- "Lane avantajı", "Dikkat et", "Build ipucu" — expand olduğunda görünür

### Loading State

`CounterPageSkeleton`: 6 adet card skeleton (2x3 grid veya list).

### Empty State

Şampiyon ve rol seçilmemişken: "Karşı oynadığın şampiyonu seç ve counter'larını keşfet" metni + ikon.

---

## Bağımlılıklar

- TASK-038 (ChampionSelector)
- TASK-042 (useGeneralCounterPick hook)

---

## Notlar

- Sayfa `app/(app)/` altında — layout'u otomatik alacak (Sidebar, TopBar vs.).
- Component dosyaları 200 satırı geçmemeli (CLAUDE.md kuralı). CounterCard karmaşıklaşırsa alt component'lere böl.
- `CounterCard` expand/collapse için Radix UI `Collapsible` veya basit `useState` ile yönet.
