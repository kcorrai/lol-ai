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

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | |
| `email_verified` | `timestamptz` | NULLABLE | Set when email verified |
| `name` | `varchar(100)` | NULLABLE | Display name |
| `image` | `text` | NULLABLE | Avatar URL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Auto-updated |

**Indexes:**
- `UNIQUE (email)`

---

### `accounts`

OAuth provider accounts (NextAuth pattern).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, NOT NULL | |
| `type` | `varchar(50)` | NOT NULL | `oauth`, `email` |
| `provider` | `varchar(50)` | NOT NULL | `google`, `discord`, etc. |
| `provider_account_id` | `text` | NOT NULL | External account ID |
| `refresh_token` | `text` | NULLABLE, encrypted | |
| `access_token` | `text` | NULLABLE, encrypted | |
| `expires_at` | `bigint` | NULLABLE | Unix timestamp |
| `token_type` | `varchar(50)` | NULLABLE | |
| `scope` | `text` | NULLABLE | |
| `id_token` | `text` | NULLABLE | |

**Indexes:**
- `UNIQUE (provider, provider_account_id)`
- `INDEX (user_id)`

---

### `sessions`

Active user sessions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `session_token` | `text` | UNIQUE, NOT NULL | |
| `user_id` | `uuid` | FK → users.id, NOT NULL | |
| `expires` | `timestamptz` | NOT NULL | |

---

### `profiles`

Extended user preferences and coaching context.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, UNIQUE, NOT NULL | One-to-one |
| `preferred_role` | `varchar(20)` | NULLABLE | `top`, `jungle`, `mid`, `adc`, `support` |
| `coaching_style` | `varchar(20)` | DEFAULT `'balanced'` | `aggressive`, `balanced`, `passive` |
| `rank_goal` | `varchar(20)` | NULLABLE | Target rank string |
| `weekly_play_hours` | `int` | NULLABLE | Self-reported |
| `timezone` | `varchar(50)` | DEFAULT `'UTC'` | |
| `language` | `varchar(10)` | DEFAULT `'en'` | AI report language |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL | |

---

### `subscriptions`

Payment and plan state.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, UNIQUE, NOT NULL | |
| `stripe_customer_id` | `text` | UNIQUE, NULLABLE | |
| `stripe_subscription_id` | `text` | UNIQUE, NULLABLE | |
| `plan` | `varchar(20)` | NOT NULL, DEFAULT `'free'` | `free`, `pro`, `elite` |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `'active'` | `active`, `canceled`, `past_due`, `trialing` |
| `current_period_start` | `timestamptz` | NULLABLE | |
| `current_period_end` | `timestamptz` | NULLABLE | |
| `cancel_at_period_end` | `boolean` | DEFAULT false | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

**Indexes:**
- `INDEX (user_id)`
- `INDEX (stripe_customer_id)`

---

### `riot_accounts`

Linked Riot / League of Legends accounts.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, NOT NULL | |
| `puuid` | `varchar(78)` | UNIQUE, NOT NULL | Riot PUUID (permanent ID) |
| `summoner_id` | `text` | NOT NULL | Summoner ID (region-scoped) |
| `account_id` | `text` | NOT NULL | Account ID |
| `game_name` | `varchar(16)` | NOT NULL | Riot ID game name |
| `tag_line` | `varchar(5)` | NOT NULL | Riot ID tagline |
| `summoner_level` | `int` | NOT NULL | |
| `profile_icon_id` | `int` | NOT NULL | |
| `region` | `varchar(10)` | NOT NULL | `na1`, `euw1`, `kr`, etc. |
| `is_primary` | `boolean` | NOT NULL, DEFAULT false | |
| `last_synced_at` | `timestamptz` | NULLABLE | Last successful sync |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

**Indexes:**
- `UNIQUE (puuid)`
- `INDEX (user_id)`

---

### `matches`

Match metadata. One row per unique match.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `match_id` | `varchar(20)` | UNIQUE, NOT NULL | Riot match ID (e.g., `NA1_4829...`) |
| `region` | `varchar(10)` | NOT NULL | |
| `queue_id` | `int` | NOT NULL | Riot queue type ID |
| `queue_type` | `varchar(30)` | NOT NULL | `RANKED_SOLO_5x5`, `NORMAL`, etc. |
| `game_mode` | `varchar(30)` | NOT NULL | |
| `game_duration` | `int` | NOT NULL | Seconds |
| `game_start` | `timestamptz` | NOT NULL | |
| `game_end` | `timestamptz` | NOT NULL | |
| `game_version` | `varchar(20)` | NOT NULL | Patch version |
| `winning_team` | `int` | NOT NULL | `100` (blue) or `200` (red) |
| `raw_data_hash` | `varchar(64)` | NOT NULL | SHA-256 of raw API response |
| `created_at` | `timestamptz` | NOT NULL | |

