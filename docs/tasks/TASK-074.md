# TASK-074 â€” Improvement Tracker UI: Mevcut Servisi Ã–ne Ã‡Ä±kar

**Phase:** 2 â€” AI Depth & Retention  
**Status:** Done  
**Estimated Effort:** 1.5 days  
**Priority:** P1

---

## Objective

`improvementPlanService.ts` tam Ã§alÄ±ÅŸÄ±yor ama hiÃ§bir yerde gÃ¶sterilmiyor.
Dashboard'a plan widget'Ä±, geÃ§miÅŸ planlar gÃ¶rÃ¼nÃ¼mÃ¼ ve haftalÄ±k skor ekle.
Bu Ã¶zellik retention'Ä±n en gÃ¼Ã§lÃ¼ silahÄ±: "geri dÃ¶nme sebebi" yaratÄ±r.

---

## User Story

> "AI bana CS hedefi verdi ama bu hedefe ulaÅŸÄ±p ulaÅŸmadÄ±ÄŸÄ±mÄ± takip eden
> bir yer yok. HaftayÄ± tamamladÄ±m mÄ± bilmiyorum."

---

## Acceptance Criteria

- [ ] Dashboard'da "Bu Haftaki Hedefler" widget'Ä± gÃ¶rÃ¼nÃ¼yor
- [ ] Her hedef: metrik adÄ±, baseline, hedef, progress bar, mevcut deÄŸer
- [ ] Hedef tamamlandÄ±ysa yeÅŸil âœ…, devam ediyorsa mavi â³, geride kalÄ±ndÄ±ysa kÄ±rmÄ±zÄ± âŒ
- [ ] "Plan GeÃ§miÅŸi" sayfasÄ±: Ã¶nceki planlar, tamamlanma oranÄ±, skor
- [ ] "Yeni Plan OluÅŸtur" butonu (Pro kullanÄ±cÄ±sÄ±na)
- [ ] Free kullanÄ±cÄ±: planÄ± gÃ¶rÃ¼r ama yeni oluÅŸturamaz (paywall modal)
- [ ] HaftalÄ±k geliÅŸim skoru hesaplanÄ±yor: tamamlanan hedef sayÄ±sÄ± Ã— 33
- [ ] Plan yoksa Empty State: "HenÃ¼z planÄ±n yok â€” oluÅŸtur" CTA
- [ ] Mobile responsive
- [ ] Loading skeleton

---

## Mevcut AltyapÄ± (Kullan)

- `improvementPlanService.ts` â€” `getActivePlan()`, `generatePlan()` âœ…
- `ImprovementPlan` Prisma model âœ…
- `PlanWithProgress`, `PlanProgress`, `ImprovementTarget` tipleri âœ…
- API route varlÄ±ÄŸÄ±nÄ± kontrol et: `app/api/improvement/` â€” yoksa oluÅŸtur

---

## Yeni Gereksinimler

### Plan GeÃ§miÅŸi Endpoint'i

```typescript
// app/api/improvement/history/route.ts
// GET â€” kullanÄ±cÄ±nÄ±n geÃ§miÅŸ tÃ¼m planlarÄ±nÄ± dÃ¶ndÃ¼r
// Response: { plans: PlanHistoryEntry[], totalCompleted: number, avgScore: number }

interface PlanHistoryEntry {
  id: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired";
  completedCount: number;
  totalTargets: number;
  weeklyScore: number; // 0-100
}
```

### HaftalÄ±k Skor HesabÄ±

`improvementPlanService.ts`'e `computeWeeklyScore()` fonksiyonu ekle:

```typescript
function computeWeeklyScore(progresses: PlanProgress[]): number {
  if (progresses.length === 0) return 0;
  const completed = progresses.filter((p) => p.achieved).length;
  const partial = progresses.filter((p) => !p.achieved && p.progress > 0.5).length;
  return Math.round(completed * 33 + partial * 15);
}
```

---

## Component YapÄ±sÄ±

```
src/domains/analysis/components/
  ImprovementPlanWidget.tsx      â† Dashboard widget (compact, max 200 satÄ±r)
  ImprovementGoalRow.tsx         â† Tek hedef satÄ±rÄ± (progress bar + durum ikonu)
  PlanHistoryCard.tsx            â† GeÃ§miÅŸ plan kartÄ±
  PlanEmptyState.tsx             â† Plan yok durumu

app/(app)/improvement/
  page.tsx                       â† Tam sayfa: aktif plan + geÃ§miÅŸ
```

