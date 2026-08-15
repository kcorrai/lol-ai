# Roadmap — LoL AI Coach

**Version:** 1.0

---

## Overview

| Phase | Theme | Duration | Features |
|---|---|---|---|
| Phase 1 | Foundation & MVP | Months 1–3 | F-001 through F-008 |
| Phase 2 | AI Depth & Retention | Months 4–6 | F-009 through F-016 |
| Phase 3 | Advanced Analysis | Months 7–12 | F-017 through F-022 |
| Phase 4 | Scale & Expansion | Year 2 Q1–Q2 | Infrastructure, mobile, multi-server |
| Phase 5 | AI Platform | Year 2 Q3–Year 3 | F-023 through F-026 + new bets |
| Phase 6 | Esports & Audience Growth | Parallel track | F-030 through F-037 |

---

## Phase 1 — Foundation & MVP

**Theme:** Build the product that earns the right to exist.

**Duration:** Months 1–3 (12 weeks)  
**Team:** 1–2 engineers, 1 designer

### Goals

- Deliver the core user journey end-to-end: connect account → view history → receive AI coaching report.
- Validate that AI-generated coaching provides real perceived value.
- Acquire first 500 registered users, 50 paying.
- Establish code quality, architecture, and development velocity foundation.

### Deliverables

| Deliverable | Timeline | Task | Status |
|---|---|---|---|
| Project setup: repo, CI/CD, deployment pipeline | Week 1 | TASK-001 | ✅ Done |
| Database schema + migrations (auth tables included) | Week 1–2 | TASK-003 | ✅ Done |
| Authentication system (email + OAuth) | Week 2 | TASK-002 | ✅ Done |
| API abstraction layer (withAuth, response utils) | Week 2 | TASK-002.5 | ✅ Done |
| Riot HTTP client (cache + retry + rate limit) | Week 2–3 | TASK-003.5 | ✅ Done |
| Data lifecycle layer (cache invalidation, stale detection) | Week 3 | TASK-003.6 | ✅ Done |
| Riot API integration + account connection + match sync | Week 3–4 | TASK-004 | ✅ Done |
| Match analysis + AI coaching pipeline | Week 5–6 | TASK-005 | ✅ Done |
| Dashboard UI + coaching report pages + React Query | Week 6–7 | TASK-006 | ✅ Done |
| Sidebar + auth UX + account management | Week 7 | TASK-007 | ✅ Done |
| UI consistency layer (EmptyState, ErrorState, PageHeader) | Week 7–8 | TASK-008 | ✅ Done |
| Subscription / Stripe integration | Week 10–11 | — | ⏳ Pending |
| Marketing landing page + pricing | Week 11–12 | — | ⏳ Pending |
| Beta launch (invite-only) | End of Week 12 | — | ⏳ Pending |

### Key Risks

| Risk | Mitigation |
|---|---|
| Riot API rate limiting during development | Use development API key limits, implement caching early |
| AI coaching quality below expectations | Extensive prompt iteration; collect 50+ user feedbacks before charging |
| Scope creep delaying launch | Hard scope freeze at Week 6; anything not in MVP list is a V2 ticket |
| Next.js + Prisma + Vercel integration issues | Validate stack in Week 1 with a throwaway spike |

### Definition of Done

- A player can connect their Riot account, see their last 20 matches, and receive an AI coaching report in under 2 minutes.
- At least 20 beta users have provided a report rating ≥ 4/5.
- Stripe checkout flow works end-to-end in production.

---

## Phase 2 — AI Depth & Retention

**Theme:** Turn first-time users into habits.

**Duration:** Months 4–6  
**Team:** 2 engineers, 1 designer

### Goals

- Increase 30-day retention from estimated 25% to 40%.
- Launch 3 new AI report types (champion focus, climb roadmap, tilt detection).
- Reach 200 paying subscribers.
- Establish automatic session review (no manual trigger).

### Deliverables

| Deliverable | Timeline |
|---|---|
| Champion pool health analysis | Month 4 |
| Tilt detection + alert system | Month 4 |
| Champion Focus AI report | Month 4–5 |
| Climb Roadmap AI report | Month 5 |
| Automatic session review (post-session trigger) | Month 5 |
| Personalized training plan (v1) | Month 5–6 |
| Counter pick database | Month 6 |
| Report PDF export | Month 6 |
| Email notifications (report ready, rank change) | Month 6 |

### Key Risks

| Risk | Mitigation |
|---|---|
| AI costs scaling faster than revenue | Implement usage analytics and cost per-user tracking in Month 4 |
| Session detection accuracy | Build heuristic-based detection with manual override |
| Training plan engagement drops off | Build in streak/progress tracking from day one |

### Success Metrics at End of Phase 2

- 30-day retention: ≥ 40%
- Users with ≥ 3 AI reports: ≥ 60% of active users
- Pro subscriber count: ≥ 200
- NPS: ≥ 40

---

## Phase 3 — Advanced Analysis

**Theme:** Become the most capable analysis platform in the market.

**Duration:** Months 7–12  
**Team:** 3 engineers, 1 designer, 1 data analyst

### Goals

- Differentiate from competitors with features they cannot easily replicate.
- Introduce first B2C premium tier (Elite).
- Reach 1,000 paying subscribers.
- Build the performance data flywheel.

### Deliverables

| Deliverable | Timeline |
|---|---|
| Pro player comparison | Month 7–8 |
| Teamfight analysis (from timeline data) | Month 8–9 |
| Performance prediction model (v1) | Month 9–10 |
| Warm-up tracker | Month 9 |
| Monthly milestone report | Month 10 |
| Elite subscription tier launch | Month 10 |
| Draft coach (v1, post-game) | Month 11–12 |
| Advanced champion pool optimization | Month 11–12 |