**Indexes:**
- `UNIQUE (match_id)`
- `INDEX (game_start)` — for time-range queries
- `INDEX (queue_type, game_start)` — for ranked history queries

---

### `match_participants`

Per-player stats for each match. Links a player (riot_account) to a match.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `match_id` | `uuid` | FK → matches.id, NOT NULL | |
| `riot_account_id` | `uuid` | FK → riot_accounts.id, NULLABLE | Null for non-tracked players |
| `puuid` | `varchar(78)` | NOT NULL | For non-tracked players too |
| `team_id` | `int` | NOT NULL | 100 or 200 |
| `champion_id` | `int` | NOT NULL | Riot champion ID |
| `champion_name` | `varchar(50)` | NOT NULL | |
| `position` | `varchar(20)` | NOT NULL | `TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY` |
| `kills` | `int` | NOT NULL | |
| `deaths` | `int` | NOT NULL | |
| `assists` | `int` | NOT NULL | |
| `cs` | `int` | NOT NULL | Total minions + monsters |
| `cs_per_minute` | `decimal(5,2)` | NOT NULL | |
| `gold_earned` | `int` | NOT NULL | |
| `gold_per_minute` | `decimal(7,2)` | NOT NULL | |
| `damage_dealt` | `int` | NOT NULL | Total damage to champions |
| `damage_taken` | `int` | NOT NULL | |
| `damage_healed` | `int` | NOT NULL | |
| `vision_score` | `int` | NOT NULL | |
| `wards_placed` | `int` | NOT NULL | |
| `wards_killed` | `int` | NOT NULL | |
| `control_wards_bought` | `int` | NOT NULL | |
| `turrets_destroyed` | `int` | NOT NULL | |
| `objectives_stolen` | `int` | NOT NULL | |
| `first_blood` | `boolean` | NOT NULL | |
| `won` | `boolean` | NOT NULL | |
| `time_spent_dead` | `int` | NOT NULL | Seconds |
| `total_time_cc_dealt` | `int` | NOT NULL | |
| `item_ids` | `int[]` | NOT NULL | Array of 6 item IDs |
| `rune_primary_path` | `int` | NULLABLE | |
| `rune_primary_keystone` | `int` | NULLABLE | |
| `rune_secondary_path` | `int` | NULLABLE | |
| `summoner_spell_1` | `int` | NOT NULL | |
| `summoner_spell_2` | `int` | NOT NULL | |

**Indexes:**
- `INDEX (match_id)`
- `INDEX (riot_account_id, match_id)` — user's own games
- `INDEX (riot_account_id, champion_id)` — per-champion history

---

### `champions`

Static champion reference data. Updated per patch.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `int` | PK (Riot champion ID) | |
| `key` | `varchar(30)` | UNIQUE, NOT NULL | Internal key, e.g., `Ahri` |
| `name` | `varchar(50)` | NOT NULL | Display name |
| `title` | `varchar(100)` | NOT NULL | |
| `roles` | `text[]` | NOT NULL | `Fighter`, `Mage`, etc. |
| `difficulty` | `int` | NOT NULL | 1–3 |
| `image_url` | `text` | NOT NULL | |
| `patch_version` | `varchar(20)` | NOT NULL | Last updated patch |
| `updated_at` | `timestamptz` | NOT NULL | |

---

### `champion_stats`

