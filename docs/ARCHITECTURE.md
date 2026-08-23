# System Architecture — LoL AI Coach

**Version:** 1.0  
**Status:** Draft

---

## 1. Architectural Philosophy

The system is designed around three core principles:

1. **Feature cohesion over technical layering** — code is organized by domain feature, not technical concern, enabling teams to own vertical slices independently.
2. **AI as a first-class citizen** — the AI pipeline is not bolted on; it is a dedicated, cached, provider-abstracted subsystem.
3. **Incremental scalability** — the initial architecture runs as a monolith on Vercel/Neon but is explicitly designed for extraction into microservices without rewrites.

---

## 2. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│         Next.js App (SSR + CSR, TypeScript, TailwindCSS)        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                       API LAYER                                 │
│              Next.js API Routes (REST, typed)                   │
│     Auth Middleware │ Rate Limiter │ Request Validator           │
└─────┬──────────────────────┬──────────────────────┬─────────────┘
      │                      │                      │
┌─────▼──────┐    ┌──────────▼──────────┐  ┌───────▼────────────┐
│  Auth      │    │   Business Logic     │  │   AI Pipeline      │
│  Service   │    │   (Domain Services)  │  │   (Analysis Layer) │
│ NextAuth/  │    │                      │  │                    │
│ BetterAuth │    │  MatchService        │  │  PromptBuilder     │
└─────┬──────┘    │  AnalysisService     │  │  AIClient          │
      │           │  CoachingService     │  │  ReportAssembler   │
      │           │  RiotService         │  │  CacheLayer        │
      │           └──────────┬───────────┘  └───────┬────────────┘
      │                      │                      │
┌─────▼──────────────────────▼──────────────────────▼────────────┐
│                      DATA LAYER                                 │
│              PostgreSQL (via Prisma ORM)                        │
│         Redis (caching) │ Object Storage (reports, assets)      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                         │
│   Riot Games API │ OpenAI API │ Anthropic API │ LemonSqueezy  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture

### 3.1 Technology

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS + shadcn/ui component primitives
- **State:** Zustand (client state) + TanStack Query (server state)
- **Forms:** React Hook Form + Zod

### 3.2 Rendering Strategy

| Page Type           | Strategy                              | Rationale           |
| ------------------- | ------------------------------------- | ------------------- |
| Marketing / Landing | Static (SSG)                          | SEO, performance    |
| Dashboard           | Server Component + Client hydration   | Fast initial load   |
| Match History       | SSR with streaming                    | Large data sets     |
| AI Reports          | Client-side fetch with loading states | Real-time feel      |
| Settings            | Client-side                           | Low SEO requirement |

### 3.3 Key Frontend Domains

```
app/
├── (auth)/          → Login, register, OAuth callback
├── (marketing)/     → Landing, pricing, about
├── dashboard/       → Authenticated user hub
├── analysis/        → Match and champion analysis views
├── coaching/        → AI coaching reports
├── champion-pool/   → Champion pool management
├── roadmap/         → Climb roadmap & training plans
└── settings/        → Account, subscription, preferences
```

---

## 4. Backend Architecture

### 4.1 API Layer (Next.js API Routes)

All API routes follow a consistent pattern:

```
Request → Auth Middleware → Validation → Service Layer → Response
```

Routes are organized under `app/api/` and grouped by domain. Each route file is thin — it validates input, delegates to a service, and returns a typed response.

### 4.2 Service Layer (Domain Services)

Services contain all business logic. They are plain TypeScript classes/functions (no framework coupling).

| Service               | Responsibility                                            |
| --------------------- | --------------------------------------------------------- |
| `RiotService`         | Riot API calls, rate limit management, data normalization |
| `MatchService`        | Match data persistence, retrieval, aggregation            |
| `AnalysisService`     | Statistical analysis, performance metric calculation      |
| `CoachingService`     | Orchestrates AI pipeline, generates coaching reports      |
| `ChampionService`     | Champion pool management, role analysis                   |
| `UserService`         | User profile, preferences, account management             |
| `SubscriptionService` | LemonSqueezy integration, plan management, access gating  |
| `NotificationService` | In-app and email notifications                            |

### 4.3 Data Access Layer (Prisma)

All database access goes through Prisma. No raw SQL in services. Complex queries use Prisma's fluent API or typed raw queries with `prisma.$queryRaw`.

### 4.4 Queue System (Phase 2+)

Heavy analysis tasks (full session review, bulk match processing) will be offloaded to a background queue (BullMQ on Redis) to prevent API timeouts and enable async processing.

---

## 5. AI Pipeline Architecture

The AI pipeline is the product's core differentiator. It is designed as a standalone subsystem.

```
Riot Match Data (raw JSON)
        │
        ▼
┌──────────────────┐
│  Data Normalizer │  → Standardize, clean, add context
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Context Builder │  → Player history, rank, champion proficiency
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Prompt Builder  │  → Structured prompt with role, instructions, data
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  AI Client       │  → Provider-abstracted (OpenAI / Anthropic / etc.)
│  (with cache)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Response Parser │  → Extract structured insights, validate, sanitize
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Report Assembler │  → Combine AI insights + stats → final report
└──────────────────┘
```

See `AI_ARCHITECTURE.md` for full detail.

---

## 6. Domain-Driven Design Approach

The system is organized around five bounded contexts:

### Context 1: Identity & Access

