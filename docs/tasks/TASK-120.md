# TASK-120 — Coaching Pipeline: AI Retry Mantığı

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 74/100

## Objective

AI_ARCHITECTURE.md Section 7.3'te retry planlanmış ama coachingPipeline.ts direkt failed'a düşüyor. JSON parse hatası veya schema validation başarısız olursa 1 kez retry yapılmalı.

## Acceptance Criteria

- JSON parse hatası veya Zod validation hatası -> stricter prompt ile 1 retry
- Retry de başarısız olursa status: failed, Sentry log
- Max 1 retry (sonsuz döngü yok)
- Retry sayısı ai_analyses tablosuna kaydediliyor
