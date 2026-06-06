# TASK-074 — Improvement Tracker UI: Mevcut Servisi Öne Çıkar

**Phase:** 2 — AI Depth & Retention  
**Status:** Pending  
**Estimated Effort:** 1.5 days  
**Priority:** P1

---

## Objective

`improvementPlanService.ts` tam çalışıyor ama hiçbir yerde gösterilmiyor.
Dashboard'a plan widget'ı, geçmiş planlar görünümü ve haftalık skor ekle.
Bu özellik retention'ın en güçlü silahı: "geri dönme sebebi" yaratır.

---

## User Story

> "AI bana CS hedefi verdi ama bu hedefe ulaşıp ulaşmadığımı takip eden
> bir yer yok. Haftayı tamamladım mı bilmiyorum."

---

## Acceptance Criteria

- [ ] Dashboard'da "Bu Haftaki Hedefler" widget'ı görünüyor
- [ ] Her hedef: metrik adı, baseline, hedef, progress bar, mevcut değer
- [ ] Hedef tamamlandıysa yeşil ✅, devam ediyorsa mavi ⏳, geride kalındıysa kırmızı ❌
- [ ] "Plan Geçmişi" sayfası: önceki planlar, tamamlanma oranı, skor
- [ ] "Yeni Plan Oluştur" butonu (Pro kullanıcısına)
- [ ] Free kullanıcı: planı görür ama yeni oluşturamaz (paywall modal)
- [ ] Haftalık gelişim skoru hesaplanıyor: tamamlanan hedef sayısı × 33
- [ ] Plan yoksa Empty State: "Henüz planın yok — oluştur" CTA
- [ ] Mobile responsive
- [ ] Loading skeleton

---

## Mevcut Altyapı (Kullan)

- `improvementPlanService.ts` — `getActivePlan()`, `generatePlan()` ✅
- `ImprovementPlan` Prisma model ✅
- `PlanWithProgress`, `PlanProgress`, `ImprovementTarget` tipleri ✅
- API route varlığını kontrol et: `app/api/improvement/` — yoksa oluştur

---

## Yeni Gereksinimler

### Plan Geçmişi Endpoint'i

```typescript
// app/api/improvement/history/route.ts
// GET — kullanıcının geçmiş tüm planlarını döndür
// Response: { plans: PlanHistoryEntry[], totalCompleted: number, avgScore: number }

interface PlanHistoryEntry {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
  completedCount: number;
  totalTargets: number;
  weeklyScore: number;   // 0-100
}
```

### Haftalık Skor Hesabı

`improvementPlanService.ts`'e `computeWeeklyScore()` fonksiyonu ekle:
```typescript
function computeWeeklyScore(progresses: PlanProgress[]): number {
  if (progresses.length === 0) return 0;
  const completed = progresses.filter(p => p.achieved).length;
  const partial = progresses.filter(p => !p.achieved && p.progress > 0.5).length;
  return Math.round((completed * 33 + partial * 15));
}
```

---

## Component Yapısı

```
src/domains/analysis/components/
  ImprovementPlanWidget.tsx      ← Dashboard widget (compact, max 200 satır)
  ImprovementGoalRow.tsx         ← Tek hedef satırı (progress bar + durum ikonu)
  PlanHistoryCard.tsx            ← Geçmiş plan kartı
  PlanEmptyState.tsx             ← Plan yok durumu

app/(app)/improvement/
  page.tsx                       ← Tam sayfa: aktif plan + geçmiş
```

### ImprovementPlanWidget (Dashboard)

```
┌──────────────────────────────────────────────────────┐
│  Gelişim Planı — Hafta 1/2            [Detaylar →]  │
├──────────────────────────────────────────────────────┤
│  ✅ CS/Dakika   5.8 → 6.5   [████████░░] %85  6.4  │
│  ⏳ Vision      18 → 25     [███░░░░░░░] %30  20   │
│  ❌ Ölüm/Oyun  6.2 → 4.5   [░░░░░░░░░░] %0   6.8  │
├──────────────────────────────────────────────────────┤
│  Haftalık Puan: 48/100   [Yeni Plan →] (Pro)        │
└──────────────────────────────────────────────────────┘
```

### Improvement Sayfası (`/improvement`)

```
┌────────────────────────────────────────────────────────┐
│  Gelişim Takibi                                        │
├──────────────────────────── Aktif Plan ────────────────┤
│  [ImprovementGoalRow × 3]                              │
│  [Yeni Plan Oluştur] (Pro badge ile)                  │
├──────────────────────── Geçmiş Planlar ────────────────┤
│  Hafta: 28 Mayıs — 4 Haz   Puan: 66/100   2/3 Tamamlandı │
│  Hafta: 21 — 27 Mayıs       Puan: 33/100   1/3 Tamamlandı │
│  ...                                                    │
└────────────────────────────────────────────────────────┘
```

---

## API Routes

Mevcut route'ları kontrol et, eksik olanları oluştur:

```
app/api/improvement/plan/route.ts     ← GET (active plan), POST (generate)
app/api/improvement/history/route.ts  ← GET (plan history) — YENİ
```

---

## Files

```
src/domains/analysis/services/improvementPlanService.ts      ← computeWeeklyScore ekle
src/domains/analysis/components/ImprovementPlanWidget.tsx    ← YENİ
src/domains/analysis/components/ImprovementGoalRow.tsx       ← YENİ
src/domains/analysis/components/PlanHistoryCard.tsx          ← YENİ
src/domains/analysis/components/PlanEmptyState.tsx           ← YENİ
app/(app)/improvement/page.tsx                               ← YENİ sayfa
app/(app)/dashboard/page.tsx                                 ← widget ekle
app/api/improvement/plan/route.ts                            ← kontrol et / yaz
app/api/improvement/history/route.ts                         ← YENİ
src/hooks/useImprovementPlan.ts                              ← kontrol et / yaz
```

---

## Sidebar Navigasyonu

`src/components/layout/Sidebar.tsx`'e "Gelişim" linki ekle:
- `/improvement` — progress ikon ile

---

## Tier Gating

- **Free:** Aktif planı görür ama yeni oluşturamaz; "Pro'ya geç" modal
- **Pro:** Sınırsız plan oluşturma + geçmiş
- **Elite:** Geçmişe göre AI trend yorumu (opsiyonel, mini model)

---

## Test Plan

```typescript
describe('ImprovementPlanWidget', () => {
  it('plan varsa hedefleri gösteriyor')
  it('plan yoksa empty state gösteriyor')
  it('tamamlanan hedef yeşil ✅ ikonu alıyor')
  it('geride kalan hedef kırmızı ❌ alıyor')
})

describe('computeWeeklyScore', () => {
  it('3 tamamlanan → 99 puan')
  it('1 tamamlanan + 1 partial → 48 puan')
  it('hiç tamamlanmayan → 0 puan')
})
```

---

## Dependencies

- `improvementPlanService.ts` ✅ (servis var)
- `ImprovementPlan` Prisma model ✅

---

## Definition of Done

- Widget dashboard'da görünüyor
- `/improvement` sayfası çalışıyor
- Plan geçmişi endpoint'i test edildi
- Free/Pro gating çalışıyor
- Mobile'da görünüm bozulmuyor
- Component'lerin hiçbiri 200 satırı geçmiyor
