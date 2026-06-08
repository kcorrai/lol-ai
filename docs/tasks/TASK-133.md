# TASK-133 — Prisma Connection Pool Optimizasyonu

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 66/100

## Objective

Neon serverless + Prisma + Vercel kombinasyonu too many connections hatasına açık. PgBouncer (Neon built-in) veya connection limit konfigürasyonu gerekli.

## Acceptance Criteria

- DATABASE_URL Neon pooler URL ile güncellendi (?pgbouncer=true)
- prisma.ts singleton hot reload'da yeniden yaratılmıyor
- Connection limit aşımı Sentry'de izleniyor
- .env.example güncellendi
