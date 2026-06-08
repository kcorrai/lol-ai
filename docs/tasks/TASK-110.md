# TASK-110 — Coaching Report Status: Polling yerine SSE

**Phase:** 4
**Status:** Done
**Priority:** P1
**Puan:** 89/100

## Objective

Kullanıcı rapor oluştururken 45 saniye polling yapıyor. /api/coaching/reports/:id/status endpoint'i SSE ile anlık durum push'una dönüştürülmeli.

## Acceptance Criteria

- /api/coaching/reports/:id/stream SSE endpoint'i eklendi
- Frontend EventSource ile bağlanır, polling kaldırılır
- connected, processing, complete, failed event tipleri
- Bağlantı koparsa otomatik reconnect
