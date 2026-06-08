# TASK-137 — A/B Test Altyapısı (Feature Flags)

**Phase:** 4
**Status:** Done
**Priority:** P3
**Puan:** 62/100

## Objective

Feature flag ve A/B test olmadan deneyler yapılamıyor. Basit DB tabanlı feature flags ile başla.

## Acceptance Criteria

- feature_flags tablosu: key, enabled, rollout_percentage, user_segment
- useFeatureFlag(key) hook client-side
- getFeatureFlag(key, userId) server-side helper
- Admin panelinde flag yönetimi
- Ilk deney: onboarding A/B test
