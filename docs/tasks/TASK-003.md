# TASK-003 — Database Schema Implementation

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 1 day  
**Must complete before:** TASK-002 (Authentication)

---

## Objective

Define the full Prisma schema for all MVP tables and run the initial migration. No feature logic — only schema, relationships, and indexes.

---

## Acceptance Criteria

- [ ] All MVP tables exist in `prisma/schema.prisma`
- [ ] All foreign key relationships are defined
- [ ] All indexes defined as per `DATABASE_SCHEMA.md`
- [ ] `prisma migrate dev` runs without errors
- [ ] `prisma generate` produces correct TypeScript types
- [ ] `prisma/seed.ts` creates: 1 test user, 1 riot account, 5 sample matches

---

## Tables to Implement (MVP Scope)

From `docs/DATABASE_SCHEMA.md`:

- `users`
- `accounts`
- `sessions`
- `profiles`
- `subscriptions`
- `riot_accounts`
- `matches`
- `match_participants`
- `champions`
- `champion_stats`
- `ranked_history`
- `performance_snapshots`
- `coaching_reports`
- `ai_analyses`
- `notifications`

Defer to future tasks: `training_plans`, `training_tasks`

---

## Technical Requirements

- Use `uuid` as default primary key type: `@default(uuid())`
- `createdAt` / `updatedAt` with `@default(now())` and `@updatedAt`
- All `jsonb` columns in PostgreSQL use Prisma `Json` type
- Enum types for: `SubscriptionPlan`, `SubscriptionStatus`, `QueueType`, `Position`, `ReportType`, `ReportStatus`
- Compound unique indexes: `@@unique([provider, providerAccountId])` on accounts
- All `INDEX` annotations using `@@index`

---

## Seed Data Requirements

```
User:
  email: dev@lolai.test
  name: DevPlayer

RiotAccount:
  gameName: DevPlayer
  tagLine: TEST
  region: euw1
  (mock PUUID — not real)

Matches: 5 sample ranked matches with MatchParticipants
Champions: Import champion list from Data Dragon static JSON (or mock 10 champions)
```

---

## Dependencies

- TASK-001 (project bootstrap)

## Blocks

- TASK-002 — auth kodu `users`, `accounts`, `sessions`, `verification_tokens` tablolarını
  ve `prisma migrate dev`'in başarılı olmasını gerektirir. TASK-003 migrate çalıştırılmadan
  NextAuth Prisma Adapter initialize edilemez.

---

## Notes

Do not add any application logic in this task. Schema and seed only. When the schema needs
to change in future tasks, create a new migration rather than editing existing ones.

**Execution order:** TASK-003 must run BEFORE TASK-002. The authentication system's Prisma
Adapter writes directly to the `users`, `accounts`, `sessions`, and `verification_tokens`
tables. These tables must exist (via `prisma migrate dev`) before NextAuth can initialize.
Running TASK-002 without a migrated database will produce runtime errors that cannot be
resolved without TASK-003.
