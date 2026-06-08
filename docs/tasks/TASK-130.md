# TASK-130 — Test Coverage: Eksik Unit Testler

**Phase:** 4
**Status:** Done
**Priority:** P3
**Puan:** 68/100

## Objective

milestoneService.ts, cardService.ts, improvementPlanService.ts, retentionService.ts için unit test eksik. Domain servislerde %80 coverage hedefi.

## Acceptance Criteria

- milestoneService.test.ts: happy path, yetersiz veri
- cardService.test.ts: token generation, expiry
- improvementPlanService.test.ts: target seçim, progress hesabı
- retentionService.test.ts: cohort hesabı
- vitest run --coverage sonucu domain services %80+
