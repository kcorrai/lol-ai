# TASK-113 — Rank Benchmark: Kendi Veritabanından Gerçek Veri

**Phase:** 4
**Status:** Done
**Priority:** P1
**Puan:** 82/100

## Objective

AI coaching input'una inject edilen rank benchmark değerleri (CS/dk, vision score, KDA) büyük ihtimalle hardcoded veya tahmine dayalı. Kendi DB'mizdeki maç verilerinden tier bazlı gerçek ortalamalar hesaplanmalı.

## Acceptance Criteria

- rank_benchmarks tablosu veya cached servis kendi match_participants'dan hesaplıyor
- Tier bazlı (Iron/Bronze/.../Challenger) CS/dk, vision, KDA ortalamaları
- Günlük Inngest job ile güncelleniyor
- Coaching pipeline bu gerçek değerleri kullanıyor
