# Database Schema — LoL AI Coach

**Version:** 1.0  
**Database:** PostgreSQL  
**ORM:** Prisma

---

## 1. Schema Overview

```
Users ──────────── Subscriptions
  │
  ├── RiotAccounts ──── Matches ──── MatchParticipants ──── Champions
  │         │
  │         └── RankedHistory
  │
  ├── PerformanceSnapshots
  ├── CoachingReports ──── AIAnalyses
  ├── TrainingPlans ──────── TrainingTasks
  └── Notifications
```

---

## 2. Table Definitions

---

### `users`

Core identity table. Managed by NextAuth/BetterAuth.

| Column           | Type           | Constraints                     | Notes                   |
| ---------------- | -------------- | ------------------------------- | ----------------------- |
| `id`             | `uuid`         | PK, default `gen_random_uuid()` |                         |
| `email`          | `varchar(255)` | UNIQUE, NOT NULL                |                         |
| `email_verified` | `timestamptz`  | NULLABLE                        | Set when email verified |
| `name`           | `varchar(100)` | NULLABLE                        | Display name            |
| `image`          | `text`         | NULLABLE                        | Avatar URL              |
| `created_at`     | `timestamptz`  | NOT NULL, default `now()`       |                         |
| `updated_at`     | `timestamptz`  | NOT NULL, default `now()`       | Auto-updated            |

**Indexes:**

- `UNIQUE (email)`

---

### `accounts`

OAuth provider accounts (NextAuth pattern).

| Column                | Type          | Constraints             | Notes                     |
| --------------------- | ------------- | ----------------------- | ------------------------- |
| `id`                  | `uuid`        | PK                      |                           |
| `user_id`             | `uuid`        | FK → users.id, NOT NULL |                           |
| `type`                | `varchar(50)` | NOT NULL                | `oauth`, `email`          |
| `provider`            | `varchar(50)` | NOT NULL                | `google`, `discord`, etc. |
| `provider_account_id` | `text`        | NOT NULL                | External account ID       |
| `refresh_token`       | `text`        | NULLABLE, encrypted     |                           |
| `access_token`        | `text`        | NULLABLE, encrypted     |                           |
| `expires_at`          | `bigint`      | NULLABLE                | Unix timestamp            |
| `token_type`          | `varchar(50)` | NULLABLE                |                           |
| `scope`               | `text`        | NULLABLE                |                           |
| `id_token`            | `text`        | NULLABLE                |                           |

**Indexes:**

- `UNIQUE (provider, provider_account_id)`
- `INDEX (user_id)`

---

### `sessions`

Active user sessions.

| Column          | Type          | Constraints             | Notes |
| --------------- | ------------- | ----------------------- | ----- |
| `id`            | `uuid`        | PK                      |       |
| `session_token` | `text`        | UNIQUE, NOT NULL        |       |
| `user_id`       | `uuid`        | FK → users.id, NOT NULL |       |
| `expires`       | `timestamptz` | NOT NULL                |       |

---

### `profiles`

Extended user preferences and coaching context.

