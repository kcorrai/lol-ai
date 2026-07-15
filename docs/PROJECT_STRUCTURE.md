# Project Structure — LoL AI Coach

**Version:** 1.0

This document defines the canonical folder structure. Every file in this project belongs in one of these locations. If you are unsure where something goes, this document is the authority.

---

## Top-Level Structure

```
lol-ai/
├── app/                        → Next.js App Router (pages, layouts, API routes)
├── src/                        → All application source code
│   ├── domains/                → Domain-driven feature modules
│   ├── components/             → Shared UI components
│   ├── lib/                    → Shared utilities and integrations
│   ├── hooks/                  → Shared React hooks
│   ├── types/                  → Shared TypeScript types
│   └── styles/                 → Global styles
├── prisma/                     → Database schema, migrations, seed
├── docs/                       → All project documentation
│   ├── tasks/                  → Task files (TASK-XXX.md)
│   └── adr/                    → Architecture Decision Records
├── tests/                      → E2E and integration tests
├── public/                     → Static assets
├── .env.example                → Environment variable template
├── CLAUDE.md                   → Project rules for AI-assisted development
└── docker-compose.yml          → Local development services
```

---

## `/app` — Next.js App Router

```
app/
├── (marketing)/                → Public marketing pages
│   ├── page.tsx                → Landing page (3D hero, live meta, real screenshots)
│   ├── pricing/page.tsx        → Pricing page
│   └── layout.tsx              → Marketing layout
│
├── (tools)/                    → Public, no-login free tools (marketing chrome)
│   ├── tools/                  → hub + counter-picker / matchup / draft-analyzer / tier-list
│   │   └── tier-list/[role]/   → top/jungle/mid/bot/support role hubs (+ ?tier= filter)
│   ├── counters/[champion]/    → ~170 programmatic SEO counter pages (curve, trend, tips)
│   ├── builds/[champion]/[role]→ champion build pages (runes/items/skills/curves)
│   ├── matchups/[slug]/        → champion-vs-champion pages (alphabetical canonical)
│   ├── aram/                   → aram/tier-list + aram/[champion] build pages
│   ├── meta/                   → patch "Winners & Losers" report
│   └── layout.tsx
│
├── (auth)/                     → Authentication pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── callback/riot/page.tsx  → Riot OAuth callback
│   └── layout.tsx
│
├── (app)/                      → Authenticated app shell
│   ├── layout.tsx              → App shell layout (sidebar, topbar)
│   ├── dashboard/
│   │   └── page.tsx            → User dashboard home
│   ├── matches/
│   │   ├── page.tsx            → Match history list
│   │   └── [matchId]/page.tsx  → Single match detail
│   ├── coaching/
│   │   ├── page.tsx            → Coaching reports list
│   │   └── [reportId]/page.tsx → Single coaching report
│   ├── champions/
│   │   ├── page.tsx            → Champion pool overview
│   │   └── [championId]/page.tsx
│   ├── roadmap/
│   │   └── page.tsx            → Climb roadmap
│   ├── counter/
│   │   └── page.tsx            → Counter Pick Generator
│   ├── matchup/
│   │   └── page.tsx            → Matchup AI Coach
│   ├── otp/
│   │   └── page.tsx            → OTP Assistant
│   ├── draft/
│   │   └── page.tsx            → Draft Analyzer
│   └── settings/
│       ├── page.tsx            → General settings
│       ├── accounts/page.tsx   → Riot account management
│       └── subscription/page.tsx
│
└── api/                        → API Routes
    ├── auth/[...nextauth]/
    ├── riot/
    │   ├── connect/route.ts
    │   └── sync/route.ts
    ├── matches/
    │   ├── route.ts
    │   └── [matchId]/route.ts
    ├── coaching/
    │   ├── route.ts
    │   ├── [reportId]/route.ts
    │   └── generate/route.ts
    ├── champions/
    │   └── route.ts
    ├── analysis/
    │   └── route.ts
    └── webhooks/
        └── lemonsqueezy/route.ts
```

---

## `/src/domains` — Domain Modules

Each domain is a self-contained feature slice. The domain owns its own services, types, and (optionally) its own React components.