### Key Risks

| Risk | Mitigation |
|---|---|
| Pro player data sourcing | License from established data provider, or aggregate from public API |
| Performance prediction model quality | Start with simple regression, invest in ML properly only when data volume justifies it |
| Draft coach latency | Pre-compute common draft scenarios, cache heavily |

### Success Metrics at End of Phase 3

- Total registered users: ≥ 30,000
- Paying subscribers: ≥ 1,000
- MRR: ≥ $15,000
- Avg user rating on reports: ≥ 4.2/5

---

## Phase 4 — Scale & Expansion

**Theme:** From product to platform.

**Duration:** Year 2, Months 13–18  
**Team:** 4–6 engineers, 1 designer, 1 PM

### Goals

- Handle 10K+ daily active users without degradation.
- Expand to additional LoL regions (KR, TR, BR, LAN).
- Launch mobile-responsive web experience.
- Begin B2B exploration (esports teams, coaching academies).
- Separate high-load services from main application.

### Deliverables

| Deliverable | Timeline |
|---|---|
| Match sync service extraction (background worker) | Month 13–14 |
| AI pipeline service extraction | Month 14–15 |
| Read replica for analytics queries | Month 14 |
| Multi-region Riot API support (KR, TR, BR) | Month 15–16 |
| Mobile-optimized responsive redesign | Month 15–16 |
| Internationalization (Korean, Turkish, Portuguese) | Month 16–17 |
| B2B team accounts (pilot) | Month 17–18 |
| SOC2 compliance preparation | Month 17–18 |

### Key Risks

| Risk | Mitigation |
|---|---|
| Database performance at 10K+ users | Implement read replicas and query optimization before hitting limits |
| Multi-region complexity | Treat regions as configuration, not code branches |
| B2B sales cycle longer than expected | Pilot with 3 teams for free, close learnings before building |

---

## Phase 5 — AI Platform

**Theme:** Build the most intelligent coaching platform in gaming.

**Duration:** Year 2–3  
**Team:** 6+ engineers, dedicated AI team

### Goals

- Launch conversational AI coaching (chat).
- Voice coaching MVP.
- Replay analysis (from file upload).
- Explore live-game coaching overlay.
- Evaluate VALORANT expansion.

### Deliverables

| Deliverable | Notes |
|---|---|
| AI Coaching Chat | Contextual Q&A on reports |
| Voice Coaching | TTS playback of reports, conversational mode |
| Replay Analysis | `.rofl` file parsing + AI event annotation |
| Live Game Overlay | Pending Riot compliance review |
| VALORANT expansion | Separate product SKU |
| Esports analyst platform | B2B product track |

### Key Risks

| Risk | Mitigation |
|---|---|
| Riot policy changes for live client API | Monitor developer policy, design around existing APIs first |
| Replay parsing technical complexity | Investigate open-source parsers (lol-parser) early |
| AI cost at scale for conversational features | Implement strict conversation limits, smart caching |
| Expanding too early to VALORANT | Only expand after LoL platform reaches $50K MRR |

---

## Phase 6 — Esports & Audience Growth

**Theme:** Own esports search intent, and hand that audience to the product.

**Duration:** Parallel track — it depends on none of Phases 3–5 and blocks none of
them. Spine (TASK-297 → TASK-304) is roughly two weeks of focused work.

Full plan: [ESPORTS_PLAN.md](./ESPORTS_PLAN.md).

### Goals

- A free, public, crawlable esports section under `/esports`.
- Rank for schedule, standings, roster, results and pro-build queries.
- Convert that traffic into the champion cluster and then into accounts.
- Run at zero marginal cost per view — cached feeds, no AI in the read path.

### Deliverables

| Deliverable | Notes |
|---|---|
| Esports domain + hub | `src/domains/esports/`, ISR over a cached feed (ADR-016) |
| Schedule, live scores | One polled endpoint; polls only while something is live |
| Leagues, standings, brackets | Normalised across round-robin, swiss and knockout |
| Teams, players | Rosters, form, champion pools |
| Match pages | Drafts, scoreboards, item/rune builds, gold curves |
| Pro meta + pro builds | Pick/ban aggregation, champion-in-pro-play pages |
| SEO layer | JSON-LD, OG cards, sitemap, canonical/noindex discipline (ADR-017) |
| Cross-linking + You vs the Pros | The funnel from esports into the product |

### Key Risks

| Risk | Mitigation |
|---|---|
| Unofficial feed changes or blocks us | Zod boundary + never-expiring last-good snapshots; pages degrade rather than 500 |
| Thin generated pages get filtered | No-content pages are `noindex` and out of the sitemap |
| Traffic arrives but never converts | Cross-linking and "You vs the pros" are scoped tasks, not afterthoughts |
| Section becomes a maintenance tax | Stateless by design; no esports data in Postgres before TASK-313 is approved |

### Success Metrics at End of Phase 6

- Esports section indexed with no thin-page filtering, and ranking for at least
  one league's standings and one team's roster query.
- Measurable click-through from esports pages into `/builds` and `/champions`.
- Zero increase in per-view cost: no AI call and no database write in the read path.

---

## Guiding Principles Across All Phases

1. **Ship early, validate fast.** Features ship to 10% of users before full rollout.
2. **AI quality gates.** No AI feature ships without average report rating ≥ 3.8/5 in internal testing.
3. **Performance budgets.** Every phase must maintain: LCP < 2.5s, API P95 < 2s.
4. **Revenue before features.** If monthly churn exceeds 10%, stop building new features and fix retention.
5. **Never violate Riot ToS.** All features are reviewed against Riot's Developer Policy before implementation.