| Column                    | Type          | Constraints                     | Notes                                                                                                    |
| ------------------------- | ------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`                      | `uuid`        | PK                              |                                                                                                          |
| `user_id`                 | `uuid`        | FK → users.id, UNIQUE, NOT NULL | One-to-one                                                                                               |
| `preferred_role`          | `varchar(20)` | NULLABLE                        | `top`, `jungle`, `mid`, `adc`, `support`                                                                 |
| `coaching_style`          | `varchar(20)` | DEFAULT `'balanced'`            | `aggressive`, `balanced`, `passive`                                                                      |
| `rank_goal`               | `varchar(20)` | NULLABLE                        | Target rank string                                                                                       |
| `weekly_play_hours`       | `int`         | NULLABLE                        | Self-reported                                                                                            |
| `timezone`                | `varchar(50)` | DEFAULT `'UTC'`                 |                                                                                                          |
| `language`                | `varchar(10)` | DEFAULT `'en'`                  | AI report language                                                                                       |
| `onboarding_completed_at` | `timestamptz` | NULLABLE                        | Set once the forced first-journey onboarding is finished (TASK-217). NULL = not done; bypass-proof gate. |
| `created_at`              | `timestamptz` | NOT NULL, default `now()`       |                                                                                                          |
| `updated_at`              | `timestamptz` | NOT NULL                        |                                                                                                          |

---

### `subscriptions`

Payment and plan state.

| Column                   | Type          | Constraints                     | Notes                                                   |
| ------------------------ | ------------- | ------------------------------- | ------------------------------------------------------- |
| `id`                     | `uuid`        | PK                              |                                                         |
| `user_id`                | `uuid`        | FK → users.id, UNIQUE, NOT NULL |                                                         |
| `ls_customer_id`         | `text`        | UNIQUE, NULLABLE                | LemonSqueezy customer ID                                |
| `ls_subscription_id`     | `text`        | UNIQUE, NULLABLE                | LemonSqueezy subscription ID                            |
| `stripe_customer_id`     | `text`        | UNIQUE, NULLABLE                | Retained for historical rows only                       |
| `stripe_subscription_id` | `text`        | UNIQUE, NULLABLE                | Retained for historical rows only                       |
| `plan`                   | `varchar(20)` | NOT NULL, DEFAULT `'free'`      | `free`, `pro`, `team`                                   |
| `status`                 | `varchar(20)` | NOT NULL, DEFAULT `'active'`    | `active`, `canceled`, `past_due`, `trialing`, `expired` |
| `current_period_start`   | `timestamptz` | NULLABLE                        |                                                         |
| `current_period_end`     | `timestamptz` | NULLABLE                        |                                                         |
| `cancel_at_period_end`   | `boolean`     | DEFAULT false                   |                                                         |
| `created_at`             | `timestamptz` | NOT NULL                        |                                                         |
| `updated_at`             | `timestamptz` | NOT NULL                        |                                                         |

**Indexes:**

- `INDEX (user_id)`
- `INDEX (ls_customer_id)`

---

### `riot_accounts`

Linked Riot / League of Legends accounts.

| Column            | Type          | Constraints             | Notes                       |
| ----------------- | ------------- | ----------------------- | --------------------------- |
| `id`              | `uuid`        | PK                      |                             |
| `user_id`         | `uuid`        | FK → users.id, NOT NULL |                             |
| `puuid`           | `varchar(78)` | UNIQUE, NOT NULL        | Riot PUUID (permanent ID)   |
| `summoner_id`     | `text`        | NOT NULL                | Summoner ID (region-scoped) |
| `account_id`      | `text`        | NOT NULL                | Account ID                  |
| `game_name`       | `varchar(16)` | NOT NULL                | Riot ID game name           |
| `tag_line`        | `varchar(5)`  | NOT NULL                | Riot ID tagline             |
| `summoner_level`  | `int`         | NOT NULL                |                             |
| `profile_icon_id` | `int`         | NOT NULL                |                             |
| `region`          | `varchar(10)` | NOT NULL                | `na1`, `euw1`, `kr`, etc.   |
| `is_primary`      | `boolean`     | NOT NULL, DEFAULT false |                             |
| `last_synced_at`  | `timestamptz` | NULLABLE                | Last successful sync        |
| `created_at`      | `timestamptz` | NOT NULL                |                             |
| `updated_at`      | `timestamptz` | NOT NULL                |                             |

**Indexes:**

- `UNIQUE (puuid)`
- `INDEX (user_id)`

---

### `matches`

Match metadata. One row per unique match.

| Column          | Type          | Constraints      | Notes                               |
| --------------- | ------------- | ---------------- | ----------------------------------- |
| `id`            | `uuid`        | PK               |                                     |
| `match_id`      | `varchar(20)` | UNIQUE, NOT NULL | Riot match ID (e.g., `NA1_4829...`) |
| `region`        | `varchar(10)` | NOT NULL         |                                     |
| `queue_id`      | `int`         | NOT NULL         | Riot queue type ID                  |
| `queue_type`    | `varchar(30)` | NOT NULL         | `RANKED_SOLO_5x5`, `NORMAL`, etc.   |
| `game_mode`     | `varchar(30)` | NOT NULL         |                                     |
| `game_duration` | `int`         | NOT NULL         | Seconds                             |
| `game_start`    | `timestamptz` | NOT NULL         |                                     |
| `game_end`      | `timestamptz` | NOT NULL         |                                     |
| `game_version`  | `varchar(20)` | NOT NULL         | Patch version                       |
| `winning_team`  | `int`         | NOT NULL         | `100` (blue) or `200` (red)         |
| `raw_data_hash` | `varchar(64)` | NOT NULL         | SHA-256 of raw API response         |
| `created_at`    | `timestamptz` | NOT NULL         |                                     |

**Indexes:**

- `UNIQUE (match_id)`
- `INDEX (game_start)` — for time-range queries
- `INDEX (queue_type, game_start)` — for ranked history queries

---

### `match_participants`

Per-player stats for each match. Links a player (riot_account) to a match.

| Column                  | Type           | Constraints                     | Notes                                          |
| ----------------------- | -------------- | ------------------------------- | ---------------------------------------------- |
| `id`                    | `uuid`         | PK                              |                                                |
| `match_id`              | `uuid`         | FK → matches.id, NOT NULL       |                                                |
| `riot_account_id`       | `uuid`         | FK → riot_accounts.id, NULLABLE | Null for non-tracked players                   |
| `puuid`                 | `varchar(78)`  | NOT NULL                        | For non-tracked players too                    |
| `queue_type`            | `QueueType`    | NOT NULL                        | Copied from the parent match — see ADR-040     |
| `game_start`            | `timestamp(3)` | NOT NULL                        | Copied from the parent match — see ADR-040     |
| `team_id`               | `int`          | NOT NULL                        | 100 or 200                                     |
| `champion_id`           | `int`          | NOT NULL                        | Riot champion ID                               |
| `champion_name`         | `varchar(50)`  | NOT NULL                        |                                                |
| `position`              | `varchar(20)`  | NOT NULL                        | `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY` |
| `kills`                 | `int`          | NOT NULL                        |                                                |
| `deaths`                | `int`          | NOT NULL                        |                                                |
| `assists`               | `int`          | NOT NULL                        |                                                |
| `cs`                    | `int`          | NOT NULL                        | Total minions + monsters                       |
| `cs_per_minute`         | `decimal(5,2)` | NOT NULL                        |                                                |
| `gold_earned`           | `int`          | NOT NULL                        |                                                |
| `gold_per_minute`       | `decimal(7,2)` | NOT NULL                        |                                                |
| `damage_dealt`          | `int`          | NOT NULL                        | Total damage to champions                      |
| `damage_taken`          | `int`          | NOT NULL                        |                                                |
| `damage_healed`         | `int`          | NOT NULL                        |                                                |
| `vision_score`          | `int`          | NOT NULL                        |                                                |
| `wards_placed`          | `int`          | NOT NULL                        |                                                |
| `wards_killed`          | `int`          | NOT NULL                        |                                                |
| `control_wards_bought`  | `int`          | NOT NULL                        |                                                |
| `turrets_destroyed`     | `int`          | NOT NULL                        |                                                |
| `objectives_stolen`     | `int`          | NOT NULL                        |                                                |
| `first_blood`           | `boolean`      | NOT NULL                        |                                                |
| `won`                   | `boolean`      | NOT NULL                        |                                                |
| `time_spent_dead`       | `int`          | NOT NULL                        | Seconds                                        |
| `total_time_cc_dealt`   | `int`          | NOT NULL                        |                                                |
| `item_ids`              | `int[]`        | NOT NULL                        | Array of 6 item IDs                            |
| `rune_primary_path`     | `int`          | NULLABLE                        |                                                |
| `rune_primary_keystone` | `int`          | NULLABLE                        |                                                |
| `rune_secondary_path`   | `int`          | NULLABLE                        |                                                |
| `summoner_spell_1`      | `int`          | NOT NULL                        |                                                |
| `summoner_spell_2`      | `int`          | NOT NULL                        |                                                |

**Indexes:**

- `INDEX (match_id)`
- `INDEX (riot_account_id, match_id)` — user's own games
- `INDEX (riot_account_id, champion_id)` — per-champion history
- `INDEX (puuid)` — opponents and pre-link lookups, where `riot_account_id` is null
- `INDEX (puuid, queue_type, game_start DESC)` — the account-history access path. `queue_type`
  and `game_start` are duplicated from `matches` precisely so this index can exist: the sort key
  used to live on the other table, which meant no index could serve it and Postgres walked
  `matches` backwards discarding nine rows in ten. 532 buffers → 23 on 200k rows. The copy cannot
  drift because a `matches` row is never updated after ingest. See ADR-040.

---

### `champions`

Static champion reference data. Updated per patch.

| Column          | Type           | Constraints           | Notes                      |
| --------------- | -------------- | --------------------- | -------------------------- |
| `id`            | `int`          | PK (Riot champion ID) |                            |
| `key`           | `varchar(30)`  | UNIQUE, NOT NULL      | Internal key, e.g., `Ahri` |
| `name`          | `varchar(50)`  | NOT NULL              | Display name               |
| `title`         | `varchar(100)` | NOT NULL              |                            |
| `roles`         | `text[]`       | NOT NULL              | `Fighter`, `Mage`, etc.    |
| `difficulty`    | `int`          | NOT NULL              | 1–3                        |
| `image_url`     | `text`         | NOT NULL              |                            |
| `patch_version` | `varchar(20)`  | NOT NULL              | Last updated patch         |
| `updated_at`    | `timestamptz`  | NOT NULL              |                            |

---

### `champion_stats`

Aggregated per-champion performance stats for a specific riot_account.

| Column                | Type            | Constraints                     | Notes                       |
| --------------------- | --------------- | ------------------------------- | --------------------------- |
| `id`                  | `uuid`          | PK                              |                             |
| `riot_account_id`     | `uuid`          | FK → riot_accounts.id, NOT NULL |                             |
| `champion_id`         | `int`           | FK → champions.id, NOT NULL     |                             |
| `games_played`        | `int`           | NOT NULL, DEFAULT 0             |                             |
| `wins`                | `int`           | NOT NULL, DEFAULT 0             |                             |
| `losses`              | `int`           | NOT NULL, DEFAULT 0             |                             |
| `avg_kda`             | `decimal(5,2)`  | NOT NULL                        |                             |
| `avg_kills`           | `decimal(4,2)`  | NOT NULL                        |                             |
| `avg_deaths`          | `decimal(4,2)`  | NOT NULL                        |                             |
| `avg_assists`         | `decimal(4,2)`  | NOT NULL                        |                             |
| `avg_cs`              | `decimal(6,2)`  | NOT NULL                        |                             |
| `avg_cs_per_minute`   | `decimal(5,2)`  | NOT NULL                        |                             |
| `avg_vision_score`    | `decimal(5,2)`  | NOT NULL                        |                             |
| `avg_damage_dealt`    | `decimal(10,2)` | NOT NULL                        |                             |
| `avg_gold_per_minute` | `decimal(7,2)`  | NOT NULL                        |                             |
| `mastery_level`       | `int`           | NULLABLE                        | Champion mastery            |
| `mastery_points`      | `bigint`        | NULLABLE                        |                             |
| `queue_type`          | `varchar(30)`   | NOT NULL                        | Stats are per queue type    |
| `computed_at`         | `timestamptz`   | NOT NULL                        | When this was last computed |

**Indexes:**

- `UNIQUE (riot_account_id, champion_id, queue_type)`
- `INDEX (riot_account_id, games_played DESC)` — most played champions

---

### `ranked_history`

Point-in-time ranked snapshots.

| Column            | Type          | Constraints                     | Notes                               |
| ----------------- | ------------- | ------------------------------- | ----------------------------------- |
| `id`              | `uuid`        | PK                              |                                     |
| `riot_account_id` | `uuid`        | FK → riot_accounts.id, NOT NULL |                                     |
| `queue_type`      | `varchar(30)` | NOT NULL                        | `RANKED_SOLO_5x5`, `RANKED_FLEX_SR` |
| `tier`            | `varchar(15)` | NOT NULL                        | `IRON`, `BRONZE`, ... `CHALLENGER`  |
| `rank`            | `varchar(5)`  | NOT NULL                        | `I`, `II`, `III`, `IV`              |
| `lp`              | `int`         | NOT NULL                        | League Points                       |
| `wins`            | `int`         | NOT NULL                        | Season wins                         |
| `losses`          | `int`         | NOT NULL                        |                                     |
| `recorded_at`     | `timestamptz` | NOT NULL                        | When snapshot was taken             |

**Indexes:**

- `INDEX (riot_account_id, queue_type, recorded_at DESC)`

---

### `performance_snapshots`

Periodic performance summaries computed from match data.

| Column                     | Type           | Constraints                     | Notes                         |
| -------------------------- | -------------- | ------------------------------- | ----------------------------- |
| `id`                       | `uuid`         | PK                              |                               |
| `riot_account_id`          | `uuid`         | FK → riot_accounts.id, NOT NULL |                               |
| `period_start`             | `timestamptz`  | NOT NULL                        |                               |
| `period_end`               | `timestamptz`  | NOT NULL                        |                               |
| `games_analyzed`           | `int`          | NOT NULL                        |                               |
| `win_rate`                 | `decimal(5,2)` | NOT NULL                        | Percentage                    |
| `avg_kda`                  | `decimal(5,2)` | NOT NULL                        |                               |
| `avg_cs_per_minute`        | `decimal(5,2)` | NOT NULL                        |                               |
| `avg_vision_score`         | `decimal(5,2)` | NOT NULL                        |                               |
| `tilt_score`               | `decimal(5,2)` | NULLABLE                        | 0–100, higher = more tilted   |
| `most_played_champion_ids` | `int[]`        | NOT NULL                        | Top 3                         |
| `strongest_area`           | `varchar(50)`  | NULLABLE                        | e.g., `"early_game_fighting"` |
| `weakest_area`             | `varchar(50)`  | NULLABLE                        | e.g., `"vision_control"`      |
| `created_at`               | `timestamptz`  | NOT NULL                        |                               |

---

### `coaching_reports`

AI-generated coaching reports.

| Column                     | Type          | Constraints                     | Notes                                               |
| -------------------------- | ------------- | ------------------------------- | --------------------------------------------------- |
| `id`                       | `uuid`        | PK                              |                                                     |
| `riot_account_id`          | `uuid`        | FK → riot_accounts.id, NOT NULL |                                                     |
| `report_type`              | `varchar(30)` | NOT NULL                        | `session_review`, `champion_focus`, `climb_roadmap` |
| `status`                   | `varchar(20)` | NOT NULL, DEFAULT `'pending'`   | `pending`, `processing`, `complete`, `failed`       |
| `matches_analyzed`         | `uuid[]`      | NOT NULL                        | Array of match IDs                                  |
| `summary`                  | `text`        | NULLABLE                        | High-level summary                                  |
| `strengths`                | `jsonb`       | NULLABLE                        | Array of strength objects                           |
| `weaknesses`               | `jsonb`       | NULLABLE                        | Array of weakness objects                           |
| `action_items`             | `jsonb`       | NULLABLE                        | Prioritized improvement list                        |
| `champion_recommendations` | `jsonb`       | NULLABLE                        |                                                     |
| `estimated_rank_potential` | `varchar(20)` | NULLABLE                        |                                                     |
| `coach_persona_response`   | `text`        | NULLABLE                        | Full narrative coaching text                        |
| `user_rating`              | `int`         | NULLABLE                        | 1–5, user-submitted                                 |
| `user_feedback`            | `text`        | NULLABLE                        |                                                     |
| `ai_model_used`            | `varchar(50)` | NULLABLE                        | For audit                                           |
| `processing_time_ms`       | `int`         | NULLABLE                        |                                                     |
| `created_at`               | `timestamptz` | NOT NULL                        |                                                     |
| `completed_at`             | `timestamptz` | NULLABLE                        |                                                     |

**Indexes:**

- `INDEX (riot_account_id, created_at DESC)`
- `INDEX (status)` — for queue processing

---

### `ai_analyses`

Low-level AI API call records. Used for caching, auditing, and cost tracking.

| Column               | Type            | Constraints                        | Notes                    |
| -------------------- | --------------- | ---------------------------------- | ------------------------ |
| `id`                 | `uuid`          | PK                                 |                          |
| `coaching_report_id` | `uuid`          | FK → coaching_reports.id, NULLABLE |                          |
| `analysis_type`      | `varchar(50)`   | NOT NULL                           |                          |
| `input_hash`         | `varchar(64)`   | NOT NULL                           | SHA-256 of input payload |
| `provider`           | `varchar(20)`   | NOT NULL                           | `openai`, `anthropic`    |
| `model`              | `varchar(50)`   | NOT NULL                           |                          |
| `prompt_tokens`      | `int`           | NOT NULL                           |                          |
| `completion_tokens`  | `int`           | NOT NULL                           |                          |
| `total_tokens`       | `int`           | NOT NULL                           |                          |
| `cost_usd`           | `decimal(10,6)` | NULLABLE                           | Estimated cost           |
| `response_raw`       | `text`          | NOT NULL                           | Full model response      |
| `cache_hit`          | `boolean`       | NOT NULL, DEFAULT false            |                          |
| `latency_ms`         | `int`           | NOT NULL                           |                          |
| `created_at`         | `timestamptz`   | NOT NULL                           |                          |

**Indexes:**

- `UNIQUE (input_hash)` — for cache lookup
- `INDEX (coaching_report_id)`
- `INDEX (created_at DESC)` — cost analytics

---

### `training_plans`

Personalized training plans generated by AI.

| Column            | Type           | Constraints                     | Notes                                    |
| ----------------- | -------------- | ------------------------------- | ---------------------------------------- |
| `id`              | `uuid`         | PK                              |                                          |
| `riot_account_id` | `uuid`         | FK → riot_accounts.id, NOT NULL |                                          |
| `title`           | `varchar(100)` | NOT NULL                        |                                          |
| `focus_area`      | `varchar(50)`  | NOT NULL                        | `laning`, `teamfighting`, `vision`, etc. |
| `target_rank`     | `varchar(20)`  | NULLABLE                        |                                          |
| `duration_weeks`  | `int`          | NOT NULL                        |                                          |
| `status`          | `varchar(20)`  | NOT NULL, DEFAULT `'active'`    | `active`, `completed`, `abandoned`       |
| `created_at`      | `timestamptz`  | NOT NULL                        |                                          |
| `completed_at`    | `timestamptz`  | NULLABLE                        |                                          |

---

### `training_tasks`

Individual tasks within a training plan.

| Column             | Type            | Constraints                      | Notes                                     |
| ------------------ | --------------- | -------------------------------- | ----------------------------------------- |
| `id`               | `uuid`          | PK                               |                                           |
| `training_plan_id` | `uuid`          | FK → training_plans.id, NOT NULL |                                           |
| `title`            | `varchar(200)`  | NOT NULL                         |                                           |
| `description`      | `text`          | NOT NULL                         |                                           |
| `type`             | `varchar(30)`   | NOT NULL                         | `game_goal`, `review_task`, `theory_task` |
| `target_metric`    | `varchar(50)`   | NULLABLE                         | e.g., `cs_per_minute`                     |
| `target_value`     | `decimal(10,2)` | NULLABLE                         |                                           |
| `is_completed`     | `boolean`       | NOT NULL, DEFAULT false          |                                           |
| `completed_at`     | `timestamptz`   | NULLABLE                         |                                           |
| `order`            | `int`           | NOT NULL                         | Display order                             |

---

### `notifications`

In-app notifications.

| Column       | Type           | Constraints             | Notes                                             |
| ------------ | -------------- | ----------------------- | ------------------------------------------------- |
| `id`         | `uuid`         | PK                      |                                                   |
| `user_id`    | `uuid`         | FK → users.id, NOT NULL |                                                   |
| `type`       | `varchar(50)`  | NOT NULL                | `report_ready`, `rank_change`, `tilt_alert`, etc. |
| `title`      | `varchar(100)` | NOT NULL                |                                                   |
| `body`       | `text`         | NOT NULL                |                                                   |
| `action_url` | `text`         | NULLABLE                |                                                   |
| `is_read`    | `boolean`      | NOT NULL, DEFAULT false |                                                   |
| `created_at` | `timestamptz`  | NOT NULL                |                                                   |

**Indexes:**

- `INDEX (user_id, is_read, created_at DESC)`

---

## 3. Index Strategy Summary

### High-traffic query patterns and their indexes:

| Query Pattern                       | Index                                                            |
| ----------------------------------- | ---------------------------------------------------------------- |
| User's match history (recent first) | `(riot_account_id, game_start DESC)` on matches via participants |
| User's champion stats (most played) | `(riot_account_id, games_played DESC)` on champion_stats         |
| Ranked history timeline             | `(riot_account_id, queue_type, recorded_at DESC)`                |
| Coaching reports for user           | `(riot_account_id, created_at DESC)`                             |
| Pending AI jobs                     | `(status)` on coaching_reports                                   |
| AI cache lookup                     | `UNIQUE (input_hash)` on ai_analyses                             |
| Unread notifications                | `(user_id, is_read, created_at DESC)`                            |

---

## 4. Scalability Notes

- **Matches table** will grow very large. Partition by `game_start` year/quarter when row count exceeds 50M.
- **match_participants** is the most queried table. Ensure composite indexes are tight.
- **ai_analyses** stores full raw responses. Archive rows older than 90 days to cold storage to keep table small.
- **ranked_history** is append-only. Never update, only insert. Ideal for time-series partitioning.
- Consider **read replicas** for analytics queries on champion_stats and performance_snapshots.

---

## 5. Teams Tables (B2B Pilot — TASK-106)

### `teams`

| Column       | Type          | Constraints                   |
| ------------ | ------------- | ----------------------------- |
| `id`         | `uuid`        | PK, DEFAULT gen_random_uuid() |
| `name`       | `text`        | NOT NULL                      |
| `logo_url`   | `text`        |                               |
| `owner_id`   | `uuid`        | FK → users.id                 |
| `created_at` | `timestamptz` | NOT NULL                      |
| `updated_at` | `timestamptz` | NOT NULL                      |

### `team_members`

| Column      | Type          | Constraints               |
| ----------- | ------------- | ------------------------- |
| `id`        | `uuid`        | PK                        |
| `team_id`   | `uuid`        | FK → teams.id CASCADE     |
| `user_id`   | `uuid`        | FK → users.id CASCADE     |
| `role`      | `TeamRole`    | NOT NULL DEFAULT 'PLAYER' |
| `joined_at` | `timestamptz` | NOT NULL                  |

UNIQUE(team_id, user_id)

### `team_invites`

| Column       | Type          | Constraints               |
| ------------ | ------------- | ------------------------- |
| `id`         | `uuid`        | PK                        |
| `team_id`    | `uuid`        | FK → teams.id CASCADE     |
| `email`      | `text`        | NOT NULL                  |
| `token`      | `text`        | UNIQUE                    |
| `role`       | `TeamRole`    | NOT NULL DEFAULT 'PLAYER' |
| `expires_at` | `timestamptz` | NOT NULL                  |
| `used_at`    | `timestamptz` |                           |
| `created_at` | `timestamptz` | NOT NULL                  |

**TeamRole enum:** `OWNER`, `COACH`, `PLAYER`

**SubscriptionPlan enum:** added `team` value (same limits as `elite` + team features)

---

## 6. Audit Logs (SOC2 Prep — TASK-107)

### `audit_logs`

Append-only immutable event log. See ADR-004.

| Column        | Type          | Constraints                              |
| ------------- | ------------- | ---------------------------------------- |
| `id`          | `uuid`        | PK                                       |
| `user_id`     | `uuid`        | FK → users.id SET NULL                   |
| `actor_id`    | `uuid`        | nullable, FK not enforced                |
| `action`      | `text`        | NOT NULL (e.g. "riot.account.connected") |
| `resource`    | `text`        | NOT NULL (derived from action prefix)    |
| `resource_id` | `text`        |                                          |
| `metadata`    | `jsonb`       |                                          |
| `ip_address`  | `text`        |                                          |
| `user_agent`  | `text`        |                                          |
| `created_at`  | `timestamptz` | NOT NULL                                 |

**Indexes:**

- `INDEX (user_id, created_at DESC)`
- `INDEX (action, created_at DESC)`

**Retention:** 2 years minimum. Archive to cold storage after 2 years.

---

## 7. Duo Partners (TASK-244)

### `duo_partners`

The teammate a player has marked as their duo. Detection itself needs no table — it is derived
from `match_participants` (same match, same `team_id`) — so this stores only the explicit choice.

| Column          | Type          | Constraints                             |
| --------------- | ------------- | --------------------------------------- |
| `id`            | `uuid`        | PK                                      |
| `riotAccountId` | `uuid`        | NOT NULL, FK → riot_accounts.id CASCADE |
| `puuid`         | `text`        | NOT NULL                                |
| `gameName`      | `text`        | NOT NULL                                |
| `tagLine`       | `text`        | NOT NULL                                |
| `isActive`      | `boolean`     | NOT NULL, default `true`                |
| `createdAt`     | `timestamptz` | NOT NULL                                |
| `updatedAt`     | `timestamptz` | NOT NULL                                |

**Indexes:**

- `UNIQUE (riotAccountId, puuid)`
- `INDEX (riotAccountId, isActive)`

**Notes:**

- `gameName`/`tagLine` are denormalised on purpose: a partner must still render after a Riot ID
  change, or once they fall outside the 200-match scan window.
- Only one row per account is `isActive`. Deselecting sets `isActive=false` instead of deleting,
  so switching back to a previous duo keeps its history.

---

## 8. Live Draft Room (TASK-298)

Three tables behind the public pick/ban room. See `docs/DRAFT_ROOM.md` for the
feature and ADR-016 for why reads are served from Redis rather than from here.

**Enums:**

- `DraftSeriesMode` — `NORMAL`, `FEARLESS`, `TEAM_FEARLESS`
- `DraftSideEnum` — `BLUE`, `RED`
- `DraftGamePhase` — `LOBBY`, `IN_PROGRESS`, `COMPLETE`
- `DraftActionKind` — `BAN`, `PICK`

### `draft_series`

One best-of-N. The link people share is built from `code`.

| Column              | Type              | Constraints                                   |
| ------------------- | ----------------- | --------------------------------------------- |
| `id`                | `uuid`            | PK                                            |
| `code`              | `text`            | NOT NULL, UNIQUE — 8 URL-safe chars, public   |
| `blueToken`         | `text`            | NOT NULL, UNIQUE — capability token, 32 chars |
| `redToken`          | `text`            | NOT NULL, UNIQUE — capability token, 32 chars |
| `team1Name`         | `text`            | NOT NULL                                      |
| `team2Name`         | `text`            | NOT NULL                                      |
| `mode`              | `DraftSeriesMode` | NOT NULL, default `NORMAL`                    |
| `gameCount`         | `integer`         | NOT NULL, default `1` (1–5)                   |
| `timerSeconds`      | `integer`         | NOT NULL, default `30`; `0` = untimed         |
| `disabledChampions` | `text[]`          | default `{}`                                  |
| `createdById`       | `uuid`            | nullable, FK → users.id SET NULL              |
| `createdAt`         | `timestamptz`     | NOT NULL                                      |
| `expiresAt`         | `timestamptz`     | NOT NULL                                      |

**Indexes:** `UNIQUE (code)`, `UNIQUE (blueToken)`, `UNIQUE (redToken)`,
`INDEX (expiresAt)`, `INDEX (createdById)`

**Notes:**

- All three secrets come from `crypto.randomBytes`, never `Math.random`.
- `createdById` is nullable because the room is login-free by design; an
  anonymous series is the primary path, not a degraded one.
- `expiresAt` is creation + 7 days and drives the cleanup sweep.

### `draft_games`

One game of the series. Sides swap down the series, so `blueTeam` — not the row
order — says who is on blue.

| Column          | Type             | Constraints                                   |
| --------------- | ---------------- | --------------------------------------------- |
| `id`            | `uuid`           | PK                                            |
| `seriesId`      | `uuid`           | NOT NULL, FK → draft_series.id CASCADE        |
| `gameNumber`    | `integer`        | NOT NULL                                      |
| `blueTeam`      | `integer`        | NOT NULL, default `1` — `1` or `2`            |
| `phase`         | `DraftGamePhase` | NOT NULL, default `LOBBY`                     |
| `step`          | `integer`        | NOT NULL, default `0` — next step index, 0–20 |
| `blueReady`     | `boolean`        | NOT NULL, default `false`                     |
| `redReady`      | `boolean`        | NOT NULL, default `false`                     |
| `turnStartedAt` | `timestamptz`    | nullable                                      |
| `winnerSide`    | `DraftSideEnum`  | nullable                                      |
| `version`       | `integer`        | NOT NULL, default `0`                         |

**Indexes:** `UNIQUE (seriesId, gameNumber)`, `INDEX (seriesId)`

**Notes:**

- `version` is both the optimistic-concurrency guard and the polling change
  detector. It is bumped inside the same transaction as the write it describes,
  so two simultaneous locks cannot both win.
- `turnStartedAt` is the only clock the server publishes; every countdown is
  derived from it client-side (ADR-016).

### `draft_actions`

One ban or pick. The action list is the single source of truth for what is
available — there is no second "used champions" column to fall out of sync, which
is what makes undo a one-row delete.

| Column        | Type              | Constraints                                          |
| ------------- | ----------------- | ---------------------------------------------------- |
| `id`          | `uuid`            | PK                                                   |
| `gameId`      | `uuid`            | NOT NULL, FK → draft_games.id CASCADE                |
| `step`        | `integer`         | NOT NULL — 0–19, position in the sequence            |
| `side`        | `DraftSideEnum`   | NOT NULL                                             |
| `kind`        | `DraftActionKind` | NOT NULL                                             |
| `championKey` | `text`            | nullable — null = passed ban, or an expired ban turn |
| `timedOut`    | `boolean`         | NOT NULL, default `false`                            |
| `createdAt`   | `timestamptz`     | NOT NULL                                             |

**Indexes:** `UNIQUE (gameId, step)`, `INDEX (gameId)`

**Notes:**

- `UNIQUE (gameId, step)` is the last line of defence against a double-submit
  landing two champions on one turn.
- `championKey` stores the Data Dragon id (`"Ahri"`, `"MonkeyKing"`). Comparison
  is case-insensitive throughout, via `normaliseKey` in the draft engine.

---

## 9. Player Search Index (TASK-308)

### `player_index`

Every Riot ID we have ever seen, so search can autocomplete by prefix. Riot exposes no
name-search endpoint, so this table is the only thing that makes a suggestion list possible —
see [ADR-017](./adr/ADR-017-player-search-index.md). Rows are written by match sync (all ten
participants of every match) and by account connection; nothing else populates it.

| Column          | Type          | Constraints                                  |
| --------------- | ------------- | -------------------------------------------- |
| `puuid`         | `text`        | PK                                           |
| `gameName`      | `text`        | NOT NULL                                     |
| `tagLine`       | `text`        | NOT NULL                                     |
| `region`        | `text`        | NOT NULL — platform id, e.g. `euw1`          |
| `searchKey`     | `text`        | NOT NULL — lowercased `gameName`             |
| `profileIconId` | `integer`     | nullable — only connected accounts carry one |
| `summonerLevel` | `integer`     | nullable — as above                          |
| `seenCount`     | `integer`     | NOT NULL, default `0`                        |
| `lastSeenAt`    | `timestamptz` | NOT NULL, default `now()`                    |
| `updatedAt`     | `timestamptz` | NOT NULL                                     |

**Indexes:**

- `INDEX (searchKey text_pattern_ops)`
- `INDEX (region, searchKey text_pattern_ops)`

**Notes:**

- `text_pattern_ops` is not decoration. Under the default collation a btree index cannot serve
  `LIKE 'fak%'`, and `ILIKE` can never use one — so the lowercased column plus this operator
  class is what keeps autocomplete off a sequential scan.
- `seenCount` counts **appearances**, not sync runs: a player in thirty of your matches is
  incremented by thirty. It is the autocomplete ordering signal.
- `gameName`/`tagLine` go stale when a player renames. Sync rewrites the row the next time it
  sees them, so the index self-heals for active players.
- Nothing prunes this table. If that ever changes, evict on `lastSeenAt`, never on `seenCount`.

---

## 10. Duo Quests (TASK-313)

### `duo_quests`

One pair's progress against one weekly goal. **Which** quests run in a week is not stored — it is
a pure function of the week number (`duoQuestCatalog.questsForWeek`), so this table holds only
progress and whether the XP has been paid.

| Column                    | Type          | Constraints                                    |
| ------------------------- | ------------- | ---------------------------------------------- |
| `id`                      | `uuid`        | PK                                             |
| `riotAccountId`           | `uuid`        | NOT NULL, FK → riot_accounts.id CASCADE        |
| `partnerPuuid`            | `text`        | NOT NULL                                       |
| `key`                     | `text`        | NOT NULL — catalogue key, e.g. `wins_together` |
| `target`                  | `integer`     | NOT NULL                                       |
| `progress`                | `integer`     | NOT NULL, default `0`                          |
| `completed`               | `boolean`     | NOT NULL, default `false`                      |
| `completedAt`             | `timestamptz` | nullable                                       |
| `xpReward`                | `integer`     | NOT NULL                                       |
| `periodStart`             | `timestamptz` | NOT NULL — Monday 00:00 UTC                    |
| `periodEnd`               | `timestamptz` | NOT NULL                                       |
| `createdAt` / `updatedAt` | `timestamptz` | NOT NULL                                       |

**Indexes:**

- `UNIQUE (riotAccountId, partnerPuuid, key, periodStart)`
- `INDEX (riotAccountId, periodStart)`

**Notes:**

- The unique index is load-bearing, not defensive. Quests are generated on read, so it is what
  stops a second page load creating a duplicate row or paying the XP twice.
- `progress` is the value in the quest's own unit (games, wins, kills), capped at `target` — not a
  0–1 fraction. The panel renders "3 / 5", which a fraction would have to be multiplied back out
  to produce.
- `target` and `xpReward` are denormalised copies of the catalogue entry, so a past week's row
  still reads correctly after the catalogue changes.
- `partnerPuuid` is part of the key: switching duo mid-week starts a fresh set rather than
  inheriting the previous partner's progress.

---

## 11. Followed Esports Teams (TASK-313)

### `followed_teams`

The one table the esports section owns. Everything else there is a cache over a
feed we do not control (ADR-016), and stays that way — what is stored here is a
reader's choice, not the feed's data.

| Column      | Type           | Constraints                                   |
| ----------- | -------------- | --------------------------------------------- |
| `id`        | `uuid`         | PK                                            |
| `userId`    | `uuid`         | NOT NULL — FK → `users(id)` ON DELETE CASCADE |
| `teamId`    | `text`         | NOT NULL — the feed's own team id             |
| `teamName`  | `text`         | NOT NULL — copy, see below                    |
| `teamSlug`  | `text`         | NOT NULL — copy, see below                    |
| `createdAt` | `timestamp(3)` | NOT NULL, default `now()`                     |

**Indexes:**

- `UNIQUE (userId, teamId)`
- `INDEX (userId, createdAt DESC)`

**Notes:**

- **The follow hangs on `teamId`, never the slug.** Team slugs are not unique —
  53 are reused across teams, 17 with more than one active entry — and
  resolution has to rank candidates. Display names also change between splits.
  The feed's id is the only stable handle.
- **`teamName` and `teamSlug` are deliberate copies.** They let a follow list
  render without reading the feed, and let a follow survive its team dropping
  out of it: only 440 of 1175 active teams carry both a league and a roster, and
  that set moves. The cost is that a renamed team shows its old name until the
  reader re-follows, which is the better of the two failures.
- **The follow limit (20) is not in the schema.** It is a product decision that
  moves, and a constraint on a row count needs a trigger. `followService` counts.
- Nothing prunes this table; a deleted user takes their follows with them.

---

## 12. Coach Marketplace (LA-19 — see `docs/MARKETPLACE_PLAN.md`)

Human coaches, sold by the session. Fifteen tables, all added by
`20260817184434_add_coach_marketplace`.

Deliberately separate from `coaching_reports` and `ai_analyses`, which are the
AI pipeline: no table in this section references one, and no code path in
`src/domains/marketplace/` calls an AI provider. The product on sale here is a
person.

**There is no `role` column on `users`, and there is not going to be one.**
Being a coach _is_ having an approved `coach_profiles` row. That keeps the
NextAuth adapter contract (ADR-003) untouched, and lets one account be a student
and a coach at once — which is the normal case, because coaches queue too. See
ADR-019.

### New enums

| Enum                  | Values                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CoachStatus`         | `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`                                                                                             |
| `SessionKind`         | `VOD_REVIEW`, `LIVE_SESSION`, `LIVE_SPECTATE`                                                                                                       |
| `BookingStatus`       | `PENDING_COACH`, `CONFIRMED`, `DECLINED`, `EXPIRED`, `CANCELLED_BY_STUDENT`, `CANCELLED_BY_COACH`, `DELIVERED`, `COMPLETED`, `DISPUTED`, `REFUNDED` |
| `PaymentStatus`       | `REQUIRES_PAYMENT`, `HELD`, `RELEASED`, `REFUNDED`, `FAILED`                                                                                        |
| `PayoutAccountStatus` | `NONE`, `PENDING`, `VERIFIED`, `RESTRICTED`                                                                                                         |
| `DisputeStatus`       | `OPEN`, `RESOLVED_REFUND`, `RESOLVED_RELEASE`, `REJECTED`                                                                                           |
| `RankProofMethod`     | `SELF_REPORTED`, `PLATFORM_CHECKED`, `RIOT_VERIFIED`                                                                                                |
| `ReviewAuthorRole`    | `STUDENT`, `COACH`                                                                                                                                  |
| `AnnotationCategory`  | `LANING`, `MACRO`, `MICRO`, `VISION`, `DRAFT`, `POSITIONING`, `MENTAL`                                                                              |

