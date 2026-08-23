# ADR-003: Authentication Library — NextAuth v4

## Status: Accepted

## Context

TASK-002 requires authentication with email/password credentials, Google OAuth,
database-persisted sessions, and Prisma Adapter integration.

Candidates evaluated: NextAuth v4, Auth.js (NextAuth v5 beta), BetterAuth.

## Decision

Use **NextAuth v4** (`next-auth@4.24.x`).

Reasons:

- Mature, stable, widely used with Next.js 14 App Router
- Official `@next-auth/prisma-adapter` maps exactly to our TASK-003 schema
  (User, Account, Session, VerificationToken models)
- Auth.js v5 is still in beta and has breaking changes from v4
- BetterAuth has a different schema contract that would conflict with TASK-003

## Password Storage Decision

NextAuth v4 has no native password field on the `User` model. The standard
approach is to add a `password` column to `users`, but this would require a
schema change that contradicts the TASK-003 freeze.

**Solution:** Store bcrypt hashes in `Account.access_token` for credentials
provider accounts (`provider = "credentials"`, `type = "credentials"`).
This is semantically acceptable: the bcrypt hash is the long-lived credential
token for this provider type.

```
accounts row for email/password user:
  type              = "credentials"
  provider          = "credentials"
  providerAccountId = user's email
  access_token      = "$2b$12$..." (bcrypt hash of password)
```

This avoids schema changes and keeps auth tables fully compatible with
the NextAuth Prisma Adapter for OAuth flows.

## Session Strategy

Using `strategy: "database"` (Prisma Adapter creates sessions in the `sessions`
table). Sessions are revocable by deleting the row.

Tradeoff: Every request that checks auth will query the `sessions` table.
This is acceptable for MVP scale. Can switch to JWT + Redis blacklist at
scale if needed.

## Consequences

- NextAuth v5 migration will require updating callbacks and config shape
- Password resets not implemented in TASK-002 (future task)
- Google OAuth requires env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
