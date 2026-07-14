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

**Removed** (previously AI-powered, now deleted): `GET /api/counter`,
`POST /api/matchup/analyze`, `POST /api/draft/analyze`.

**Redirects (308):** `/counter → /tools/counter-picker`, `/matchup → /tools/matchup`,
`/draft → /tools/draft-analyzer` (see `next.config.mjs`).

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
