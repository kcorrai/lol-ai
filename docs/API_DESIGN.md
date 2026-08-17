# API Design — LoL AI Coach

**Version:** 1.0  
**Base URL:** `/api` (unversioned, stable) | `/api/v1/` (versioned)  
**Format:** REST, JSON  
**Auth:** Session cookie + Bearer JWT

---

## Public Free Tools (no auth, zero AI cost)

The counter, matchup, and draft tools are now **public, data-driven pages** under the
`app/(tools)/` route group — they read cached meta stats server-side (RSC) from the
`meta` domain rather than calling an AI provider. There are no dedicated API routes:

- `/tools/counter-picker`, `/tools/matchup`, `/tools/draft-analyzer`, `/tools/tier-list`
- `/counters/[champion]` — ~170 statically generated SEO pages

### Phase 7 SEO expansion (page map)

- `/builds`, `/builds/[champion]`, `/builds/[champion]/[role]` — champion build pages
  (runes, items, skill order, game-length curve, patch trend). Prerender top 50, ISR 12h.
- `/matchups/[slug]` — champion-vs-champion pages, alphabetical canonical
  (`ahri-vs-zed`); the reverse slug 308-redirects to canonical.
- `/aram/tier-list` and `/aram/[champion]` — ARAM tier list + ARAM build pages
  (`mode: "aram"`, NONE position, no bans).
- `/tools/tier-list/[role]` — top/jungle/mid/bot/support role hubs. `?role=` 308-redirects
  onto the path; `?tier=` (gold_plus…challenger) rank filter is `noindex`.
- `/meta` — evergreen patch "Winners & Losers" report (climbers/fallers by rank movement).

All data pages carry a visible freshness strip and JSON-LD `dateModified` from the
snapshot's `fetchedAt`. Tool pages with query-param permalinks
(`counter-picker?champion`, `matchup?a/b`, `draft-analyzer?blue/red`,
`tier-list/[role]?tier`, `counters/[champion]?tier`) are `noindex, follow` with a
canonical to the clean path.

**Removed** (previously AI-powered, now deleted): `GET /api/counter`,
`POST /api/matchup/analyze`, `POST /api/draft/analyze`.

**Redirects (308):** `/counter → /tools/counter-picker`, `/matchup → /tools/matchup`,
`/draft → /tools/draft-analyzer` (see `next.config.mjs`); `?role=` → role hub;
reverse matchup slug → alphabetical canonical.

`GET /api/public/preview` still powers the landing demo but its coaching insight is now
**rule-based** (no AI call), so the entire anonymous surface is zero-AI-cost.

---

## 0. API Versioning & Deprecation Policy

### Version Header

Every API response includes:
```
X-API-Version: 1
```

### Versioned Paths

Critical endpoints are available at both their legacy path and the `/api/v1/` prefix:

| Versioned path | Legacy path |
|---|---|
| `POST /api/v1/coaching/generate` | `POST /api/coaching/generate` |
| `GET /api/v1/coaching/reports` | `GET /api/coaching/reports` |
| `GET /api/v1/riot/accounts` | `GET /api/riot/accounts` |

### Deprecation Policy

1. **Minor changes** (new optional fields, new endpoints): No version bump. Clients must ignore unknown fields.
2. **Breaking changes** (removed fields, changed behavior, renamed endpoints): Require a version bump to `/api/v2/`.
3. **Deprecation notice**: A `Deprecation: <date>` response header is added at least **90 days** before a breaking change ships to production.
4. **Sunset**: After the deprecation period, old paths return `410 Gone` with a `Link` header pointing to the replacement.
5. **Legacy path support**: Unversioned `/api/` paths remain aliases for `/api/v1/` indefinitely until a breaking change requires `/v2/`.

### Migration Guide

When a v2 ships:
- Unversioned `/api/` paths will serve v1 behavior and emit `Deprecation` headers.
- After 90 days, `/api/` paths redirect (308) to `/api/v2/`.
- Applications should migrate to `/api/v2/` before the sunset date.

---

## 1. Conventions

### Request/Response Format

All endpoints accept and return `application/json`.

**Success response:**
```json
{
  "data": { ... },
  "meta": { "requestId": "uuid" }
}
```

**Error response:**
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Match not found",
    "details": {}
  },
  "meta": { "requestId": "uuid" }
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async processing started) |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity (validation error) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable (e.g., Riot API down) |

### Pagination

List endpoints support cursor-based pagination:

```
GET /api/matches?cursor=<base64-cursor>&limit=20
```

**Paginated response:**
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "base64string",
    "hasMore": true,
    "total": 147
  }
}
```

### Rate Limiting Headers

Every response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1717200000
```

---

## 2. Authentication Endpoints

### `POST /api/auth/register`

Create a new user account.

**Request:**
```json
{
  "email": "player@example.com",
  "password": "securepassword",
  "name": "PlayerName"
}
```

**Response 201:**
```json
{
  "data": {
    "userId": "uuid",
    "email": "player@example.com"
  }
}
```

**Errors:** `400` invalid input, `409` email already registered

---

### `POST /api/auth/login`

Authenticate with email/password.

**Request:**
```json
{
  "email": "player@example.com",
  "password": "securepassword"
}
```

**Response 200:** Sets `session` cookie, returns user object.

---

### `POST /api/auth/logout`

Invalidate current session.

**Response 200:** Clears session cookie.

---

### `GET /api/auth/session`

Return current authenticated user.

**Response 200:**
```json
{
  "data": {
    "userId": "uuid",
    "email": "player@example.com",
    "name": "PlayerName",
    "subscription": {
      "plan": "pro",
      "status": "active"
    }
  }
}
```

---

## 3. Riot Account Endpoints

### `POST /api/riot/connect`

Initiate connection of a Riot account by Riot ID.

**Auth required.** **Subscription check:** Free tier max 1 account.

**Request:**
```json
{
  "gameName": "Faker",
  "tagLine": "KR1",
  "region": "kr"
}
```

**Response 201:**
```json
{
  "data": {
    "riotAccountId": "uuid",
    "gameName": "Faker",
    "tagLine": "KR1",
    "summonerLevel": 500,
    "profileIconId": 4361,
    "region": "kr",
    "isPrimary": true
  }
}
```

**Errors:** `404` Riot ID not found, `409` account already connected, `422` invalid region

---

### `POST /api/onboarding/complete`

Mark the forced first-journey onboarding complete (TASK-217). Idempotent — a repeat call keeps the
original timestamp. This is the single, bypass-proof source of truth for the onboarding gate; the
step position itself is tracked client-side (localStorage). Called by the guided overlay's final step.

**Auth required.**

**Response 200:**
```json
{ "data": { "completedAt": "2026-07-18T20:00:00.000Z" } }
```

---

### `DELETE /api/riot/:riotAccountId`

Disconnect a Riot account. Preserves historical data.

**Auth required.** User must own the account.

**Response 200:**
```json
{ "data": { "disconnected": true } }
```

---

### `POST /api/riot/:riotAccountId/sync`

Trigger a manual match history sync.

**Auth required.**

**Response 202:**
```json
{
  "data": {
    "jobId": "uuid",
    "status": "queued",
    "estimatedSeconds": 15
  }
}
```

**Notes:** Debounced — max 1 sync per 5 minutes per account.

---

### `GET /api/riot/:riotAccountId/ranked`

Get current ranked standing.

