# TASK-122 — Teamfight Analizi (Match Timeline)

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 72/100

## Objective

timelineFetcher.ts Inngest fonksiyonu timeline verisini çekiyor ama işleyen servis yok. Timeline'dan teamfight katılım oranı ve ölüm zamanlama analizi çıkarılmalı.

## Acceptance Criteria

- timelineService.ts teamfight event'lerini parse eder (CHAMPION_KILL, itemler)
- Maç detay sayfasında Teamfight Analizi sekmesi
- Ölüm zamanlaması (erken/mid/geç oyun dağılımı) grafiği
- AI coaching input'una teamfight context inject edilir
