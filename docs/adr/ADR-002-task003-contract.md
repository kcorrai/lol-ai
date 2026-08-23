# ADR-002: TASK-003 Output Contract — Database Schema & Migration Layer

## Status: Accepted

---

## 1. Schema Summary

TASK-003 delivers a fully validated Prisma v5 schema with 16 models, 8 native
PostgreSQL enums, and a working seed file. TypeScript client generated with zero
type errors.

---

## 2. Model Inventory

### Auth Group (NextAuth v4 Prisma Adapter contract)

| Model               | Table                 | PK Type | Notes                                                      |
| ------------------- | --------------------- | ------- | ---------------------------------------------------------- |
| `User`              | `users`               | `uuid`  | Extended with `createdAt`, `updatedAt` vs NextAuth default |
| `Account`           | `accounts`            | `uuid`  | `expires_at Int?` — NextAuth requirement                   |
| `Session`           | `sessions`            | `uuid`  | Standard adapter shape                                     |
| `VerificationToken` | `verification_tokens` | none    | Composite `@@unique([identifier, token])`                  |

### Profile & Billing Group

| Model          | Table           | PK Type |
| -------------- | --------------- | ------- |
| `Profile`      | `profiles`      | `uuid`  |
| `Subscription` | `subscriptions` | `uuid`  |

### Riot Integration Group

| Model              | Table                | PK Type                  |
| ------------------ | -------------------- | ------------------------ |
| `RiotAccount`      | `riot_accounts`      | `uuid`                   |
| `Match`            | `matches`            | `uuid`                   |
| `MatchParticipant` | `match_participants` | `uuid`                   |
| `Champion`         | `champions`          | `Int` (Riot champion ID) |

### Analytics Group

| Model                 | Table                   | PK Type |
| --------------------- | ----------------------- | ------- |
| `ChampionStat`        | `champion_stats`        | `uuid`  |
| `RankedHistory`       | `ranked_history`        | `uuid`  |
| `PerformanceSnapshot` | `performance_snapshots` | `uuid`  |

### AI Coaching Group

| Model            | Table              | PK Type |
| ---------------- | ------------------ | ------- |
| `CoachingReport` | `coaching_reports` | `uuid`  |
| `AiAnalysis`     | `ai_analyses`      | `uuid`  |

### Notifications Group

| Model          | Table           | PK Type |
| -------------- | --------------- | ------- |
| `Notification` | `notifications` | `uuid`  |

---

## 3. Enums

| Enum                 | Values                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| `SubscriptionPlan`   | `free`, `pro`, `elite`                                                      |
| `SubscriptionStatus` | `active`, `canceled`, `past_due`, `trialing`                                |
| `QueueType`          | `RANKED_SOLO_5x5`, `RANKED_FLEX_SR`, `NORMAL_BLIND`, `NORMAL_DRAFT`, `ARAM` |
| `Position`           | `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`                              |
| `RankTier`           | `IRON`…`CHALLENGER` (10 values)                                             |
| `RankDivision`       | `I`, `II`, `III`, `IV`                                                      |
| `ReportType`         | `session_review`, `champion_focus`, `climb_roadmap`                         |
| `ReportStatus`       | `pending`, `processing`, `complete`, `failed`                               |

---

## 4. Entity Relationship Diagram (Text)

```
users
  ├─(1:1)─► profiles
  ├─(1:1)─► subscriptions
  ├─(1:N)─► accounts         [OAuth providers]
  ├─(1:N)─► sessions
  ├─(1:N)─► riot_accounts
  └─(1:N)─► notifications

riot_accounts
  ├─(1:N)─► match_participants
  ├─(1:N)─► champion_stats
  ├─(1:N)─► ranked_history
  ├─(1:N)─► performance_snapshots
  └─(1:N)─► coaching_reports

matches
  └─(1:N)─► match_participants

match_participants
  ├─(N:1)─► matches
  └─(N:0..1)─► riot_accounts    [nullable — non-tracked players]

champion_stats
  ├─(N:1)─► riot_accounts
  └─(N:1)─► champions

coaching_reports
  ├─(N:1)─► riot_accounts
  └─(1:N)─► ai_analyses

verification_tokens              [standalone — no FK]
```