- User accounts, authentication, authorization, subscription state
- Owns: `User`, `Subscription`, `Session`

### Context 2: Riot Integration

- Riot account linking, API data fetching, match ingestion
- Owns: `RiotAccount`, `Match`, `MatchParticipant`

### Context 3: Analysis

- Statistical calculations, performance metrics, trend detection
- Owns: `PerformanceSnapshot`, `ChampionStats`, `RankedHistory`

### Context 4: AI Coaching

- Prompt construction, AI calls, report generation, coaching plans
- Owns: `CoachingReport`, `AIAnalysis`, `TrainingPlan`

### Context 5: Champion Intelligence

- Champion pool management, meta data, counter-pick database
- Owns: `Champion`, `CounterData`, `ChampionPoolRecommendation`

Each context maps to a folder in `src/domains/`. No cross-context imports except through defined interfaces.

---

## 7. Data Flow: Core User Journey

```
User connects Riot Account
        │
        ▼
RiotService.fetchAccount()
  → Validate Riot ID
  → Fetch Summoner data
  → Persist RiotAccount record
        │
        ▼
RiotService.syncMatches()
  → Fetch last N match IDs
  → For each new match: fetch full match detail
  → Normalize data
  → Persist Match + MatchParticipant records
        │
        ▼
AnalysisService.computePerformance()
  → Aggregate stats per champion
  → Calculate KDA trends, CS trends, vision trends
  → Detect anomalies (death spikes, etc.)
  → Persist PerformanceSnapshot
        │
        ▼
CoachingService.generateReport()
  → Pull performance context
  → Build prompt (PromptBuilder)
  → Call AI (AIClient, with cache check)
  → Parse response (ResponseParser)
  → Persist CoachingReport + AIAnalysis
        │
        ▼
User views CoachingReport in dashboard
```

---

## 8. Caching Strategy

| Layer                 | Cache Type                     | TTL       | Content                      |
| --------------------- | ------------------------------ | --------- | ---------------------------- |
| Riot API responses    | Redis                          | 5 min     | Raw match data, account info |
| Computed stats        | PostgreSQL (materialized view) | On sync   | Aggregated champion stats    |
| AI reports            | PostgreSQL                     | 24 hours  | Full coaching reports        |
| AI prompt responses   | Redis                          | 24 hours  | Deduplicated by content hash |
| Next.js static assets | CDN (Vercel)                   | Permanent | JS, CSS bundles              |
| Match list page       | Next.js unstable_cache         | 5 min     | Server component data        |

---

## 9. Security Architecture

### 9.1 Authentication

- Session-based auth via NextAuth/BetterAuth
- JWT for API route authorization
- Riot OAuth for account connection (not credential storage)
- API keys stored as environment variables, never in code or database

### 9.2 Authorization

- Role-based access: `user`, `admin`
- Subscription tier gates enforced at middleware level
- Users can only access their own data (row-level security enforced in services)

### 9.3 API Security

- Rate limiting on all public endpoints (per-IP + per-user)
- Input validation with Zod on all endpoints
- SQL injection impossible via Prisma parameterized queries
- XSS protection: no dangerouslySetInnerHTML, CSP headers
- CSRF: SameSite cookies + origin validation

### 9.4 Data Privacy

- Riot data stored per user, not shared
- AI analysis inputs are anonymized before sending to third-party providers
- Users can request data deletion (GDPR compliance path)

---

## 10. Scalability Plan

### Phase 1 (0–10K users) — Monolith on Vercel

- Single Next.js app
- Neon PostgreSQL (serverless)
- Vercel Functions for API routes
- Upstash Redis for caching

### Phase 2 (10K–100K users) — Extracted Services

- Separate long-running processes for:
  - Match sync worker
  - AI report generation queue
- Dedicated PostgreSQL instance (Railway / Supabase / RDS)
- Redis cluster for queuing

### Phase 3 (100K+ users) — Microservice-Ready

- Extract AI pipeline as standalone service with own API
- Extract Riot ingestion as dedicated worker service
- Introduce read replicas for analytics queries
- CDN for static assets and report PDFs

---

## 11. Microservice Migration Path

The monolith is structured so that each domain service can be extracted with minimal friction:

1. **Step 1:** Each domain service is already isolated with no circular dependencies.
2. **Step 2:** Services communicate via internal function calls today → replace with HTTP/gRPC calls when extracted.
3. **Step 3:** Shared database → per-service database with event-based sync (change data capture).
4. **Step 4:** Introduce API gateway (Nginx / Kong) for routing and rate limiting.

Extraction order (by independence and load):

1. `RiotService` (high load, external dependency)
2. `CoachingService` / AI Pipeline (expensive, cacheable)
3. `AnalysisService` (CPU-bound computations)

---

## 12. Infrastructure & Deployment

| Component      | MVP Choice                | Scale Choice              |
| -------------- | ------------------------- | ------------------------- |
| Frontend + API | Vercel                    | Vercel / self-hosted      |
| Database       | Neon (serverless PG)      | Supabase / AWS RDS        |
| Cache / Queue  | Upstash Redis             | Redis Cloud / self-hosted |
| File Storage   | Vercel Blob               | AWS S3                    |
| Email          | Resend                    | Resend / AWS SES          |
| Monitoring     | Vercel Analytics + Sentry | Datadog / Grafana stack   |
| CI/CD          | GitHub Actions            | GitHub Actions            |