Aggregated per-champion performance stats for a specific riot_account.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `riot_account_id` | `uuid` | FK → riot_accounts.id, NOT NULL | |
| `champion_id` | `int` | FK → champions.id, NOT NULL | |
| `games_played` | `int` | NOT NULL, DEFAULT 0 | |
| `wins` | `int` | NOT NULL, DEFAULT 0 | |
| `losses` | `int` | NOT NULL, DEFAULT 0 | |
| `avg_kda` | `decimal(5,2)` | NOT NULL | |
| `avg_kills` | `decimal(4,2)` | NOT NULL | |
| `avg_deaths` | `decimal(4,2)` | NOT NULL | |
| `avg_assists` | `decimal(4,2)` | NOT NULL | |
| `avg_cs` | `decimal(6,2)` | NOT NULL | |
| `avg_cs_per_minute` | `decimal(5,2)` | NOT NULL | |
| `avg_vision_score` | `decimal(5,2)` | NOT NULL | |
| `avg_damage_dealt` | `decimal(10,2)` | NOT NULL | |
| `avg_gold_per_minute` | `decimal(7,2)` | NOT NULL | |
| `mastery_level` | `int` | NULLABLE | Champion mastery |
| `mastery_points` | `bigint` | NULLABLE | |
| `queue_type` | `varchar(30)` | NOT NULL | Stats are per queue type |
| `computed_at` | `timestamptz` | NOT NULL | When this was last computed |

**Indexes:**
- `UNIQUE (riot_account_id, champion_id, queue_type)`
- `INDEX (riot_account_id, games_played DESC)` — most played champions

---

### `ranked_history`

Point-in-time ranked snapshots.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `riot_account_id` | `uuid` | FK → riot_accounts.id, NOT NULL | |
| `queue_type` | `varchar(30)` | NOT NULL | `RANKED_SOLO_5x5`, `RANKED_FLEX_SR` |
| `tier` | `varchar(15)` | NOT NULL | `IRON`, `BRONZE`, ... `CHALLENGER` |
| `rank` | `varchar(5)` | NOT NULL | `I`, `II`, `III`, `IV` |
| `lp` | `int` | NOT NULL | League Points |
| `wins` | `int` | NOT NULL | Season wins |
| `losses` | `int` | NOT NULL | |
| `recorded_at` | `timestamptz` | NOT NULL | When snapshot was taken |

**Indexes:**
- `INDEX (riot_account_id, queue_type, recorded_at DESC)`

---

### `performance_snapshots`

Periodic performance summaries computed from match data.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `riot_account_id` | `uuid` | FK → riot_accounts.id, NOT NULL | |
| `period_start` | `timestamptz` | NOT NULL | |
| `period_end` | `timestamptz` | NOT NULL | |
| `games_analyzed` | `int` | NOT NULL | |
| `win_rate` | `decimal(5,2)` | NOT NULL | Percentage |
| `avg_kda` | `decimal(5,2)` | NOT NULL | |
| `avg_cs_per_minute` | `decimal(5,2)` | NOT NULL | |
| `avg_vision_score` | `decimal(5,2)` | NOT NULL | |
| `tilt_score` | `decimal(5,2)` | NULLABLE | 0–100, higher = more tilted |
| `most_played_champion_ids` | `int[]` | NOT NULL | Top 3 |
| `strongest_area` | `varchar(50)` | NULLABLE | e.g., `"early_game_fighting"` |
| `weakest_area` | `varchar(50)` | NULLABLE | e.g., `"vision_control"` |
| `created_at` | `timestamptz` | NOT NULL | |

---

### `coaching_reports`

AI-generated coaching reports.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `riot_account_id` | `uuid` | FK → riot_accounts.id, NOT NULL | |
| `report_type` | `varchar(30)` | NOT NULL | `session_review`, `champion_focus`, `climb_roadmap` |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `'pending'` | `pending`, `processing`, `complete`, `failed` |
| `matches_analyzed` | `uuid[]` | NOT NULL | Array of match IDs |
| `summary` | `text` | NULLABLE | High-level summary |
| `strengths` | `jsonb` | NULLABLE | Array of strength objects |
| `weaknesses` | `jsonb` | NULLABLE | Array of weakness objects |
| `action_items` | `jsonb` | NULLABLE | Prioritized improvement list |
| `champion_recommendations` | `jsonb` | NULLABLE | |
| `estimated_rank_potential` | `varchar(20)` | NULLABLE | |
| `coach_persona_response` | `text` | NULLABLE | Full narrative coaching text |
| `user_rating` | `int` | NULLABLE | 1–5, user-submitted |
| `user_feedback` | `text` | NULLABLE | |
| `ai_model_used` | `varchar(50)` | NULLABLE | For audit |
| `processing_time_ms` | `int` | NULLABLE | |
| `created_at` | `timestamptz` | NOT NULL | |
| `completed_at` | `timestamptz` | NULLABLE | |