**Response 200:**
```json
{
  "data": {
    "soloQueue": {
      "tier": "GOLD",
      "rank": "II",
      "lp": 67,
      "wins": 143,
      "losses": 128,
      "winRate": 52.7
    },
    "flexQueue": null
  }
}
```

---

### `GET /api/riot/:riotAccountId/ranked/history`

Ranked LP history for charting.

**Query params:** `queueType=RANKED_SOLO_5x5&days=30`

**Response 200:**
```json
{
  "data": [
    { "lp": 45, "tier": "GOLD", "rank": "III", "recordedAt": "2024-05-01T10:00:00Z" },
    { "lp": 62, "tier": "GOLD", "rank": "III", "recordedAt": "2024-05-02T10:00:00Z" }
  ]
}
```

---

## 4. Match Endpoints

### `GET /api/matches`

Get paginated match history for the authenticated user's primary account.

**Query params:**
- `riotAccountId` — optional, defaults to primary
- `queueType` — `RANKED_SOLO_5x5 | RANKED_FLEX_SR | NORMAL | ALL`
- `championId` — filter by champion
- `cursor` — pagination cursor
- `limit` — default 20, max 50

**Response 200:**
```json
{
  "data": [
    {
      "matchId": "uuid",
      "riotMatchId": "NA1_4829...",
      "gameStart": "2024-05-20T14:30:00Z",
      "gameDuration": 1842,
      "queueType": "RANKED_SOLO_5x5",
      "gameVersion": "14.10",
      "player": {
        "champion": { "id": 103, "name": "Ahri" },
        "position": "MIDDLE",
        "kills": 8,
        "deaths": 2,
        "assists": 11,
        "kda": 9.5,
        "cs": 198,
        "csPerMinute": 6.45,
        "visionScore": 32,
        "won": true,
        "lpChange": 18
      }
    }
  ],
  "pagination": { "nextCursor": "...", "hasMore": true, "total": 87 }
}
```

---

### `GET /api/matches/:matchId`

Get full detail for a single match.

**Response 200:**
```json
{
  "data": {
    "matchId": "uuid",
    "riotMatchId": "NA1_4829...",
    "gameStart": "2024-05-20T14:30:00Z",
    "gameDuration": 1842,
    "queueType": "RANKED_SOLO_5x5",
    "blueTeam": {
      "won": true,
      "players": [ { ... } ]
    },
    "redTeam": {
      "won": false,
      "players": [ { ... } ]
    },
    "playerStats": {
      "kills": 8,
      "deaths": 2,
      "assists": 11,
      "kda": 9.5,
      "cs": 198,
      "csPerMinute": 6.45,
      "goldEarned": 14820,
      "goldPerMinute": 482,
      "damageDealt": 38400,
      "damageTaken": 21300,
      "visionScore": 32,
      "wardsPlaced": 12,
      "wardsKilled": 4,
      "controlWardsBought": 3,
      "items": [3157, 4629, 3165, 3174, 3089, 3040],
      "firstBlood": false,
      "timeSpentDead": 48,
      "summonerSpells": [4, 14]
    }
  }
}
```

---

## 5. Analysis Endpoints

### `GET /api/analysis/champion-stats`

Champion performance statistics for a riot account.

**Query params:** `riotAccountId`, `queueType`, `limit=20`

**Response 200:**
```json
{
  "data": [
    {
      "champion": { "id": 103, "name": "Ahri" },
      "gamesPlayed": 47,
      "wins": 27,
      "losses": 20,
      "winRate": 57.4,
      "avgKDA": 4.2,
      "avgKills": 7.3,
      "avgDeaths": 2.8,
      "avgAssists": 9.2,
      "avgCSPerMinute": 6.1,
      "avgVisionScore": 28.4,
      "masteryLevel": 7,
      "masteryPoints": 312000,
      "tier": "S"
    }
  ]
}
```

---

### `GET /api/analysis/performance-snapshot`

Recent performance summary with trend data.

**Query params:** `riotAccountId`, `days=14`

**Response 200:**
```json
{
  "data": {
    "period": { "start": "2024-05-06", "end": "2024-05-20" },
    "gamesAnalyzed": 32,
    "winRate": 53.1,
    "avgKDA": 3.8,
    "avgCSPerMinute": 5.9,
    "avgVisionScore": 26.1,
    "tiltScore": 34,
    "strongestArea": "laning_phase",
    "weakestArea": "vision_control",
    "trends": {
      "winRate": { "direction": "up", "delta": 4.2 },
      "csPerMinute": { "direction": "down", "delta": -0.3 }
    }
  }
}
```

---

### `GET /api/analysis/champion-pool`

Analysis of a player's champion pool health.

**Response 200:**
```json
{
  "data": {
    "poolHealth": "moderate",
    "primaryChampions": [
      { "championId": 103, "name": "Ahri", "tier": "strong", "gamesPlayed": 47 }
    ],
    "weaknesses": ["no tank option", "vulnerable to hard engage"],
    "metaAlignmentScore": 72,
    "recommendations": [
      {
        "championId": 245,
        "name": "Ekko",
        "reason": "High mobility, complements your aggressive early style",
        "priority": "high"
      }
    ]
  }
}
```

---

### `GET /api/recommendations/champion-meta`

Cross-references the player's champion pool against the current-patch tier lists to produce
short, patch-aware recommendations for the dashboard "This Patch" widget (TASK-239). Requires
`riotAccountId` (must be owned by the caller). Auth + IP rate limited.

**Response 200:**
```json
{
  "data": [
    {
      "kind": "keep",
      "championKey": "Ahri",
      "championName": "Ahri",
      "position": "MIDDLE",
      "positionLabel": "Mid",
      "tier": "S",
      "winRate": 75,
      "games": 8,
      "message": "Ahri is S-tier Mid this patch and you're winning 75% — keep spamming it.",
      "toolHref": "/tools/tier-list/mid",
      "toolLabel": "View the Mid tier list"
    }
  ]
}
```

`kind` is one of `keep` (meta-strong and the user is doing fine), `improve` (meta-strong but the
user is losing on it — links to the counter picker), or `switch` (weak/slipped tier, with an
`alternative` suggestion). Returns `[]` when the pool or tier data is unavailable.

---

## 6. Coaching Endpoints

### `GET /api/coaching/reports`

List coaching reports for the user.

**Query params:** `riotAccountId`, `reportType`, `cursor`, `limit=10`

**Response 200:**
```json
{
  "data": [
    {
      "reportId": "uuid",
      "reportType": "session_review",
      "status": "complete",
      "summary": "Strong laning phase but vision control needs work...",
      "matchesAnalyzed": 5,
      "userRating": 4,
      "createdAt": "2024-05-20T16:00:00Z"
    }
  ]
}
```

---

### `GET /api/coaching/reports/:reportId`

Full coaching report detail.

**Response 200:**
```json
{
  "data": {
    "reportId": "uuid",
    "reportType": "session_review",
    "status": "complete",
    "summary": "...",
    "strengths": [
      { "area": "Laning Phase", "description": "Consistent CS above 6.5/min", "evidence": "47 CS at 10 min average" }
    ],
    "weaknesses": [
      { "area": "Vision Control", "description": "Control wards rarely purchased", "priority": "high", "evidence": "Avg 1.2 control wards per game" }
    ],
    "actionItems": [
      { "priority": 1, "action": "Buy control ward every back, no exceptions", "expectedImpact": "Reduces vision disadvantage by ~30%" },
      { "priority": 2, "action": "Practice Ahri E-W-Q combo in practice tool 15 min/day", "expectedImpact": "Improved combo execution for kill opportunities" }
    ],
    "coachPersonaResponse": "Alright, let's talk about your last five games. The good news is your mechanics are clearly there...",
    "estimatedRankPotential": "PLATINUM I",
    "championRecommendations": [ ... ],
    "matchesAnalyzed": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
    "createdAt": "2024-05-20T16:00:00Z",
    "completedAt": "2024-05-20T16:01:23Z"
  }
}
```

