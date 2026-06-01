# ADR-001: Prisma Version — Use v5 instead of v7

## Status: Accepted

## Context

When setting up the project (TASK-001), `npm install prisma @prisma/client` resolved to version 7.8.0. Prisma 7 introduced a breaking change: the `url = env("DATABASE_URL")` field in `datasource` block of `schema.prisma` is no longer supported. Instead, connection URLs must be configured via `prisma.config.ts` (for migrate) and the `PrismaClient` constructor (for runtime).

This change is undocumented in our `DATABASE_SCHEMA.md` and conflicts with the standard patterns described in the architecture docs.

## Decision

Pin Prisma to version 5 (`prisma@5`, `@prisma/client@5`).

Prisma 5 is the last major version before this breaking change and is a well-supported LTS-compatible release (released Feb 2023, still receiving security patches).

## Consequences

- All schema examples in `DATABASE_SCHEMA.md` work as written (using `url = env("DATABASE_URL")` in datasource block).
- Standard Prisma documentation and tutorials apply without adaptation.
- Upgrade to Prisma 6+ should be a separate, dedicated task when the team is ready to adopt the new config pattern.
- No functional difference for TASK-001 through TASK-015 scope.
