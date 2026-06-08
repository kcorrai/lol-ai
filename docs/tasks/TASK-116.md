# TASK-116 — Pro Oyuncu Karşılaştırma (F-017)

**Phase:** 4
**Status:** Done
**Priority:** P1
**Puan:** 78/100

## Objective

Kullanıcının şampiyon istatistiklerini yüksek elo (Master+) ortalamalarıyla karşılaştır. Ahri CS/dk 5.2, Master+ ortalaması 7.1 gibi spesifik benchmarklar. Rakip araçlarda bu özellik yok.

## Acceptance Criteria

- /api/riot/:riotAccountId/pro-comparison?championId=X endpoint'i
- Master+ oyuncuların şampiyon bazlı aggregate stats'ları (public high-elo data veya DDragon)
- Champion pool sayfasında per-champion karşılaştırma kartı
- Coaching report'a inject edilebilir context
