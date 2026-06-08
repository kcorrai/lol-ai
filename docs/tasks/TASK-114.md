# TASK-114 — Kullanıcı Analitik Pipeline (PostHog)

**Phase:** 4
**Status:** Done
**Priority:** P1
**Puan:** 80/100

## Objective

Hangi özelliğin ne kadar kullanıldığı bilinmiyor. PostHog GDPR uyumlu analytics entegre edilmeli. Temel event'ler izlenmeli: signup, riot_connect, report_generated, upgrade_clicked.

## Acceptance Criteria

- PostHog client-side SDK app/layout.tsx'e eklendi
- Temel event'ler: signup, riot_connect, report_generated, report_rated, upgrade_clicked, limit_hit
- Kullanıcı privacy ayarından analytics'i kapatabilir
- NEXT_PUBLIC_POSTHOG_KEY env var eklendi
