# TASK-003 — Database Schema Implementation

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 1 day

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
- TASK-002 uses this schema for auth tables (coordinate ordering)

---

## Notes

Do not add any application logic in this task. Schema and seed only. When the schema needs to change in future tasks, create a new migration rather than editing existing ones.