```
src/domains/
├── meta/                       → Zero-cost, patch-current champion meta stats
│   ├── services/
│   │   ├── metaStatsService.ts → OP.GG feed fetch + cache (snapshot & per-lane counters)
│   │   ├── counterService.ts   → best/worst matchups per lane
│   │   ├── matchupService.ts   → head-to-head win rate + lane tips
│   │   ├── draftEvalService.ts → deterministic 5v5 comp scoring
│   │   └── tierListService.ts  → per-lane tier list
│   ├── components/             → shared meta UI (ChampionCombobox, CounterResults)
│   ├── positions.ts, types.ts
│   └── index.ts                → Public API (powers the app/(tools)/ route group)
│
├── identity/                   → User accounts, auth, subscriptions
│   ├── services/
│   │   ├── userService.ts
│   │   └── subscriptionService.ts
│   ├── repositories/
│   │   └── userRepository.ts
│   ├── types/
│   │   └── identity.types.ts
│   └── index.ts                → Public API of this domain
│
├── riot/                       → Riot API integration
│   ├── services/
│   │   ├── riotApiClient.ts    → Raw Riot API HTTP client
│   │   ├── accountService.ts   → Riot account management
│   │   └── matchSyncService.ts → Match data ingestion
│   ├── mappers/
│   │   └── matchMapper.ts      → Raw API → domain model
│   ├── types/
│   │   └── riot.types.ts       → Riot API response shapes
│   └── index.ts
│
├── analysis/                   → Performance calculations
│   ├── services/
│   │   ├── matchAnalysisService.ts
│   │   ├── championStatsService.ts
│   │   └── trendDetectionService.ts
│   ├── calculators/
│   │   ├── kdaCalculator.ts
│   │   ├── csCalculator.ts
│   │   └── visionCalculator.ts
│   ├── types/
│   │   └── analysis.types.ts
│   └── index.ts
│
├── coaching/                   → AI coaching pipeline
│   ├── services/
│   │   ├── coachingService.ts  → Orchestrator
│   │   └── reportService.ts    → Report CRUD
│   ├── pipeline/
│   │   ├── dataPreparator.ts   → Cleans and structures data for AI
│   │   ├── promptBuilder.ts    → Constructs AI prompts
│   │   ├── aiClient.ts         → Provider-abstracted AI caller
│   │   ├── responseParser.ts   → Parses and validates AI output
│   │   └── reportAssembler.ts  → Combines AI + stats into report
│   ├── prompts/
│   │   ├── sessionReview.prompt.ts
│   │   ├── championCoach.prompt.ts
│   │   └── climbRoadmap.prompt.ts
│   ├── types/
│   │   └── coaching.types.ts
│   └── index.ts
│
├── champions/                  → Champion pool management
│   ├── services/
│   │   ├── championPoolService.ts
│   │   └── counterPickService.ts
│   ├── types/
│   │   └── champion.types.ts
│   └── index.ts
│
├── counter/                    → Counter Pick Generator (F3)
│   ├── services/
│   │   └── generalCounterService.ts
│   ├── prompts/
│   │   └── counterPrompt.ts
│   ├── types/
│   │   └── counter.types.ts
│   ├── components/
│   │   ├── CounterCard.tsx
│   │   ├── CounterList.tsx
│   │   └── CounterPageSkeleton.tsx
│   └── index.ts
│
├── matchup/                    → Matchup AI Coach (F1)
│   ├── services/
│   │   └── matchupAnalysisService.ts
│   ├── types/
│   │   └── matchup.types.ts
│   ├── components/
│   │   ├── MatchupSection.tsx
│   │   └── MatchupSkeleton.tsx
│   └── index.ts
│
├── otp/                        → OTP Assistant (F7)
│   ├── services/
│   │   └── otpAssistantService.ts
│   ├── prompts/
│   │   └── otpPrompt.ts
│   ├── types/
│   │   └── otp.types.ts
│   ├── components/
│   │   ├── MetaRating.tsx
│   │   ├── MatchupTierList.tsx
│   │   ├── BanPriority.tsx
│   │   ├── OtpTips.tsx
│   │   └── OtpSkeleton.tsx
│   └── index.ts
│
└── draft/                      → Draft Analyzer (F2)
    ├── services/
    │   └── draftAnalysisService.ts
    ├── prompts/
    │   └── draftPrompt.ts
    ├── types/
    │   └── draft.types.ts
    ├── components/
    │   ├── TeamCompositionCard.tsx
    │   ├── WinConditionsCard.tsx
    │   ├── ScalingChart.tsx
    │   └── DraftSkeleton.tsx
    └── index.ts
```