---

### `POST /api/coaching/generate`

Request generation of a new coaching report.

**Auth required.** **Subscription check:** Free tier = 1/week limit.

**Request:**
```json
{
  "riotAccountId": "uuid",
  "reportType": "session_review",
  "matchIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
  "focusArea": "vision_control"
}
```

**`reportType` options:** `session_review`, `champion_focus`, `climb_roadmap`

**Response 202:**
```json
{
  "data": {
    "reportId": "uuid",
    "status": "processing",
    "estimatedSeconds": 45
  }
}
```

---

### `GET /api/coaching/reports/:reportId/status`

Poll report generation status (for client-side polling).

**Response 200:**
```json
{
  "data": {
    "reportId": "uuid",
    "status": "processing",
    "progress": 60
  }
}
```

---

### `POST /api/coaching/reports/:reportId/rate`

Submit user rating for a report.

**Request:**
```json
{
  "rating": 4,
  "feedback": "Very accurate, helped me identify my ward problem"
}
```

**Response 200:** `{ "data": { "rated": true } }`

---

## 7. Training Plan Endpoints

### `GET /api/training/plans`

List active training plans for user.

---

### `POST /api/training/plans`

Generate a new AI training plan.

**Request:**
```json
{
  "riotAccountId": "uuid",
  "focusArea": "laning",
  "targetRank": "PLATINUM",
  "durationWeeks": 4
}
```

**Response 202:** Returns plan ID with `processing` status.

---

### `PATCH /api/training/tasks/:taskId/complete`

Mark a training task as completed.

**Response 200:** Updated task object.

---

## 8. Subscription Endpoints

### `GET /api/subscription`

Get current user's subscription status.

**Response 200:**
```json
{
  "data": {
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": "2024-06-20T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "features": {
      "maxRiotAccounts": 3,
      "reportsPerWeek": -1,
      "matchHistoryDepth": 100
    }
  }
}
```

---

### `POST /api/subscription/checkout`

Create LemonSqueezy Checkout session.

**Request:** `{ "plan": "pro", "interval": "monthly" }`

**Response 200:** `{ "data": { "checkoutUrl": "https://checkout.lemonsqueezy.com/..." } }`

---

### `POST /api/subscription/portal`

Redirect to LemonSqueezy customer portal (manage billing, cancel).

**Response 200:** `{ "data": { "portalUrl": "https://app.lemonsqueezy.com/my-orders/..." } }`

---

### `POST /api/webhooks/lemonsqueezy`

LemonSqueezy webhook handler. Receives subscription lifecycle events.

**Note:** Validates `X-Signature` header with HMAC-SHA256. Not authenticated by session.
Events handled: `subscription_created`, `subscription_updated`, `subscription_cancelled`,
`subscription_expired`, `subscription_resumed`, `subscription_payment_failed`.

---

## 9. Notifications Endpoints

### `GET /api/notifications`

Get recent notifications for user.

**Query params:** `unreadOnly=true`, `limit=20`

---

### `PATCH /api/notifications/:id/read`

Mark notification as read.

---

### `PATCH /api/notifications/read-all`

Mark all notifications as read.

---

## 10. Admin Endpoints

### `GET /api/admin/stats`

Platform-level statistics. Admin role required.

**Response 200:**
```json
{
  "data": {
    "totalUsers": 5200,
    "activeSubscriptions": 312,
    "reportsGeneratedToday": 847,
    "aiCostTodayUsd": 23.40,
    "avgReportGenerationMs": 42000
  }
}
```

---

## 11. AI Tools Endpoints

All AI tool endpoints return cached results (TTL varies per tool) and validate champion names against the database. Rate limits are IP-based unless noted otherwise.

---

### `GET /api/counter`

Generate counter pick recommendations for a champion in a specific role.

**Auth:** None (public)  
**Rate limit:** 20 req/min per IP

**Query params:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `champion` | string | ✓ | Case-insensitive champion name |
| `role` | enum | ✓ | `TOP \| JUNGLE \| MIDDLE \| BOTTOM \| UTILITY` |