**Indexes:**
- `INDEX (riot_account_id, created_at DESC)`
- `INDEX (status)` — for queue processing

---

### `ai_analyses`

Low-level AI API call records. Used for caching, auditing, and cost tracking.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `coaching_report_id` | `uuid` | FK → coaching_reports.id, NULLABLE | |
| `analysis_type` | `varchar(50)` | NOT NULL | |
| `input_hash` | `varchar(64)` | NOT NULL | SHA-256 of input payload |
| `provider` | `varchar(20)` | NOT NULL | `openai`, `anthropic` |
| `model` | `varchar(50)` | NOT NULL | |
| `prompt_tokens` | `int` | NOT NULL | |
| `completion_tokens` | `int` | NOT NULL | |
| `total_tokens` | `int` | NOT NULL | |
| `cost_usd` | `decimal(10,6)` | NULLABLE | Estimated cost |
| `response_raw` | `text` | NOT NULL | Full model response |
| `cache_hit` | `boolean` | NOT NULL, DEFAULT false | |
| `latency_ms` | `int` | NOT NULL | |
| `created_at` | `timestamptz` | NOT NULL | |

**Indexes:**
- `UNIQUE (input_hash)` — for cache lookup
- `INDEX (coaching_report_id)`
- `INDEX (created_at DESC)` — cost analytics

---

### `training_plans`

Personalized training plans generated by AI.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `riot_account_id` | `uuid` | FK → riot_accounts.id, NOT NULL | |
| `title` | `varchar(100)` | NOT NULL | |
| `focus_area` | `varchar(50)` | NOT NULL | `laning`, `teamfighting`, `vision`, etc. |
| `target_rank` | `varchar(20)` | NULLABLE | |
| `duration_weeks` | `int` | NOT NULL | |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `'active'` | `active`, `completed`, `abandoned` |
| `created_at` | `timestamptz` | NOT NULL | |
| `completed_at` | `timestamptz` | NULLABLE | |

---

### `training_tasks`

Individual tasks within a training plan.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `training_plan_id` | `uuid` | FK → training_plans.id, NOT NULL | |
| `title` | `varchar(200)` | NOT NULL | |
| `description` | `text` | NOT NULL | |
| `type` | `varchar(30)` | NOT NULL | `game_goal`, `review_task`, `theory_task` |
| `target_metric` | `varchar(50)` | NULLABLE | e.g., `cs_per_minute` |
| `target_value` | `decimal(10,2)` | NULLABLE | |
| `is_completed` | `boolean` | NOT NULL, DEFAULT false | |
| `completed_at` | `timestamptz` | NULLABLE | |
| `order` | `int` | NOT NULL | Display order |

---

### `notifications`

In-app notifications.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, NOT NULL | |
| `type` | `varchar(50)` | NOT NULL | `report_ready`, `rank_change`, `tilt_alert`, etc. |
| `title` | `varchar(100)` | NOT NULL | |
| `body` | `text` | NOT NULL | |
| `action_url` | `text` | NULLABLE | |
| `is_read` | `boolean` | NOT NULL, DEFAULT false | |
| `created_at` | `timestamptz` | NOT NULL | |

**Indexes:**
- `INDEX (user_id, is_read, created_at DESC)`

---

## 3. Index Strategy Summary

### High-traffic query patterns and their indexes:

| Query Pattern | Index |
|---|---|
| User's match history (recent first) | `(riot_account_id, game_start DESC)` on matches via participants |
| User's champion stats (most played) | `(riot_account_id, games_played DESC)` on champion_stats |
| Ranked history timeline | `(riot_account_id, queue_type, recorded_at DESC)` |
| Coaching reports for user | `(riot_account_id, created_at DESC)` |
| Pending AI jobs | `(status)` on coaching_reports |
| AI cache lookup | `UNIQUE (input_hash)` on ai_analyses |
| Unread notifications | `(user_id, is_read, created_at DESC)` |

---

## 4. Scalability Notes

- **Matches table** will grow very large. Partition by `game_start` year/quarter when row count exceeds 50M.
- **match_participants** is the most queried table. Ensure composite indexes are tight.
- **ai_analyses** stores full raw responses. Archive rows older than 90 days to cold storage to keep table small.
- **ranked_history** is append-only. Never update, only insert. Ideal for time-series partitioning.
- Consider **read replicas** for analytics queries on champion_stats and performance_snapshots.