### ImprovementPlanWidget (Dashboard)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  GeliÅŸim PlanÄ± â€” Hafta 1/2            [Detaylar â†’]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  âœ… CS/Dakika   5.8 â†’ 6.5   [â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘] %85  6.4  â”‚
â”‚  â³ Vision      18 â†’ 25     [â–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘] %30  20   â”‚
â”‚  âŒ Ã–lÃ¼m/Oyun  6.2 â†’ 4.5   [â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘] %0   6.8  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  HaftalÄ±k Puan: 48/100   [Yeni Plan â†’] (Pro)        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Improvement SayfasÄ± (`/improvement`)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  GeliÅŸim Takibi                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Aktif Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [ImprovementGoalRow Ã— 3]                              â”‚
â”‚  [Yeni Plan OluÅŸtur] (Pro badge ile)                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ GeÃ§miÅŸ Planlar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Hafta: 28 MayÄ±s â€” 4 Haz   Puan: 66/100   2/3 TamamlandÄ± â”‚
â”‚  Hafta: 21 â€” 27 MayÄ±s       Puan: 33/100   1/3 TamamlandÄ± â”‚
â”‚  ...                                                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## API Routes

Mevcut route'larÄ± kontrol et, eksik olanlarÄ± oluÅŸtur:

```
app/api/improvement/plan/route.ts     â† GET (active plan), POST (generate)
app/api/improvement/history/route.ts  â† GET (plan history) â€” YENÄ°
```

---

## Files

```
src/domains/analysis/services/improvementPlanService.ts      â† computeWeeklyScore ekle
src/domains/analysis/components/ImprovementPlanWidget.tsx    â† YENÄ°
src/domains/analysis/components/ImprovementGoalRow.tsx       â† YENÄ°
src/domains/analysis/components/PlanHistoryCard.tsx          â† YENÄ°
src/domains/analysis/components/PlanEmptyState.tsx           â† YENÄ°
app/(app)/improvement/page.tsx                               â† YENÄ° sayfa
app/(app)/dashboard/page.tsx                                 â† widget ekle
app/api/improvement/plan/route.ts                            â† kontrol et / yaz
app/api/improvement/history/route.ts                         â† YENÄ°
src/hooks/useImprovementPlan.ts                              â† kontrol et / yaz
```

---

## Sidebar Navigasyonu

`src/components/layout/Sidebar.tsx`'e "GeliÅŸim" linki ekle:

- `/improvement` â€” progress ikon ile

---

## Tier Gating

- **Free:** Aktif planÄ± gÃ¶rÃ¼r ama yeni oluÅŸturamaz; "Pro'ya geÃ§" modal
- **Pro:** SÄ±nÄ±rsÄ±z plan oluÅŸturma + geÃ§miÅŸ
- **Elite:** GeÃ§miÅŸe gÃ¶re AI trend yorumu (opsiyonel, mini model)

---

## Test Plan

```typescript
describe("ImprovementPlanWidget", () => {
  it("plan varsa hedefleri gÃ¶steriyor");
  it("plan yoksa empty state gÃ¶steriyor");
  it("tamamlanan hedef yeÅŸil âœ… ikonu alÄ±yor");
  it("geride kalan hedef kÄ±rmÄ±zÄ± âŒ alÄ±yor");
});

describe("computeWeeklyScore", () => {
  it("3 tamamlanan â†’ 99 puan");
  it("1 tamamlanan + 1 partial â†’ 48 puan");
  it("hiÃ§ tamamlanmayan â†’ 0 puan");
});
```

---

## Dependencies

- `improvementPlanService.ts` âœ… (servis var)
- `ImprovementPlan` Prisma model âœ…

---

## Definition of Done

- Widget dashboard'da gÃ¶rÃ¼nÃ¼yor
- `/improvement` sayfasÄ± Ã§alÄ±ÅŸÄ±yor
- Plan geÃ§miÅŸi endpoint'i test edildi
- Free/Pro gating Ã§alÄ±ÅŸÄ±yor
- Mobile'da gÃ¶rÃ¼nÃ¼m bozulmuyor
- Component'lerin hiÃ§biri 200 satÄ±rÄ± geÃ§miyor