**Response 200:**
```json
{
  "data": {
    "champion": "Yasuo",
    "role": "MIDDLE",
    "topCounters": [{ "champion": "Malphite", "tier": "S", "difficulty": "easy", "reasonWhy": "...", "laneAdvantage": "...", "watchOut": "...", "buildHint": "..." }],
    "easyCounters": [...],
    "soloQueueCounters": [...],
    "tips": ["..."],
    "patchNote": "AI-generated disclaimer",
    "generatedAt": "2026-06-05T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

**Cache TTL:** 14 days

---

### `POST /api/matchup/analyze`

Analyze a lane matchup between two champions.

**Auth:** Optional (session enables daily limit tracking)  
**Rate limit:** 15 req/min per IP; free users: 5 analyses/day

**Request body:**
```json
{
  "champion": "Yasuo",
  "opponent": "Zed",
  "role": "MIDDLE"
}
```

**Response 200:**
```json
{
  "data": {
    "champion": "Yasuo",
    "opponent": "Zed",
    "role": "MIDDLE",
    "laneAnalysis": { "overallAdvantage": "even", "earlyGame": "...", "midGame": "...", "lateGame": "...", "tradingPattern": "..." },
    "tradeGuide": { "whenToTrade": "...", "whenToAvoidTrade": "...", "trades": [...] },
    "buildAdvice": { "coreItems": [...], "situationalItems": [...], "avoidItems": [...], "reasoning": "..." },
    "criticalMistakes": [...],
    "patchNote": "...",
    "generatedAt": "2026-06-05T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

**Errors:** `400` champion === opponent, `404` champion not found  
**Cache TTL:** 7 days (directional: Yasuo vs Zed ≠ Zed vs Yasuo)

---

### `GET /api/otp`

Generate an OTP (One-Trick Pony) analysis for a champion in a role.

**Auth:** Optional (Pro users receive full `hiddenMechanics`; free users receive first 2)  
**Rate limit:** 10 req/min per IP

**Query params:**

| Param | Type | Required |
|---|---|---|
| `champion` | string | ✓ |
| `role` | enum | ✓ |

**Response 200:**
```json
{
  "data": {
    "champion": "Yasuo",
    "role": "MIDDLE",
    "matchupTierList": {
      "easy": [{ "opponent": "Garen", "difficulty": "easy", "summary": "...", "keyTip": "..." }],
      "medium": [...],
      "hard": [...]
    },
    "banPriority": [{ "champion": "Fiora", "priority": 1, "reason": "..." }],
    "hiddenMechanics": ["..."],
    "powerSpikes": [{ "trigger": "Level 6", "description": "..." }],
    "laneStrategies": ["..."],
    "metaRating": { "score": 7, "assessment": "Güçlü", "reasoning": "...", "patchContext": "..." },
    "generatedAt": "2026-06-05T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

**Note:** Free/anonymous users receive `hiddenMechanics` truncated to 2 items.  
**Cache TTL:** 14 days

---

### `POST /api/draft/analyze`

Analyze a full 10-champion draft for both teams.

**Auth:** Optional (session enables daily limit tracking)  
**Rate limit:** 10 req/min per IP; free users: 3 analyses/day

**Request body:**
```json
{
  "blueTeam": { "TOP": "Garen", "JUNGLE": "LeeSin", "MIDDLE": "Yasuo", "BOTTOM": "Jinx", "UTILITY": "Thresh" },
  "redTeam":  { "TOP": "Darius", "JUNGLE": "Vi",     "MIDDLE": "Zed",   "BOTTOM": "Caitlyn", "UTILITY": "Lulu" }
}
```

**Response 200:**
```json
{
  "data": {
    "blueTeam": { "TOP": "Garen", ... },
    "redTeam": { "TOP": "Darius", ... },
    "blueTeamComposition": { "engagePower": 7, "disengagePower": 4, "teamfightPower": 8, "pickPotential": 5, "splitPushPower": 6, "summary": "..." },
    "redTeamComposition": { ... },
    "blueWinConditions": [{ "description": "...", "priority": "primary", "howToAchieve": "..." }],
    "redWinConditions": [...],
    "blueScaling": { "earlyGame": { "score": 6, "description": "..." }, "midGame": {...}, "lateGame": {...} },
    "redScaling": { ... },
    "keyMatchups": [{ "blue": "Yasuo", "red": "Zed", "advantage": "even", "note": "..." }],
    "risks": [{ "team": "blue", "risk": "...", "severity": "high" }],
    "verdict": "...",
    "generatedAt": "2026-06-05T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

**Errors:** `400` duplicate champion, `404` champion not found  
**Cache TTL:** 7 days

---

### `GET /api/match/[matchId]/build-explanation`

AI analysis of a specific participant's build in a match.

**Auth:** Required — user must own the participant (linked RiotAccount)  
**Rate limit:** 10 req/hour per user

**Query params:**

| Param | Type | Required |
|---|---|---|
| `puuid` | string | ✓ | Participant's Riot PUUID |

**Response 200:**
```json
{
  "data": {
    "summary": "Overall build assessment in 2-3 sentences",
    "items": [
      {
        "itemName": "Trinity Force",
        "wasGoodChoice": true,
        "reasoning": "Provides the split push power needed...",
        "betterAlternative": null,
        "whenToChoose": "When ahead and building for side lane..."
      }
    ],
    "buildPath": "Ideal build order for this game...",
    "biggestMistake": "Buying Sterak's too early before dealing with poke.",
    "generatedAt": "2026-06-05T00:00:00.000Z"
  },
  "meta": { "requestId": "uuid" }
}
```

**Errors:** `403` participant not owned by requesting user  
**Cache TTL:** 30 days (match data is immutable)

---

## 12. Error Codes Reference

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Insufficient permissions or subscription |
| `RESOURCE_NOT_FOUND` | 404 | Entity does not exist |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `RIOT_ACCOUNT_NOT_FOUND` | 404 | Riot ID does not exist |
| `RIOT_API_UNAVAILABLE` | 503 | Riot API is down |
| `RIOT_RATE_LIMIT` | 429 | Riot API rate limit hit |
| `ACCOUNT_LIMIT_REACHED` | 403 | Free tier max accounts reached |
| `REPORT_LIMIT_REACHED` | 403 | Weekly report limit reached |
| `REPORT_IN_PROGRESS` | 409 | Report already generating for this account |
| `AI_PROVIDER_ERROR` | 503 | AI provider unavailable |
| `INSUFFICIENT_MATCH_DATA` | 422 | Not enough matches to analyze |

---

## 13. Teams (B2B Pilot — TASK-106)

All endpoints require authentication. Team features require `team` subscription plan.

### `GET /api/teams`
Returns teams the authenticated user is a member of.

### `POST /api/teams`
Creates a new team. Body: `{ name: string, logoUrl?: string }`. Returns `201`.

### `GET /api/teams/:teamId`
Returns team details and member list. Requires team membership.

### `DELETE /api/teams/:teamId`
Deletes a team. Requires OWNER role.

### `POST /api/teams/:teamId/members/invite`
Sends an invite email to a new member. Body: `{ email: string, role: "COACH" | "PLAYER" }`.

### `DELETE /api/teams/:teamId/members/:userId`
Removes a member. Requires OWNER role.

### `GET /api/teams/:teamId/dashboard`
Returns team dashboard with member summaries (last match, rank, 7-day WR, last report). Requires COACH or OWNER role.

### `POST /api/teams/invites/:token/accept`
Accepts a team invite. The authenticated user joins the team with the role encoded in the invite.

**Error codes added:**
| Code | HTTP | Meaning |
|---|---|---|
| `TEAM_PLAN_REQUIRED` | 403 | Team plan subscription required |
| `INVITE_EXPIRED` | 409 | Invite token has expired |
| `INVITE_ALREADY_USED` | 409 | Invite token already consumed |

---

### `GET /api/duo/candidates`

The players the caller queues with most, ranked by games on the **same team** across their last
200 synced matches (TASK-244). `matchParticipant` stores all ten players per match, so opponents
are in that data too — they are excluded by comparing team ids per match. Players below 3 shared
games are dropped as autofill randoms. Requires `riotAccountId` (must be owned by the caller).

**Response 200:**
```json
{
  "data": [
    {
      "puuid": "lIfyZTv0...",
      "gameName": "DuoPartner",
      "tagLine": "TR1",
      "games": 42,
      "wins": 25,
      "winRate": 60,
      "lastPlayedAt": "2026-07-19T18:22:00.000Z"
    }
  ]
}
```

---

### `GET|POST|DELETE /api/duo`

The caller's selected duo partner (TASK-244). `GET` returns the active duo with its shared record
recomputed from current match data, or `null`. `POST` sets it, accepting either `puuid` (picked
from the candidate list) or `riotId` (`Name#TAG`, typed by the player). `DELETE` clears it.

A partner must appear in the caller's own match history — we hold no stats for anyone else, so an
arbitrary name is rejected rather than producing an empty chart.

**POST body:**
```json
{ "riotAccountId": "uuid", "puuid": "lIfyZTv0..." }
```
```json
{ "riotAccountId": "uuid", "riotId": "DuoPartner#TR1" }
```

**Response 200:** the active duo, same shape as a candidate.

---

### `GET /api/analysis/daily-momentum`

Per-day performance series for the dashboard momentum chart (TASK-245). Returns one point per day
over the requested window for the caller, and — when a duo is set — the duo's series over the
games they shared. Query: `riotAccountId` (owned by the caller), optional `days` (default 30).

**Response 200:**
```json
{
  "data": {
    "days": 30,
    "self": [
      { "date": "2026-07-19", "games": 4, "wins": 3, "winRate": 75, "kda": 3.4, "csPerMin": 7.1, "visionScore": 24 }
    ],
    "duo": {
      "gameName": "DuoPartner",
      "tagLine": "TR1",
      "points": [
        { "date": "2026-07-19", "games": 3, "wins": 3, "winRate": 100, "kda": 4.1, "csPerMin": 6.2, "visionScore": 31 }
      ]
    }
  }
}
```

---

### `GET /api/riot/live-game`

The caller's current game, shaped for the draft analyzer (TASK-249). Requires `riotAccountId`
(owned by the caller). Auth + IP rate limited, deliberately tightly (30 / 10 min): every call hits
the Riot API, so the UI fires it on a button press and never polls.

Riot answers "not in a game" with a 404; that is translated to `{ "inGame": false }` rather than
surfaced as an error.

**Lanes are inferred, not reported.** The Spectator API returns champions and summoner spells but
no positions. Smite decides the jungler; everyone else takes their most-played lane this patch,
assigned by how concentrated the champion is in it. The UI presents the result as a starting point
the player can correct.

This is the *live* game, not champion select — spectator only sees a match once it has started
(see ADR-005).

**Response 200 (in a game):**
```json
{
  "data": {
    "inGame": true,
    "gameMode": "CLASSIC",
    "gameLength": 412,
    "yourSide": "blue",
    "draft": {
      "blue": { "TOP": "Garen", "JUNGLE": "LeeSin", "MIDDLE": "Ahri", "BOTTOM": "Jinx", "UTILITY": "Thresh" },
      "red": { "TOP": "Darius", "JUNGLE": "Vi", "MIDDLE": "Sylas", "BOTTOM": "Caitlyn", "UTILITY": "Lulu" }
    },
    "yourMatchup": { "champion": "Ahri", "opponent": "Sylas", "position": "MIDDLE" }
  }
}
```

`yourMatchup` is the caller's own champion against the enemy in their inferred lane, ready for
`/tools/matchup`. It is null when the lane is unopposed or the champion couldn't be placed. It
depends on the lane inference more than `draft` does — a wrong lane there is one champion in the
wrong row, here it names the wrong opponent — so consumers must let the player correct it.

**Response 200 (not in a game):**
```json
{ "data": { "inGame": false } }
```

---

## Live Draft Room (TASK-300)

Seven public, login-free endpoints behind the draft room. See `docs/DRAFT_ROOM.md`
for the feature and ADR-016 for why `GET` is polled rather than streamed.

**Authorisation is by capability token, not by session.** A series mints
`blueToken` and `redToken`; whoever presents one may act for that side. Everyone
else is a spectator. `GET` resolves the caller's role from the token and returns
that role — it never returns either token, so a screenshot of a poll response
cannot hand anyone a drafter seat.

Every response carries `Cache-Control: no-store`. Freshness is the whole point.

**Rate limits (per IP):** create `5 / 10 min` · mutations `60 / min` ·
`GET` `240 / min` (the 1 Hz poll plus headroom for a few tabs behind one NAT).

**Status codes:** `422` failed validation · `403` no drafter token · `404` unknown
code or game · `409` the engine refused, with the reason verbatim in
`error.message` (`not-your-turn`, `already-used`, `series-locked`, `disabled`,
`unknown-champion`, `draft-not-running`, `not-in-lobby`, `nothing-to-undo`,
`not-complete`, `version-conflict`).

A `version-conflict` means someone else advanced the game first. The client
resolves it by re-reading, not by retrying the write.

### `POST /api/draft`

Creates a series and all its games. No auth; a signed-in creator is recorded so
the series can be listed on their profile later, but a session is never required.

**Body** (every field optional, defaults shown):
```json
{
  "team1Name": "Team 1",
  "team2Name": "Team 2",
  "mode": "NORMAL",
  "gameCount": 1,
  "timerSeconds": 30,
  "disabledChampions": []
}
```
`mode` is `NORMAL` | `FEARLESS` | `TEAM_FEARLESS`. `gameCount` is 1–5.
`timerSeconds` is `0` (untimed) or 15–120.

**Response 201:**
```json
{ "data": { "code": "gk4mp2rn", "blueToken": "…32 hex…", "redToken": "…32 hex…" } }
```

### `GET /api/draft/[code]?game=N&token=T`

The poll target. `game` defaults to 1; `token` may be omitted to read as a
spectator.

**This read can write.** An expired turn is settled here, which is what lets a
lapsed turn resolve with neither drafter at their keyboard (ADR-016 §6).

**Response 200:**
```json
{
  "data": {
    "role": "BLUE",
    "state": {
      "code": "gk4mp2rn",
      "team1Name": "Team 1",
      "team2Name": "Team 2",
      "mode": "FEARLESS",
      "gameCount": 3,
      "timerSeconds": 30,
      "disabledChampions": [],
      "games": [
        {
          "gameNumber": 1,
          "blueTeam": 1,
          "phase": "IN_PROGRESS",
          "step": 7,
          "blueReady": true,
          "redReady": true,
          "turnStartedAt": "2026-08-15T12:00:00.000Z",
          "winnerSide": null,
          "version": 8,
          "actions": [
            { "step": 0, "side": "BLUE", "kind": "BAN", "championKey": "Ahri", "timedOut": false }
          ]
        }
      ]
    }
  }
}
```

Clients re-render only when `state.games[n].version` changes, and derive the
countdown locally from `turnStartedAt + timerSeconds` rather than polling for it.

### `GET /api/draft/champions`

The champion catalogue for a room: name, the lanes each champion is actually
played in this patch, and their win/pick/ban rates. Fetched once when a room
opens and held for the whole series, which is what keeps a live draft free of
per-turn requests — the lane filter and the advice panel both read this payload.

Lanes come from the patch's play data, not from Data Dragon's `tags`; those are
class labels (Mage, Tank), not positions. A champion is listed in its main lane
plus any lane seeing at least a fifth of that lane's games.

Cached `public, s-maxage=3600, stale-while-revalidate=86400` — it only changes on
a patch. Rate limited `30 / min` per IP.

```json
{
  "data": {
    "patch": "16.16",
    "champions": [
      { "key": "Ahri", "name": "Ahri", "lanes": ["MIDDLE"], "winRate": 51.2, "pickRate": 8.4, "banRate": 3.1 }
    ]
  }
}
```

### `GET /api/draft/counters?keys=Ahri,Zed`

Head-to-head win rates for the champions already locked in a draft. Shipping the
whole matrix would be roughly 170 x 170 numbers; the room only ever needs the ten
rows belonging to champions on the board, so this is called once per lock — at
most ten times in a game, never on the clock. Capped at ten keys.

`vs[opponent]` is the subject champion's win rate against that opponent, keyed by
lowercase Data Dragon id. A champion with no matchup sample is absent rather than
recorded as 50%.

```json
{ "data": { "ahri": { "lane": "MIDDLE", "vs": { "zed": 47.2, "yasuo": 51.1 } } } }
```

Cached `public, s-maxage=3600`. Rate limited `60 / min` per IP.

### `GET /api/draft/[code]/summary?game=N`

The verdict for a **finished** game: both comps keyed by lane, plus the output of
the same `evaluateDraft` the standalone analyser uses. Answers `404` while a game
is still running, which is what makes it safe to cache — a live draft's comps
never leave the room.

Lanes are inferred from the picks (a draft never states them), least-flexible
champion first so a one-lane pick is never stranded.

Cached `public, s-maxage=300`. Rate limited `30 / min` per IP.

### `POST /api/draft/[code]/ready`

`{ "token": "…", "gameNumber": 1, "ready": true }` — the draft starts the moment
both sides are ready.

### `POST /api/draft/[code]/action`

`{ "token": "…", "gameNumber": 1, "championKey": "Ahri" }` — locks the current
ban or pick. `championKey: null` passes a ban; on a pick step it is rejected.

### `POST /api/draft/[code]/undo`

`{ "token": "…", "gameNumber": 1 }` — steps back one action and hands the turn
back. The champion returns to the pool.

### `POST /api/draft/[code]/result`

`{ "token": "…", "gameNumber": 1, "winnerSide": "BLUE" }` — records the winner of
a completed game. Idempotent.

### `POST /api/draft/[code]/side`

`{ "token": "…", "gameNumber": 2, "blueTeam": 2 }` — seats a team on blue before
the ready check. Blue always acts first in the sequence, so this is how "first
selection" is expressed.

All five mutations answer with the same envelope as `GET`: the new state plus the
caller's role.

---

## Player Search (TASK-309)

### `GET /api/public/search`

Autocomplete over the player index (`player_index`, see
[ADR-017](./adr/ADR-017-player-search-index.md)). **No auth** — a visitor must be able to find
a player before they have an account, which is the point of the whole flow.

| Param | Required | Notes |
|---|---|---|
| `q` | yes | `Name` or `Name#TAG`, 1–64 chars. Fewer than 2 name characters returns an empty list rather than the whole index. |
| `region` | no | Platform id (`euw1`, `tr1`, …). Omit to search every platform. |
| `limit` | no | 1–20, default 8. |

```json
{
  "data": {
    "players": [
      {
        "puuid": "…",
        "gameName": "kaanproak0",
        "tagLine": "TR1",
        "region": "tr1",
        "profileIconId": 4361,
        "summonerLevel": 142
      }
    ]
  }
}
```

**Notes:**
- Rate limit is **150/min per IP**, far above the rest of the public surface: it answers from our
  own database on keystrokes, with no Riot call behind it. Throttling it like
  `/api/public/preview` would make autocomplete stop mid-word.
- `Cache-Control: private, max-age=15`. Private because a shared cache would hand one visitor
  another's freshly-typed query.
- `seenCount` and `lastSeenAt` rank the results server-side and are **not** in the response.
- A failing index answers `200` with an empty list, not a `500`. The client can still fall back to
  resolving an exact Riot ID against Riot, and a dead index must not break the search box.

---

## Duo Panel (TASK-312, TASK-313)

Both require a session and ownership of the account. Both answer `null` when the player has not
marked a duo — the panel renders its picker for that, so it is a state rather than an error.

### `GET /api/duo/synergy?riotAccountId=`

The pair's record together against the same player's record apart, plus champion pairings, role
pairings, per-game averages in each case, and the last five shared games.

```json
{
  "data": {
    "partner": { "gameName": "C0marKopter", "tagLine": "TR1", "games": 73, "winRate": 51 },
    "hasEnoughData": true,
    "together": { "games": 73, "wins": 37, "winRate": 51 },
    "apart":    { "games": 32, "wins": 22, "winRate": 69 },
    "synergyDelta": -18,
    "streak": -2,
    "championPairs": [{ "ownChampion": "Alistar", "partnerChampion": "Caitlyn", "games": 9, "winRate": 78 }],
    "rolePairs":     [{ "ownPosition": "UTILITY", "partnerPosition": "BOTTOM", "games": 25, "winRate": 52 }],
    "averagesTogether": { "kda": 3.63, "deaths": 5.8, "visionScore": 24.3, "csPerMinute": 4.3 },
    "averagesApart":    { "kda": 5.88, "deaths": 3.4, "visionScore": 18.4, "csPerMinute": 7.0 },
    "recentShared": []
  }
}
```

- `hasEnoughData` is false below five shared games. Clients **must not** print the figures when it
  is false: at four games one result moves the win rate 25 points.
- `synergyDelta` is `null`, not `0`, when either side has no games. Never having played apart is
  not the same as no difference.

### `GET /api/duo/quests?riotAccountId=`

This week's three duo quests with progress. Rate limit 60/hour.

```json
{
  "data": {
    "partner": { "gameName": "C0marKopter", "tagLine": "TR1" },
    "weekStart": "2026-08-10T00:00:00.000Z",
    "weekEnd": "2026-08-17T00:00:00.000Z",
    "quests": [
      { "key": "wins_together", "label": "Carry each other",
        "detail": "Win 3 games together this week",
        "progress": 3, "target": 3, "completed": true, "xpReward": 80,
        "periodEnd": "2026-08-17T00:00:00.000Z" }
    ],
    "xpAwarded": 80
  }
}
```

- **This GET writes.** It generates the week's rows, recomputes progress and pays XP for quests
  that have just completed. That is safe because the quest set is a pure function of the week and
  the unique index makes the write idempotent — `xpAwarded` is non-zero only on the read that
  actually completes a quest, and `0` on every read after.

---

## Following an esports team (TASK-313)

The only authenticated surface in the esports section, and the only one that
writes. Everything else there is a public cache over a feed (ADR-016).

### `GET /api/esports/follows`

The reader's followed teams, most recently followed first. Requires a session.

```json
{
  "data": {
    "follows": [
      {
        "teamId": "98767991866488695",
        "name": "Fnatic",
        "slug": "fnatic",
        "followedAt": "2026-08-17T09:00:00.000Z"
      }
    ],
    "limit": 20
  }
}
```

- **Answers without touching the feed.** `name` and `slug` are copies stored
  beside the follow, so the list renders with the feed unreachable and a follow
  outlives its team leaving the feed. Only 440 of 1175 active teams carry both a
  league and a roster, and that set moves between splits.
- `limit` is in the response because the button has to know when to stop
  offering, rather than discovering it from a 403.

### `POST /api/esports/follows`

| Field | Required | Notes |
|---|---|---|
| `slug` | yes | 1–120 chars. The team's slug — what the page the button sits on already has in its URL. |

Answers `{ "data": { "follow": … } }` with the same entry shape as above.

- **Idempotent.** Following a team already followed returns the original entry
  and its original `followedAt`, and writes nothing. A reader who double-clicks
  has not done anything wrong.
- **Takes a slug, stores an id.** Slugs are reused across 53 teams and
  resolution ranks candidates, so the row hangs on the feed's team id.
- `404` when the feed publishes no such team. `403` at the follow limit — a
  refusal, not a malformed request. `422` when the body carries no slug.

### `DELETE /api/esports/follows/[teamId]`

By **team id**, not slug: a reader has to be able to undo a follow whose team
has since dropped out of the feed, and resolving a slug first would make exactly
that case impossible.

```json
{ "data": { "removed": true } }
```

`removed` is `false` when there was nothing to delete. Still `200` — the reader
wanted it gone and it is gone, and a `404` would make a double-click look like a
failure.

---

## 13. Coach Marketplace Endpoints (LA-19 — see `docs/MARKETPLACE_PLAN.md`)

Human coaching sold by the session. Nothing under this heading calls an AI
provider or reads an AI table.

The identity rule these endpoints enforce, which is worth stating once: **there
is no coach role.** Being a coach is having an approved `coach_profiles` row, so
`/api/coaches/me` answers for any signed-in user and simply returns `null` when
they have never started one.

### `GET /api/coaches/me`

The caller's own coach profile.

```json
{ "data": { "profile": null } }
```

`profile` is `null` — not a `404` — when the user has never opened the
application form. "You are not a coach yet" is the answer the application page
is asking for, not a missing resource.

Otherwise `profile` carries the editable fields plus `status`
(`DRAFT|PENDING|APPROVED|REJECTED|SUSPENDED`), `slug`, `submittedAt`,
`reviewedAt` and `reviewNote`.

### `PUT /api/coaches/me`

Create or update it. Body: `displayName`, `headline`, `bio`, `languages[]`
(ISO 639-1), `regions[]`, `roles[]` (`Position`), `championIds[]`, `timezone`
(IANA).

- `409` while the profile is `PENDING` or `SUSPENDED`. A profile that can be
  edited under a reviewer is one where what gets approved is not what was read.
- `422` on a body that does not parse.

### `POST /api/coaches/me/apply`

Move the profile into review.

```json
{ "data": { "submitted": true } }
```

- `404` when there is no profile to submit.
- `409` when one is already `PENDING` or `APPROVED`.
- `403` when the profile is `SUSPENDED` — reapplying is not the way back.
- `422` when the profile is incomplete. The message is the *one* thing still
  missing, phrased for the applicant ("Write at least 120 characters about how
  you coach."), because a list of six problems is one nobody reads.

A `REJECTED` profile can be resubmitted, and doing so clears the previous
decision so a reviewer never sees last round's note attached to this one.

### `DELETE /api/coaches/me/apply`

Withdraw, while nobody has decided yet.

```json
{ "data": { "withdrawn": true } }
```

`false` when there was nothing pending. Still `200`, for the same reason
unfollowing something already gone is.

### `GET /api/admin/coaches?status=`

Admin only (`withAdminAuth`). The review queue for one status, defaulting to
`PENDING`, **oldest first** — nobody works a queue from the back.

```json
{ "data": { "applications": [ … ], "pending": 3 } }
```

`pending` is always the `PENDING` count whatever `status` was asked for, so it
can drive a nav badge without a second request. Each application carries the
account's email and its `rankProofs`, which are the substance of the review: a
`PLATFORM_CHECKED` proof is a rank we read from Riot ourselves.

### `PATCH /api/admin/coaches/[coachProfileId]`

Admin only. One decision, as a discriminated union:

| `decision` | From | Note |
|---|---|---|
| `approve` | `PENDING` | — |
| `reject` | `PENDING` | required, 10–1000 chars |
| `suspend` | `APPROVED` | required, 10–1000 chars |
| `reinstate` | `SUSPENDED` | required, 10–1000 chars |

```json
{ "data": { "decided": "approve", "slug": "rekkles" } }
```

- The note is **required** on everything but approval. Being told nothing is the
  complaint every rejected applicant on every competing platform has, and it is
  also the only thing that makes a second application worth reading.
- The slug is assigned here and nowhere else — at approval rather than at
  signup, so a rejected application never burns a name and nobody reserves an
  impersonating URL by filling in a form. A coach approved once keeps the slug
  they already had.
- Every decision writes an `audit_logs` row naming the admin.
- `404` on an unknown id, `409` when the coach is not in a state that decision
  applies to, `422` on a missing or too-short note.

### `GET /api/coaches/me/rank`

The caller's rank badge and the linked accounts it could be read from, in one
request — a picker with no current state beside it cannot tell a coach whether
pressing anything would change something.

```json
{
  "data": {
    "badge": {
      "method": "PLATFORM_CHECKED",
      "tier": "GOLD", "division": "II", "leaguePoints": 71,
      "peakTier": "GOLD", "peakDivision": "II",
      "checkedAt": "2026-08-17T19:22:13.684Z",
      "stale": false
    },
    "accounts": [
      { "id": "…", "gameName": "kaanproak0", "tagLine": "TR1", "region": "tr1", "isBadgeSource": true }
    ]
  }
}
```

`badge` is `null` until a rank has been checked. `stale` is derived at read time
from a stored `staleAt` (36 hours), so it is a fact about now rather than about
the row.

### `POST /api/coaches/me/rank`

Read the rank off one of the caller's linked accounts and record it as their
badge. Body: `{ "riotAccountId": "<uuid>" }`.

**The coach picks the account and cannot supply a rank.** That asymmetry is the
whole feature — every competitor lets the coach type the number into a bio.

- The rank is read from `ranked_history`, our own record of what Riot returned,
  so this costs no extra Riot call and asserts nothing the product was not
  already reading.
- `403 RIOT_ACCOUNT_NOT_OWNED` when the account is not the caller's — a coach
  must not be able to hang a badge on somebody else's account by guessing an id.
- `409` when no ranked snapshot has been synced for that account yet. The answer
  is to sync it, not to let them assert one.
- `404` when the caller has no coach profile.

**What the badge does and does not claim.** `PLATFORM_CHECKED` means we read
this rank ourselves on that date. It does **not** mean the account was proven to
belong to that person — that is `RIOT_VERIFIED`, which needs Riot Sign-On and an
invitation we do not have (ADR-023). The UI labels the two differently and never
shows the stronger wording for the weaker proof.

### `GET /api/coaches/me/listings`

Everything the caller sells, **active or not** — this is the management view.

```json
{ "data": { "listings": [ { "id": "…", "kind": "VOD_REVIEW", "title": "…", "durationMinutes": 60,
  "priceCents": 3000, "currency": "USD", "deliveryHours": 48, "isActive": true } ] } }
```

Returns an empty list, not a `404`, for a user with no coach profile.

### `POST /api/coaches/me/listings`

Add one. Body: `kind` (`VOD_REVIEW|LIVE_SESSION|LIVE_SPECTATE`), `title`,
`description`, `durationMinutes`, `priceCents`, `currency` (ISO 4217,
uppercased), `deliveryHours`.

- **Listings may be prepared before approval.** The storefront filters on the
  profile's status, so nothing leaks by letting a coach get ready while they
  wait.
- `deliveryHours` is **nulled** for the scheduled kinds rather than stored. A
  live session has a calendar slot, not a promised turnaround, and keeping a
  number there would be a promise nothing could be measured against.
- An async review **must** carry a turnaround — that is the only thing a late
  delivery can be judged against.
- `422` on a price or length outside the bounds in `policy.ts`, with the message
  naming which.
- New listings are appended to the coach's own ordering, where they cannot
  displace anything.

### `PATCH /api/coaches/me/listings/[listingId]`

Takes **either** a full listing body **or** just `{ "isActive": boolean }` —
the on-sale switch is one click in the UI and should not have to round-trip a
whole listing to work.

Both forms are scoped to the caller's own profile in the same statement, so a
guessed id belonging to another coach updates nothing rather than updating
theirs. `404` when nothing matched.

### `DELETE /api/coaches/me/listings/[listingId]`

- `409` once anything has been booked against it, with a message pointing at
  "take off sale" instead. The booking snapshots its own price and terms, but
  the listing row is what tells a dispute what was actually being sold.
- `404` when the listing is not the caller's.

### `GET /api/coaches/me/availability`

The caller's weekly hours, their date exceptions, and the IANA zone all of it
is written in.

```json
{ "data": { "timeZone": "Europe/Istanbul",
  "rules": [ { "id": "…", "days": [1,2,3,4,5], "startMinute": 1080, "endMinute": 1260 } ],
  "exceptions": [ { "id": "…", "date": "2026-09-03", "isBlocked": true, "startMinute": null, "endMinute": null, "note": null } ] } }
```

Minutes since local midnight, **not** instants. A weekly rule is wall-clock
time in the coach's own zone; resolving it to a UTC instant is a read-time job
done per calendar day, because collapsing it to one fixed offset is exactly
what breaks on the day the clocks move (ADR-022).

### `PUT /api/coaches/me/availability`

Replace the whole weekly schedule: `{ "rules": [ { days, startMinute, endMinute } ] }`.

**Replaced, not patched.** A schedule is read as a set, and a partial update
leaves behind a window nobody meant to keep. Applied in one transaction, so a
failed save cannot leave a coach with no hours at all. Answers with the new
state, so the client needs no second request.

`422` when a row has no days, when hours fall outside a single day, or when the
finish is not after the start — a window crossing midnight has to be two rows,
and accepting one silently produces no hours.

### `POST /api/coaches/me/availability/exceptions`

One date that does not follow the weekly rules:
`{ date: "YYYY-MM-DD", isBlocked, startMinute, endMinute }`.

An exception **replaces** that day rather than adding to it, which is what lets
one concept express both "closed on the 3rd" and "open this Sunday for once".
Keyed by date, so saving twice is one row.

### `DELETE /api/coaches/me/availability/exceptions?date=YYYY-MM-DD`

Puts the day back on the weekly rules. Both exception endpoints answer with the
whole availability view.

### `GET /api/coaches/[slug]/slots?listingId=&days=`

**Public.** A student has to see when a coach is free before deciding to sign
up, so this answers without a session. Rate limited at 60/min per IP — it is a
computed answer over a month of calendar, not a table lookup.

```json
{ "data": { "slots": [ { "start": "2026-08-18T15:00:00.000Z", "end": "2026-08-18T16:00:00.000Z" } ],
  "timeZone": "Europe/Istanbul", "durationMinutes": 60 } }
```

- **The listing decides the length.** A request cannot ask for a 15-minute slot
  on a 60-minute product.
- **A `VOD_REVIEW` listing returns an empty list**, and that is the right
  answer rather than a missing one: an async review runs against a deadline and
  has no calendar at all.
- **Pending requests block time the same as confirmed ones.** The coach has 48
  hours to answer, and offering that hour to somebody else meanwhile is a
  double booking waiting for the coach to accept both.
- Nothing is cached: a slot list goes stale the moment anybody books, and
  serving a slot that has just gone is how two students end up holding the same
  hour.
- `404` for an unknown coach or listing, `422` without a listing id.
---

## Academy (LA-21)

The Academy's read side is entirely server-rendered — lessons, tracks and the hub are
public pages, not endpoints. Only progress is written over HTTP.

### `POST /api/academy/progress`

One endpoint, two actions, discriminated on `action`. Auth required; anonymous readers
can read and drill, they simply have nowhere to record it.

```jsonc
// Mark a lesson opened. Never demotes a lesson that is already finished.
{ "action": "open", "lessonId": "laning/wave-states" }

// Grade an attempt and store it.
{
  "action": "submit",
  "lessonId": "laning/wave-states",
  "attempts": [
    { "drillId": "wave-state-quiz", "answer": ["a"] },
    { "drillId": "wave-state-decision", "answer": ["a"] }
  ]
}
```

`answer` is an array because an `order` drill answers with a sequence; `quiz` and
`decision` send a single option id.

Response for `submit`:

```jsonc
{
  "data": {
    "score": { "results": [...], "correct": 2, "total": 2, "score": 100, "passed": true },
    "progress": { "lessonId": "…", "status": "completed", "attempts": 1, "bestScore": 100, "completedAt": "…" }
  }
}
```

- **Grading respects the pro gate.** The server scores against
  `visibleDrills(lesson, hasPro)`, not the whole lesson — failing a free reader for drills
  they were never shown would be a bug, not a paywall.
- **`404 NOT_FOUND` for an unknown `lessonId`.** The curriculum is code (ADR-025), so an id
  that does not resolve is a client sending something we never published.
- **`completed` is the ceiling this endpoint can set.** `mastered` is earned from real match
  data, so a lesson already mastered stays mastered no matter what a later attempt scores.

### `POST /api/bookings`

Request a session. Body: `listingId`, `startTime` (ISO, null for the async
kind), `studentGoal`, `studentTimezone`, `riotAccountId`, `matchIds[]`,
`vodUrl`.

Creates a **request**, not a confirmed session — the coach has 48 hours
(`respondByAt`) to accept or decline, and nothing is charged.

- The whole thing runs under an advisory lock on the coach, because checking a
  slot is free and taking it are two statements. Without it, two students both
  read "free" and both insert, and the coach wakes up double-booked with no way
  to tell which request was first.
- The economics are **snapshotted** onto the row — price, commission, fee, the
  coach's share and the cancellation window. A coach raising their rate later
  must not rewrite what this session was worth.
- Both timezones are captured, so a rescheduling email can name the hour each
  side actually saw.
- `409` when the slot went between the page loading and the request, with a
  message telling the client to refresh rather than retry.
- `403` on booking your own listing — it would settle money in a circle and
  pollute the coach's own review count.
- `422` for a scheduled kind with no time, or an async kind with neither a match
  id nor a video link (a review with nothing to review is a session the coach
  cannot start).

### `GET /api/bookings?as=student|coach`

The caller's own bookings on one side. Scoped in the query, never filtered
afterwards. The coach's view carries the student's **name and not their email**:
a coach needs to know who they are talking to, not how to reach them off the
platform.

### `GET /api/bookings/[bookingId]`

One booking and **its whole history** — every transition, with who made it and
why. Both sides see the same record, which is what a dispute is settled
against.

### `PATCH /api/bookings/[bookingId]`

One move: `accept` (+ optional `meetingUrl`), `decline`, `cancel`, `deliver`,
`confirm`.

Who may do what is established **from the row**, never from the request, and
the move itself is checked against the state machine in `transitions.ts`.

| Refusal | Meaning |
|---|---|
| `404` | No such booking — **and** what a stranger probing ids gets, so one cannot be told from the other |
| `403` | Not your side of this booking |
| `409 too late` | A student cancelling inside the window they agreed to |
| `409 stale` | It already moved; the update is guarded on the status that was read, so two requests racing to accept cannot both win |

A coach may always cancel. The session cannot happen without them and refusing
just produces a no-show instead — it is recorded as *their* cancellation, which
is what an automatic refund keys off.

`deliver` settles nothing: it starts the window the student can challenge it in
(`autoCompleteAt`).

### Payments (M8)

There is no payment endpoint, and that is the design. The ledger is opened in
the same transaction as the booking and settled by whatever status the booking
reaches — so a booking without a payment row is a bug rather than a state, and
the money and the booking can never disagree about what happened.

`GET /api/bookings/[bookingId]` carries the ledger as `payment`:

```json
{ "provider": "manual", "status": "HELD", "amountCents": 4500,
  "platformFeeCents": 900, "coachAmountCents": 3600, "currency": "USD",
  "capturedAt": "…", "releasedAt": null, "refundedAt": null }
```

| Booking reaches | Money becomes |
|---|---|
| `PENDING_COACH`, `CONFIRMED`, `DELIVERED`, `DISPUTED` | stays `HELD` |
| `COMPLETED` | `RELEASED` |
| `DECLINED`, `EXPIRED`, either cancellation, `REFUNDED` | `REFUNDED` |

**No money moves.** The only driver is `manual`, which advances these states
and settles nothing, and the session page says so in as many words rather than
letting a student believe they have been charged. Adding Stripe is a driver
registration, not an edit: the provider interface is four verbs that map
directly onto a destination charge with an `application_fee_amount`, a manual
payout schedule for the hold, `Payout.create` for the release and
`Refund.create({ reverse_transfer: true, refund_application_fee: true })` for
the return. See ADR-020.