### Tables

| Table                           | Holds                                                    | Key constraints                                                                                                                                   |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coach_profiles`                | one per coach, 1:1 with `users`                          | `UNIQUE userId`, `UNIQUE slug`, `INDEX (status, ratingWilson DESC)`, `INDEX (status, acceptingStudents)`                                          |
| `coach_rank_proofs`             | what we can say about a coach's rank, and how we know    | `UNIQUE (coachProfileId, queueType)`, `INDEX (staleAt)`                                                                                           |
| `coach_listings`                | one thing a coach sells                                  | `INDEX (coachProfileId, isActive, sortOrder)`                                                                                                     |
| `coach_availability`            | recurring weekly windows, wall-clock in the coach's zone | `INDEX (coachProfileId, isActive)`                                                                                                                |
| `coach_availability_exceptions` | one date that does not follow the weekly rule            | `UNIQUE (coachProfileId, date)`                                                                                                                   |
| `bookings`                      | the transaction                                          | `INDEX (coachProfileId, status, startTime)`, `INDEX (studentId, createdAt DESC)`, `INDEX (status, respondByAt)`, `INDEX (status, autoCompleteAt)` |
| `booking_events`                | append-only status transitions                           | `INDEX (bookingId, createdAt)`                                                                                                                    |
| `vod_reviews`                   | the async deliverable                                    | `UNIQUE bookingId`                                                                                                                                |
| `vod_annotations`               | timestamped notes on one                                 | `INDEX (vodReviewId, timestampSeconds)`                                                                                                           |
| `session_reviews`               | two-sided, blind until both are in                       | `UNIQUE (bookingId, authorRole)`, `INDEX (coachProfileId, revealedAt DESC)`                                                                       |
| `conversations`                 | one thread per coach/student pair                        | `UNIQUE (coachProfileId, studentId)`, `INDEX (studentId, lastMessageAt DESC)`                                                                     |
| `messages`                      | already-redacted message bodies                          | `INDEX (conversationId, createdAt)`                                                                                                               |
| `booking_payments`              | provider-neutral money ledger                            | `UNIQUE bookingId`, `UNIQUE providerPaymentId`, `INDEX (status)`                                                                                  |
| `coach_payout_accounts`         | where a coach's money would go                           | `UNIQUE coachProfileId`                                                                                                                           |
| `booking_disputes`              | a challenge and its resolution                           | `UNIQUE bookingId`, `INDEX (status, createdAt)`                                                                                                   |

### Notes

- **`bookings` snapshots its own economics.** `priceCents`, `commissionBps`,
  `platformFeeCents`, `coachEarningsCents` and `cancellationHours` are copied in
  at creation and never joined for. A coach raising their rate, or a change to
  the platform's cut, must not retroactively rewrite what a settled booking was
  worth. Both timezones are captured for the same reason: so a coach moving
  country does not change what a past booking said.
- **`booking_events` is the table this section is built around.** The most
  common complaint about every competitor is a session paid for and never
  delivered, followed by a refusal nobody can reconstruct — which is what having
  no record of the transitions costs. `bookings.status` is where a booking is;
  `booking_events` is how it got there, with the actor (null for a scheduled
  sweep) and a reason. The allowed transitions live in
  `src/domains/marketplace/transitions.ts` as a table, not as scattered `if`s.
- **`coach_availability` stores wall-clock time, not instants.** `startTime` and
  `endTime` are `time` (no zone); the zone is `coach_profiles.timezone`, an IANA
  name, and the offset is resolved **per calendar day** at read time. Baking a
  weekly rule down to one fixed UTC offset is exactly what breaks on the day the
  clocks move. `bookings.startTime`/`endTime` are the opposite — a booking is a
  single event with no recurrence, so it is stored as a resolved UTC instant.
  See ADR-022.
- **`days` is an `int[]`, not a row per weekday.** "Mon, Wed, Fri 18:00–21:00"
  is one row. Same shape Cal.com settled on, and it avoids an RRULE parser for a
  pattern that never needs one.
- **`booking_payments` is a ledger, not a mirror of a provider's object.** No
  money moves today: the only driver is `manual`, which advances these states
  and settles nothing. The provider columns already hold what a Stripe
  destination charge needs — `providerPaymentId` ↔ `PaymentIntent.id`,
  `platformFeeCents` ↔ `application_fee_amount`, `providerTransferId` ↔
  `Transfer.id` — so adding Stripe is a driver, not a migration. See ADR-020.
- **`coach_profiles` carries two rating aggregates and they disagree on
  purpose.** `ratingBayes` is what a profile displays — a mean pulled toward the
  platform average until the sample is real. `ratingWilson` is what search
  orders by, so a 5.0 from two people does not outrank a 4.8 from ninety. Below
  three revealed reviews a coach shows a "New" badge and no number at all.
- **`session_reviews` can only exist for a booking that completed**, and neither
  side's row is visible until both exist or the 14-day window closes —
  `revealedAt` is set on both at the same moment. `coachReply` carries no rating
  and never moves an aggregate.
- **`coach_rank_proofs.method` is the honesty column.** `PLATFORM_CHECKED` means
  we read the rank from Riot for a linked account and dated it; it does **not**
  mean the account was proven to belong to that person. That is
  `RIOT_VERIFIED`, which needs an RSO invitation we do not have. See ADR-023.
- **Nothing here cascades from a Riot account.** `coach_rank_proofs.riotAccountId`
  and `bookings.riotAccountId` are both `ON DELETE SET NULL`: unlinking a Riot
  account must not delete a coach's profile or a settled booking.

## Daily quiz

- **The puzzles are not stored.** `dailySeed.ts` derives each day's answer from
  the UTC date, so an anonymous visitor gets the same puzzle with no row at all
  and there is no nightly job that can leave a day blank. These two tables hold
  only what has to outlive a browser.
- **`quiz_attempts.puzzleDate` is the day the puzzle belongs to, not the moment
  it was played.** A game started at 23:59 and finished at 00:01 stays on the day
  it started. `@@unique([userId, puzzleDate, mode])` is what stops a mode paying
  out twice.
- **`quiz_streaks` is deliberately forgiving, and the columns are the reason.**
  Solving any one mode keeps the streak — `lastPlayedDate` records the day, not
  which modes — and `freezesLeft`/`freezeWeekKey` forgive one missed day per ISO
  week. LoLdle requires all five of its modes and the resulting all-or-nothing
  loss is the single most complained-about thing about it.
- **`quiz_attempts.guesses` keeps the whole guess list** so a returning player
  sees their own board again rather than an empty one.
- **`quiz_attempts.guesses` is also the leaderboard's source of truth.**
  `guessCount` is derived from that list server-side as each guess is judged; no
  client-supplied total is accepted anywhere, because the board ranks on fewest
  guesses and a reported count is a ranking anyone could top.

---

## Academy (LA-21)

Three tables, all keyed on `users.id` and all cascading from it.

| Table                 | Holds                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------- |
| `academy_progress`    | One row per player per lesson: status, attempts, best score, timestamps               |
| `academy_enrollments` | One row per player per track: when they started it and what placement said            |
| `academy_assignments` | Proof of Practice — the lesson's field assignment pinned to the player's own baseline |

Notes on the shape:

- **No lesson table.** The curriculum is TypeScript in `src/domains/academy/content`, so it
  is typechecked and unit-tested rather than seeded. See ADR-025.
- **`lessonId` is the string `track/slug` and deliberately not a foreign key.** A renamed
  slug should surface as one missing lesson in `curriculum.ts`, not as a constraint
  violation on every write. Slugs are only unique inside a track, which is why the stored
  id carries the track.
- **`academy_assignments.baseline` is stored, not recomputed.** The target is a _movement_
  from where the player was when they finished the lesson — recomputing the baseline later
  would move the goalposts every time they played a game.
- **`AcademyLessonStatus.mastered` cannot be set by the drill endpoint.** Drills prove you read
  the lesson; mastery is proved by matches, and the only writer is `checkAssignments`, run from
  the post-sync `academy/check-assignments` job.
- **`academy_assignments.position` is the role the baseline was measured in**, and the only role
  the verdict counts. CS per minute is not comparable across a support game and a mid game;
  a role-blind baseline sets a target no support can reach and every mid clears by accident. It
  is stored rather than re-derived because a player's main role can shift between the lesson and
  the verdict. Nullable: rows written before the fix are judged role-blind.
- **`academy_progress.decayCheckedAt` is when the nightly job last re-measured a mastery**
  (ADR-027). Null means never, and the 21-day window then counts from `masteredAt`. Without the
  column the job re-judges every mastered lesson every night. It is stamped only when a verdict
  was actually reached: a player with too few games in that role since the last check is left
  alone, so the row stays due and is retried rather than sleeping another three weeks.
- **`academy_progress.xpAwarded` is the running total of XP a lesson has paid out**, not a flag.
  Every grant is the difference between it and what the reached status is worth (40 completed,
  160 mastered), so completing twice pays once and re-earning a decayed mastery pays nothing —
  XP is never clawed back, so it must not be re-earnable either.
- **`review` is written by the decay job and by nothing else.** A `mastered` lesson whose metric
  has gone back below the same stored target drops to `review`; recovery is the ordinary path —
  redo the lesson, which opens a fresh assignment, which can restore `mastered`.

---

## Streamer Kit (LA-25 — see [ADR-026](./adr/ADR-026-streamer-kit.md))

One table, `creator_profiles`, one row per user.

| Column                                        | Holds                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `userId`                                      | Unique — the kit is per account, not per Riot account. Cascades from `users` |
| `riotAccountId`                               | Which account the overlays read. Nullable, `ON DELETE SET NULL`              |
| `overlayKey`                                  | Unique capability key, 22 base64url characters                               |
| `enabled`                                     | Whether the key resolves at all                                              |
| `displayName`, `streamSafe`                   | What a viewer is allowed to see of who this is                               |
| `delaySeconds`                                | The broadcast delay every widget computes against                            |
| `theme`, `accentColor`                        | Per-creator look, applied as an inline custom property                       |
| `sessionStartedAt`                            | Start of the current session. Null means "since local midnight"              |
| `goalTier`, `goalDivision`                    | What the climb bar counts toward. Both null means no goal                    |
| `twitchHandle`, `kickHandle`, `youtubeHandle` | Cosmetic in v1 — nothing is verified                                         |

Notes on the shape:

- **`overlayKey` is the only credential the consumers can present.** An OBS
  Browser Source and a Nightbot command cannot carry a session, so the key in the
  URL is the whole authentication — the same trade `draft_series.blueToken`
  makes. It is unique and indexed because every overlay poll is a lookup on it,
  and rotating it is a single-column update that invalidates both surfaces at
  once by design.
- **Nothing here stores a computed figure.** Rank, session record, last game and
  champion pool are all derived per request from `ranked_history`,
  `match_participants` and `champion_stats`. A cached overlay row would be one
  more thing to invalidate on every sync, and the delay makes the correct answer
  a function of _when you ask_, not of what was last written.
- **`delaySeconds` is stored rather than applied in the browser.** The whole
  point is that the payload never contains a game the broadcast has not reached;
  a client-side delay would ship it and then hide it, which anyone can read out
  of devtools.
- **`streamSafe` redacts on the server for the same reason.** With it on the Riot
  ID is dropped from the payload entirely rather than hidden by a widget.
- **`sessionStartedAt` is nullable and that is the common case.** Null means the
  counters run from the start of today in the creator's `profiles.timezone`, so a
  working session counter needs nobody to press anything.
- **`riotAccountId` is `ON DELETE SET NULL`, not cascade.** Unlinking a Riot
  account must not delete the kit and the key with it; null falls back to
  whichever account is primary.

---

## Match Timeline (LA-45 — see [ADR-033](./adr/ADR-033-match-timeline-capture.md))

The rest of the Match-V5 timeline payload. We were already fetching it in full for every synced
ranked match and keeping only the `CHAMPION_KILL` events belonging to one player; these two tables
keep the remainder.

Both are keyed on the **match**, unlike `match_death_events`, which is keyed on
`(match_id, riot_account_id)` and stays as it is. A match is therefore captured once whoever is in
it, and a fact involving two players at once — "your gold against your lane opponent's" — becomes
expressible, which a per-player capture cannot do.

### `match_timeline_frames`

One participant's state at one minute, for all ten players. Riot samples on `frameInterval`
(60000 ms), so `minute` is the frame ordinal.

| Column                | Type      | Constraints                                                 |
| --------------------- | --------- | ----------------------------------------------------------- |
| `id`                  | `uuid`    | PK                                                          |
| `matchId`             | `uuid`    | NOT NULL — FK → `matches.id` ON DELETE CASCADE              |
| `participantId`       | `integer` | NOT NULL — timeline-local, 1–10                             |
| `puuid`               | `text`    | NOT NULL — denormalised; what joins to `match_participants` |
| `minute`              | `integer` | NOT NULL — frame ordinal                                    |
| `timestampMs`         | `integer` | NOT NULL                                                    |
| `currentGold`         | `integer` | NOT NULL — gold in hand                                     |
| `totalGold`           | `integer` | NOT NULL — earned across the game, monotonic                |
| `xp`                  | `integer` | NOT NULL                                                    |
| `level`               | `integer` | NOT NULL                                                    |
| `minionsKilled`       | `integer` | NOT NULL                                                    |
| `jungleMinionsKilled` | `integer` | NOT NULL                                                    |

**Indexes:**

- `UNIQUE (matchId, participantId, minute)`
- `INDEX (matchId, puuid)`

### `match_timeline_events`

| Column          | Type                | Constraints                                    |
| --------------- | ------------------- | ---------------------------------------------- |
| `id`            | `uuid`              | PK                                             |
| `matchId`       | `uuid`              | NOT NULL — FK → `matches.id` ON DELETE CASCADE |
| `kind`          | `TimelineEventKind` | NOT NULL — enum, eleven values                 |
| `timestampMs`   | `integer`           | NOT NULL                                       |
| `participantId` | `integer`           | nullable — the subject, where there is one     |
| `puuid`         | `text`              | nullable — resolved from `participantId`       |
| `positionX`     | `integer`           | nullable                                       |
| `positionY`     | `integer`           | nullable                                       |
| `payload`       | `jsonb`             | NOT NULL — the kind-specific tail              |

**Indexes:**

- `INDEX (matchId, kind)`
- `INDEX (matchId, puuid)`

**Notes:**

- **`minute` is the frame ordinal, not a value derived from `timestampMs`.** The unique constraint
  is built on it, and dividing a timestamp would let two frames round to the same minute — where
  `skipDuplicates` would silently drop one rather than fail.
- **The unique index is load-bearing.** With `createMany({ skipDuplicates: true })` it makes the
  capture idempotent, so a repeated or concurrent run needs no transaction and cannot double-write.
- **`CHAMPION_KILL` is keyed to the victim**, not the killer, with the killer moved into `payload`.
  It matches how `match_death_events` already reads, so "my deaths" stays an indexed lookup rather
  than a jsonb search. Every other kind is keyed to the acting participant — and `WARD_PLACED` is
  the one kind Riot names that actor `creatorId` rather than `killerId` or `participantId`.
- **`participantId` is null for a building taken by minions.** Riot reports `killerId: 0`, which is
  not a participant; a null subject is the honest row.
- **`payload` is jsonb rather than a column per facet.** The eleven kinds share almost no fields, so
  columns would mean forty mostly-null ones plus a migration for every new Riot event kind. It is
  re-validated on read, the same contract `saved_searches.filters` uses.
- **Riot's per-minute `position` is not captured.** A movement track is a dataset of its own and has
  no column to land in.
- **Nothing is backfilled.** Matches synced before LA-45 have death events and no frames; the lane
  phase endpoint answers 404 for them and the page renders an empty state.
- **This adds no Riot requests.** The payload was already fetched in full — 95% of it was discarded.

---

## Saved match searches (LA-36)

Migration `20260819000000_add_saved_searches`.

### `saved_searches`

| Column      | Type          | Constraints                                                   |
| ----------- | ------------- | ------------------------------------------------------------- |
| `id`        | `uuid`        | PK                                                            |
| `userId`    | `uuid`        | NOT NULL — FK → `users.id` ON DELETE CASCADE                  |
| `name`      | `text`        | NOT NULL — 1–60 chars, enforced in the service                |
| `filters`   | `jsonb`       | NOT NULL — the facets, as `archiveFilterSchema` produces them |
| `createdAt` | `timestamptz` | DEFAULT now()                                                 |
| `updatedAt` | `timestamptz` | @updatedAt                                                    |

**Indexes:**

- `UNIQUE (userId, name)`
- `INDEX (userId, createdAt DESC)`

**Notes:**

- **Saved searches hang off the user, not off a `riot_accounts` row.** The filters describe a
  question — "Ahri losses under 25 minutes" — and the same question is worth asking of either
  linked account. Which account it is asked of comes from the account selector at request time.
- **`filters` is jsonb rather than a column per facet.** The facet set grows every time the filter
  console grows a control, and a column each would mean a migration for each. It is re-validated
  through the current `archiveFilterSchema` on read, so a search saved before a facet existed still
  loads: unknown keys fall away and the rest survives. A row that cannot be salvaged is dropped
  from the list rather than failing the request — one bad row must not cost a player every other
  search they saved. Same contract as `match_timeline_events.payload`.
- **The unique index is what makes "save" mean save.** Writing a name that already exists upserts
  it, so re-saving under the same name is the update path; there is no separate rename endpoint.
- **50 rows per user**, enforced in `savedSearchService` rather than by a constraint — the count is
  taken before the upsert so that replacing an existing search is never refused for being over the
  cap.
- **The cascade is the whole deletion story.** A saved search holds no match data of its own, only
  facet values, so a deleted account takes them with it and nothing else needs cleaning up.

---

## Discord (bot link + channel webhook, LA-54 — see [ADR-035](./adr/ADR-035-discord-bot-over-http-interactions.md))

### `discord_integrations`

One row per user, holding **two independent things**: an outbound channel webhook with its
notification toggles, and the Discord account the bot answers for. Either may be present
without the other, which is why both are nullable.

| Column            | Type          | Constraints                              | Notes                                                                                      |
| ----------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `id`              | `uuid`        | PK                                       |                                                                                            |
| `userId`          | `uuid`        | FK → users.id, UNIQUE, ON DELETE CASCADE |                                                                                            |
| `discordUserId`   | `text`        | NULLABLE, UNIQUE                         | Written by `/lolai link`. Unique so one Discord account cannot be claimed by two profiles. |
| `discordUsername` | `text`        | NULLABLE                                 | Display name at link time, shown by `/lolai status`                                        |
| `webhookUrl`      | `text`        | NULLABLE, encrypted                      | AES-256-GCM via `AUTH_ENCRYPTION_KEY`. Channel webhook for rank-up/badge/weekly embeds.    |
| `notifyRankUp`    | `boolean`     | NOT NULL, default `true`                 |                                                                                            |
| `notifyBadge`     | `boolean`     | NOT NULL, default `false`                |                                                                                            |
| `notifyWeekly`    | `boolean`     | NOT NULL, default `true`                 |                                                                                            |
| `createdAt`       | `timestamptz` | NOT NULL                                 |                                                                                            |
| `updatedAt`       | `timestamptz` | NOT NULL                                 |                                                                                            |

**Indexes:**

- `UNIQUE (userId)`
- `UNIQUE (discordUserId)` — added by `20260822180000_discord_bot_link`

**Notes:**

- **`webhookUrl` became nullable when the bot landed** (`20260822180000_discord_bot_link`).
  Before that the row could only exist for a webhook; now it can exist for a link with no
  webhook behind it. Safe on existing data — every row at the time had one, and dropping
  `NOT NULL` neither rewrites nor rejects any of them.
- **Neither feature may switch the other off.** `DELETE /api/settings/discord` clears
  `webhookUrl` and keeps the row when a `discordUserId` is on it; `/lolai unlink` clears the
  two Discord columns and keeps the row when a `webhookUrl` is on it. The row is only
  actually deleted when nothing else is left in it.
- **Every reader treats `webhookUrl` as optional**, including the ones that predate the
  bot — `sendWeeklyReportEmails` filters on `webhookUrl: { not: null }` and the settings
  route has always reported `hasWebhook: !!integration.webhookUrl`.
- **Postgres allows any number of NULLs under a unique index**, so every row that has never
  linked stays valid under `UNIQUE (discordUserId)`.

---

## Desktop companion pairing (LA-59 — see [ADR-038](./adr/ADR-038-desktop-companion-architecture.md))

Added by `20260823120000_add_desktop_pairing`. Two new tables, nothing existing touched.

The desktop app cannot carry a session cookie, so it authenticates with a capability token
— the same mechanism as `creator_profiles.overlayKey` and `draft_series.blueToken`. The
player mints it by reading a short one-time code off the website and typing it into the app.

### `desktop_devices`

| Column       | Type          | Constraints                      | Notes                                                                                                                                                                        |
| ------------ | ------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | PK                               |                                                                                                                                                                              |
| `userId`     | `uuid`        | FK → users.id, ON DELETE CASCADE |                                                                                                                                                                              |
| `token`      | `text`        | NOT NULL, UNIQUE                 | 32 bytes as base64url (43 chars). Returned exactly once, by the pairing exchange that mints it, and never by any other endpoint. Lives in the machine's OS credential store. |
| `label`      | `text`        | NOT NULL                         | The machine's hostname, reported by the app at pairing. What the player sees in the device list.                                                                             |
| `platform`   | `text`        | NOT NULL                         | `windows` \| `macos` \| `linux`                                                                                                                                              |
| `appVersion` | `text`        | NULLABLE                         | Reported at pairing; null for a client too old to send it.                                                                                                                   |
| `createdAt`  | `timestamptz` | NOT NULL                         |                                                                                                                                                                              |
| `lastSeenAt` | `timestamptz` | NULLABLE                         | Written by the device's own authenticated requests. Null until it has spoken once after pairing.                                                                             |
| `revokedAt`  | `timestamptz` | NULLABLE                         | Non-null means every request presenting this token is refused.                                                                                                               |

**Indexes:**

- `UNIQUE (token)`
- `(userId, createdAt DESC)` — the device list

### `desktop_pairing_codes`

| Column       | Type          | Constraints                      | Notes                                                                                                                       |
| ------------ | ------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | PK                               |                                                                                                                             |
| `userId`     | `uuid`        | FK → users.id, ON DELETE CASCADE |                                                                                                                             |
| `code`       | `text`        | NOT NULL, UNIQUE                 | 8 characters from a confusion-free alphabet (no `I`, `L`, `O`, `U`, `0`, `1`).                                              |
| `createdAt`  | `timestamptz` | NOT NULL                         |                                                                                                                             |
| `expiresAt`  | `timestamptz` | NOT NULL                         | 10 minutes after issue.                                                                                                     |
| `consumedAt` | `timestamptz` | NULLABLE                         | Set on the first successful exchange. A consumed code is dead.                                                              |
| `deviceId`   | `uuid`        | NULLABLE                         | Which device claimed it. Deliberately not a foreign key: the record of what was paired should outlive a revoked device row. |

**Indexes:**

- `UNIQUE (code)`
- `(userId, createdAt DESC)`
- `(expiresAt)` — the sweep, and what keeps the table bounded

**Notes:**

- **A row, not a signed token**, for the one property a stateless token cannot give: single
  use. `discord.linkToken` went the stateless way because a Discord interaction is already
  proof of identity and replaying it changes nothing; a pairing code mints a long-lived
  credential, so replay is exactly the thing to prevent.
- **The code is short because a person retypes it**, which also means it is low-entropy —
  ~40 bits. That is paid for elsewhere: it expires in 10 minutes, it is consumed on first
  success, only one code per account is live at a time (issuing a new one expires the old),
  and both issuing and redeeming are rate limited.
- **Revoking keeps the device row** rather than deleting it. The token stays taken, so it
  cannot be resurrected by a collision, and the player keeps a record that the machine was
  once paired.