### Domain Dependency Rules

```
identity  ← (no domain dependencies)
riot      ← identity
analysis  ← riot
coaching  ← analysis, riot
champions ← analysis
```

Coaching can call analysis services. Analysis can call riot data. No domain may reach backwards in this chain.

---

## `/src/components` — Shared UI Components

```
src/components/
├── ui/                         → Base design system primitives
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Skeleton.tsx
│   ├── Chart.tsx               → Wrapper around recharts
│   └── ...
│
├── layout/                     → App shell components
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   ├── PageHeader.tsx
│   └── MobileNav.tsx
│
├── feedback/                   → Loading, error, empty states
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   ├── EmptyState.tsx
│   └── ErrorMessage.tsx
│
└── shared/                     → Multi-domain reusable components
    ├── RankBadge.tsx
    ├── ChampionIcon.tsx
    ├── MatchResultBadge.tsx
    └── KDADisplay.tsx
```

Feature-specific components live inside the domain:
```
src/domains/coaching/components/
├── ReportCard.tsx
├── InsightBlock.tsx
└── ActionItemList.tsx
```

---

## `/src/lib` — Shared Utilities & Integrations

```
src/lib/
├── ai/
│   ├── client.ts               → AIClient class (provider-abstracted)
│   ├── providers/
│   │   ├── openai.ts
│   │   └── anthropic.ts
│   └── types.ts
│
├── db/
│   └── prisma.ts               → Prisma client singleton
│
├── auth/
│   └── config.ts               → NextAuth/BetterAuth config
│
├── cache/
│   └── redis.ts                → Redis client singleton
│
├── riot/
│   └── rateLimit.ts            → Riot API rate limiter
│
├── lemonsqueezy/
│   └── client.ts               → LemonSqueezy client (active payment provider)
│
└── utils/
    ├── formatters.ts           → Date, number, rank formatters
    ├── validators.ts           → Zod schemas for shared inputs
    └── logger.ts               → Application logger
```

---

## `/src/hooks` — Shared React Hooks

```
src/hooks/
├── useMatchHistory.ts
├── useChampionPool.ts
├── useCoachingReport.ts
├── useSubscription.ts
└── useRiotAccount.ts
```

All hooks use TanStack Query internally. They never manage fetch state manually.

---

## `/src/types` — Shared TypeScript Types

```
src/types/
├── api.types.ts                → API request/response shapes
├── auth.types.ts               → Session, user context types
└── common.types.ts             → Shared enums, primitives
```

Domain-specific types live in `src/domains/<domain>/types/`.

---

## `/prisma` — Database

```
prisma/
├── schema.prisma               → Full database schema
├── migrations/                 → Auto-generated migration files
└── seed.ts                     → Development seed data
```

---

## `/docs` — Documentation

```
docs/
├── PRD.md
├── ARCHITECTURE.md
├── PROJECT_STRUCTURE.md        (this file)
├── DATABASE_SCHEMA.md
├── API_DESIGN.md
├── FRONTEND_ARCHITECTURE.md
├── AI_ARCHITECTURE.md
├── FEATURES.md
├── ROADMAP.md
├── tasks/
│   ├── TASK-001.md
│   ├── TASK-002.md
│   └── ...
└── adr/
    ├── ADR-001-auth-library.md
    ├── ADR-002-ai-provider-abstraction.md
    └── ...
```

---

## `/tests` — Integration & E2E Tests

```
tests/
├── e2e/                        → Playwright end-to-end tests
│   ├── auth.spec.ts
│   ├── match-history.spec.ts
│   └── coaching-report.spec.ts
└── integration/                → API integration tests
    ├── api/
    │   └── coaching.test.ts
    └── services/
        └── riotService.test.ts
```

---

## Layer Dependency Rules (Summary)

```
UI Layer (app/ components)
    ↓ can import
Hooks Layer (src/hooks)
    ↓ can import
Domain Services (src/domains/*/services)
    ↓ can import
Repositories / Data Access (src/domains/*/repositories)
    ↓ can import
Prisma / External APIs (src/lib)
```

**No layer may import from a layer above it.**
