# TASK-111 — Performans Snapshot Otomasyonu

**Phase:** 4
**Status:** Done
**Priority:** P1
**Puan:** 88/100

## Objective

performance_snapshots tablosu var ve habitDetection/tilt/milestone servisleri bu tabloyu okuyor. Ama otomatik dolduran Inngest fonksiyonu yok. matchSync tamamlandıktan sonra haftalık snapshot otomatik oluşturulmalı.

## Acceptance Criteria

- matchSync worker tamamlandığında performance/snapshot.requested event'i fire eder
- Yeni Inngest fonksiyonu haftalık snapshot hesaplayıp DB'ye yazar
- Haftada en fazla 1 snapshot per account (duplicate koruması)
- Habit detection bu snapshot'tan otomatik çalışır