**Cascade rules:**

- `User` delete → cascades to `accounts`, `sessions`, `profile`, `subscription`,
  `riot_accounts`, `notifications`
- `RiotAccount` delete → cascades to `match_participants`, `champion_stats`,
  `ranked_history`, `performance_snapshots`, `coaching_reports`
- `Match` delete → cascades to `match_participants`

---

## 5. TASK-002 Contract — Tables Ready for Auth

These tables and their exact field shapes are required by NextAuth v4
Prisma Adapter. TASK-002 must not modify these definitions.

### `users` table — critical fields for NextAuth

```typescript
// Prisma model fields NextAuth reads/writes
id            String    // UUID
email         String?   // UNIQUE
emailVerified DateTime? // set on email verification
name          String?
image         String?
```

### `accounts` table — critical field names (NextAuth uses these exact names)

```typescript
// These field names are fixed by NextAuth adapter — do not rename
id                String
userId            String   // FK to users.id
type              String   // "oauth" | "email" | "credentials"
provider          String   // "google" | "discord" | ...
providerAccountId String
refresh_token     String?  // snake_case — NextAuth requirement
access_token      String?  // snake_case — NextAuth requirement
expires_at        Int?     // Unix timestamp — NOT BigInt
token_type        String?
scope             String?
id_token          String?
session_state     String?
```

### `sessions` table

```typescript
id           String    // UUID
sessionToken String    // UNIQUE
userId       String    // FK to users.id
expires      DateTime
```

### `verification_tokens` table

```typescript
identifier String
token      String  // UNIQUE
expires    DateTime
// @@unique([identifier, token]) — no id field
```

---

## 6. Migration Strategy

### Development (local Docker)

```bash
# 1. Start services
docker-compose up -d

# 2. Wait for postgres to be healthy
docker-compose ps   # postgres should show "healthy"

# 3. Create .env.local with DATABASE_URL
# DATABASE_URL="postgresql://lolai:lolai_dev_password@localhost:5432/lolai_dev"

# 4. Run first migration
npx prisma migrate dev --name init

# 5. Seed development data
npx prisma db seed

# 6. Verify
npx prisma studio   # opens browser DB explorer at http://localhost:5555
```

### What `prisma migrate dev --name init` produces

```
prisma/
└── migrations/
    └── 20240601000000_init/
        └── migration.sql    ← auto-generated DDL
```

The `migration.sql` creates all tables, enums, indexes, and FK constraints
in the correct dependency order. Never edit this file manually.

### CI / Production

```bash
# CI: validate schema (no DB needed)
DATABASE_URL="postgresql://dummy" npx prisma validate
DATABASE_URL="postgresql://dummy" npx prisma generate

# Production deploy: apply migrations (requires real DB)
npx prisma migrate deploy   # applies all pending migrations, no prompts
```

### Migration rules (from CLAUDE.md)

- Never edit an existing migration file
- Schema changes → new migration (`npx prisma migrate dev --name <description>`)
- Production uses `migrate deploy`, never `migrate dev`
- Rollback: write a new migration that reverts the change

---

## 7. Known Constraints

| Constraint                                     | Detail                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Champion.id` is `Int`, not `UUID`             | Riot assigns integer IDs to champions — intentional design                         |
| `Account.expires_at` is `Int?`                 | NextAuth Prisma Adapter writes Unix timestamp as integer, not DateTime             |
| `Region` is `String`, not Enum                 | Riot regions can change; kept as string for flexibility                            |
| `matchesAnalyzed String[]` in coaching_reports | Prisma doesn't support typed UUID arrays; values are UUID strings in TEXT[] column |
| `BigInt` in `ChampionStat.masteryPoints`       | Requires `Number(bigintValue)` in API responses — serialize explicitly             |
