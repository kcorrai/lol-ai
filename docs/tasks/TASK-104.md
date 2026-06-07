# TASK-104 — Mobile-Optimized Responsive Redesign

**Phase:** 4 — Scale & Expansion  
**Status:** Done  
**Estimated Effort:** 4 gün  
**Priority:** P2

---

## Objective

Tüm uygulama sayfalarını mobile-first prensiple yeniden düzenle. Şu an masaüstü
için tasarlanmış olan layout, navigasyon ve veri yoğun bileşenlerin mobil ekranlarda
(375px–768px) kullanılabilir ve performanslı olmasını sağla. Hedef: LCP < 2.5s
mobil cihazlarda, Core Web Vitals "Good" seviyesi.

---

## User Story

> "Telefonda matchlerime bakabilmek, koçluk raporumu okuyabilmek istiyorum.
> Şu an her şey çok küçük ve tıklanamaz."

---

## Acceptance Criteria

- [ ] Sidebar → mobil alt navigasyon bar olarak çalışıyor (≤768px)
- [ ] Dashboard sayfası tek kolon grid'e geçiyor (≤640px)
- [ ] Match history listesi mobilde okunabilir (şampiyon ikonu + skor + W/L)
- [ ] Coaching rapor sayfası mobilde tam okunabilir
- [ ] Tüm form input'ları ve butonlar min 44px touch target
- [ ] Tablo bileşenleri mobilde yatay scroll veya kart görünümüne geçiyor
- [ ] Champion pool sayfası mobilde grid → liste görünümü
- [ ] Heatmap bileşeni mobilde doğru ölçekleniyor
- [ ] `MobileNav.tsx` komponenti tam işlevsel
- [ ] Lighthouse Mobile skoru ≥ 85 (Performance)
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Breakpoint Stratejisi (Tailwind)

```
xs:  < 480px  → single column, compact
sm:  480–640px → single column, comfortable
md:  640–768px → transitional (2 col possible)
lg:  768px+   → masaüstü layout (mevcut)
```

### Navigasyon — Mobil Alt Bar

```typescript
// src/components/layout/MobileNav.tsx
// Şu an taslak olarak mevcut, tam implement edilecek

// Bottom navigation: Dashboard | Maçlar | Koçluk | Şampiyonlar | Profil
// Sabit alt bar, z-50
// Active state: icon fill + text label
// Bildirim badge desteği
```

```typescript
// src/components/layout/Sidebar.tsx
// lg altında hidden olacak

// app/(app)/layout.tsx
// lg altında: MobileNav render, Sidebar hidden
// lg üstünde: Sidebar render, MobileNav hidden
```

### Dashboard Grid

```tsx
// Mevcut: grid-cols-3
// Yeni:   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Match History — Responsive Satır

```tsx
// Masaüstü: tam tablo (şampiyon | skor | KDA | CS | süre | tarih | rapor)
// Mobil: kompakt kart
// → ChampionIcon (32px) | W/L badge | K/D/A | süre
// Gizlenenler: CS, vision, detay
<div className="hidden lg:table-row">…</div>
<div className="lg:hidden flex items-center gap-2">…</div>
```

### Veri Tabloları

Tüm `<table>` bileşenlerine overflow-x-auto wrapper:
```tsx
<div className="overflow-x-auto -mx-4 px-4">
  <table className="min-w-full">…</table>
</div>
```

Veya mobil kart görünümüne geçiş:
```tsx
// Tablolar için ResponsiveTable wrapper bileşeni
// md altında kart, md üstünde tablo render eder
```

### Champion Pool — Grid → Liste

```tsx
// Masaüstü: grid-cols-4
// Tablet:   grid-cols-2
// Mobil:    flex-col (liste satırı: icon + name + stats)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
```

### Touch Target Audit

Tüm interactive elementler için min-h-[44px] min-w-[44px] kuralı:
```tsx
// Kötü:
<button className="p-1 text-sm">

// İyi:
<button className="min-h-[44px] px-3 text-sm">
```

### Performance

- `next/image` ile tüm şampiyon ikonları lazy load
- Above-the-fold içerikleri priority={true}
- Heatmap bileşeni: mobilde canvas boyutu 320px max
- Recharts grafikleri: ResponsiveContainer ile otomatik boyutlandırma

---

## Sayfalar — Öncelik Sırası

| Öncelik | Sayfa | Kritik Sorun |
|---|---|---|
| P0 | Dashboard | Grid taşıyor |
| P0 | Match History | Tablo taşıyor |
| P0 | Coaching Report | Font küçük, okumak zor |
| P1 | Champion Pool | Grid bozuk |
| P1 | Settings | Form inputlar küçük |
| P2 | Death Heatmap | Canvas boyutu |
| P2 | Leaderboard | Tablo taşıyor |
| P3 | Season Recap | Slide boyutları |
| P3 | Draft Simülatörü | Komp kartları taşıyor |

---

## Files

```
src/components/layout/MobileNav.tsx                  ← GÜNCELLE (tam implement)
src/components/layout/Sidebar.tsx                    ← GÜNCELLE (lg:block hidden)
app/(app)/layout.tsx                                 ← GÜNCELLE (nav switching)
app/(app)/dashboard/page.tsx                         ← GÜNCELLE (responsive grid)
app/(app)/matches/page.tsx                           ← GÜNCELLE (responsive table)
app/(app)/coaching/[reportId]/page.tsx               ← GÜNCELLE (mobil okunabilir)
app/(app)/champions/page.tsx                         ← GÜNCELLE (responsive grid)
src/components/shared/ResponsiveTable.tsx            ← YENİ (tablo/kart switcher)
```

---

## Test Plan

- Playwright mobile viewport testleri (375px × 812px — iPhone SE)
- Her kritik sayfa için screenshot karşılaştırması
- Touch target audit: her buton ≥ 44px
- Lighthouse CI: mobile Performance ≥ 85

```typescript
// tests/e2e/mobile-nav.spec.ts
test('mobil navigasyon çalışıyor', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  // sidebar görünmüyor
  // bottom nav görünüyor
  // her nav item'a tıklanıyor, doğru sayfaya gidiyor
});
```

---

## Definition of Done

- Sidebar mobilde gizli, MobileNav aktif
- Dashboard, match history, coaching report sayfaları 375px'te kullanılabilir
- Tüm buton/link touch target ≥ 44px
- Lighthouse Mobile Performance ≥ 85
- Masaüstü görünümü bozulmadı (regression yok)
