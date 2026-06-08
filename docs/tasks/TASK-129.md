# TASK-129 — Eğitim Planı Otomasyonu

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 68/100

## Objective

improvementPlanService.ts 14 günlük plan üretiyor ama expire olunca otomatik yenileme yok. Plan bittiğinde Inngest fonksiyon yeni plan üretmeli.

## Acceptance Criteria

- Plan expire olduğunda improvement/plan.expired Inngest event'i fire edilir
- Inngest fonksiyon yeni planı otomatik üretir
- Kullanıcıya email/in-app bildirim: Yeni 14 günlük planınız hazır
- Plan geçmişi sayfada görünür kalır
