# TASK-125 — Type Safety: Unknown Cast Temizliği

**Phase:** 4
**Status:** Done
**Priority:** P3
**Puan:** 71/100

## Objective

improvementPlanService.ts, habitDetectionService.ts gibi servislerde JSONB alanlar için as unknown as object[] double cast var. Typed wrapper interface'ler tanımlanmalı.

## Acceptance Criteria

- JSONB alanlar için typed helper'lar src/types/'da tanımlı
- as unknown as X pattern'ı kaldırıldı
- TypeScript strict mode altında yeni hata yok
- ESLint no-explicit-any rule aktif
