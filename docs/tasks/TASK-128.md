# TASK-128 — Onboarding Akışı İyileştirmesi

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 69/100

## Objective

/onboarding/page.tsx mevcut ama WOW moment optimize edilmeli. Riot ID bağlandıktan sonra ilk sync sırasında kullanıcıya değer gösterilmeli, ilk rapor otomatik tetiklenmeli.

## Acceptance Criteria

- Adım 1: Riot ID bagla
- Adım 2: Sync progress (SSE ile gerçek zamanli)
- Adım 3: Ilk rapor otomatik üretiliyor, beklerken özellikler gösteriliyor
- Adım 4: Rapor hazır -> confetti + Ilk koçlugunuz hazır!
- Completion rate PostHog'da izleniyor
