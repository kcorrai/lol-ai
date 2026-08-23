# LoL AI Coach — What This Site Is

A single, comprehensive tour of the product: what it does, who it does it for, how the
pieces fit together, and where to look when you need more detail.

This is the map. The specialised docs listed at the end are the territory.

---

## 1. The product in one paragraph

**LoL AI Coach** is a League of Legends coaching platform. A player connects their Riot
account, the system pulls their ranked match history, computes real metrics from it, and an
LLM turns those metrics into a coaching report: what they are good at, what is costing them
LP, and three things to do about it in order. Around that core sits a large free, public,
login-free surface — tier lists, builds, counters, champion guides and full esports coverage —
which exists to be found in search and to give a visitor something useful before they are ever
asked to sign up.

The two halves are deliberate. The free surface costs almost nothing to run (public feeds,
cached server-side, zero AI calls). The coached surface is where the AI spend and the
subscription revenue both live.

---

## 2. Who the site is for

The site serves three different people, and the route groups are organised around them
rather than around technology.

| Visitor                | What they came for                                        | Where they live                       |
| ---------------------- | --------------------------------------------------------- | ------------------------------------- |
| **Anonymous searcher** | "Who counters Darius?", "best Ahri build", "LEC schedule" | `(marketing)`, `(tools)`, `(esports)` |
| **Signed-in player**   | Their own games, read back to them                        | `(app)`                               |
| **Team manager**       | Roster performance across several players                 | `(team)`                              |

A fourth, much smaller audience — operators — has `/admin`.

The important consequence: **most of the site works with no account at all.** Auth gates only
the routes listed in `middleware.ts`; everything else is public and statically generated or
ISR-cached.

---

## 3. Site map

76 pages, 138 API routes, 45 database models. Grouped by what they are for.

### 3.1 Marketing — `app/(marketing)/`

The front door. Public, indexed, no login.

| Route                              | What it is                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                | Landing page — hero, feature previews, and a live demo that analyses any summoner without an account                                                  |
| `/champions`                       | Champion index — every champion with live win rate, patch movement and sample size                                                                    |
| `/champions/[name]`                | Champion guide — splash hero with live stats, abilities with video clips, base stats against the roster, skins, play/against tips, lore, matchup rail |
| `/pricing`                         | Plans                                                                                                                                                 |
| `/s/[region]/[gameName]/[tagLine]` | Public summoner lookup — the frictionless demo's permalink                                                                                            |
| `/privacy`, `/terms`               | Legal                                                                                                                                                 |

### 3.2 Free tools — `app/(tools)/`

The SEO engine. Everything here is patch-current, cached, and costs no AI budget. Data comes
from a public stats feed plus Data Dragon (ADR-008), cached server-side and shared across
requests (ADR-013).

| Route                                          | What it answers                                                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tools`                                       | Index of the tools                                                                                                                                          |
| `/tools/tier-list` + `/tools/tier-list/[role]` | Strongest champions per lane, with rank-band filter and patch-over-patch movement                                                                           |
| `/aram/tier-list`                              | The same for ARAM — separate dataset, ARAM balance applied                                                                                                  |
| `/builds`                                      | Every champion's build, with the ones whose standing moved most this patch surfaced first                                                                   |
| `/builds/[champion]` + `/[role]`               | The build itself: start / core / boots / options with per-step win rate, runes, summoners, 1–18 skill order, win rate by game length, patch trend, matchups |
| `/aram/[champion]`                             | The same view, ARAM dataset                                                                                                                                 |
| `/counters/[champion]`                         | Who beats this champion and how to play against them                                                                                                        |
| `/matchups/[slug]`                             | Head-to-head guide for a champion pair (alphabetical canonical URL)                                                                                         |
| `/tools/counter-picker`                        | Interactive counter lookup                                                                                                                                  |
| `/tools/matchup`                               | Interactive head-to-head                                                                                                                                    |
| `/tools/draft-analyzer`                        | Deterministic 5v5 composition scoring — damage profile, frontline, scaling, lane edges                                                                      |
| `/draft` + `/draft/[code]`                     | Live draft room — a shared, real-time champion-select assistant                                                                                             |
| `/meta`                                        | The patch's biggest winners and losers                                                                                                                      |

Every data page carries a freshness line — _"Data updated Xh ago · Patch NN · N games
analyzed"_ — and JSON-LD with `dateModified`. Query-param permalinks are `noindex` with a
canonical pointing at the clean path.

### 3.3 Esports — `app/(esports)/`

Public coverage of professional League, built on Riot's own esports feed (ADR-016), with URL
structure fixed by ADR-017.

| Route                                | What it is                                                                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/esports`                           | Hub — live scoreboards that poll while games are on, a day-grouped schedule, latest results, standings, pro-picked champions |
| `/esports/schedule`                  | The full calendar                                                                                                            |
| `/esports/vods`                      | Every recorded series, game by game, filterable by league                                                                    |
| `/esports/leagues` + `/[slug]`       | Every league and its standings                                                                                               |
| `/esports/teams` + `/[slug]`         | Rosters and recent form                                                                                                      |
| `/esports/players/[slug]`            | A pro's champion pool and games                                                                                              |
| `/esports/matches/[matchId]`         | A series: draft, scoreboard with per-minute rates, gold curve and objective ledger, end-game stat lines, head-to-head        |
| `/esports/champions` + `/[champion]` | Pro meta — what teams actually pick and ban, and how it goes for them                                                        |

The hub renders from a five-minute cache and the live block polls on top of it, so an
off-season visitor makes one request and then nothing.

### 3.4 The app — `app/(app)/`

Everything behind a login. This is the product people pay for.

**Daily loop**

| Route              | What it is                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/dashboard`       | The one screen that answers "should I queue right now?" — a readiness verdict, today's focus, last game, then the analysis of the last 20 games, a duo rail, and the match log |
| `/match/[matchId]` | One game in full: stats, items, runes, timeline, death events                                                                                                                  |
| `/analysis`        | Deeper aggregate analysis                                                                                                                                                      |
| `/champion-pool`   | Pool health — role coverage, meta alignment, depth                                                                                                                             |

**Coaching**

| Route                  | What it is                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/coaching`            | Report list                                                                                                                                                                  |
| `/coaching/[reportId]` | A report: the coach's verdict, findings ordered by severity with the evidence for each, a numbered action plan, focus champions. PDF export, voice coach, share link, rating |
| `/coaching/chat`       | Conversational coach                                                                                                                                                         |
| `/improvement`         | The two-week plan built from report findings, with daily goals                                                                                                               |
| `/roadmap`             | Climb roadmap — target rank, champion focus, timeline                                                                                                                        |
| `/otp`                 | One-trick assistant                                                                                                                                                          |

**Progress and retention**

| Route           | What it is                                                         |
| --------------- | ------------------------------------------------------------------ |
| `/recap`        | Season recap — a full-screen chapter deck of the season, shareable |
| `/milestone`    | Monthly progress report                                            |
| `/achievements` | Badges and XP                                                      |
| `/leaderboard`  | Weekly and monthly LP gainers                                      |
| `/onboarding`   | Guided first run (ADR-010)                                         |

**Settings** — `/settings/{profile,accounts,billing,security,notifications,privacy,discord}`,
covering Riot account linking, subscription, TOTP 2FA, session revocation, push notifications,
GDPR export and deletion, and Discord webhooks.

### 3.5 Teams — `app/(team)/`

B2B. A team account holds several members; managers see roster-wide performance.

`/teams/[teamId]` · `/members` · `/activity` · `/reports` · `/report` · `/settings`, plus
`/teams/join` and `/join/[token]` for invites.

### 3.6 Public share targets

| Route                        | What it is                                                 |
| ---------------------------- | ---------------------------------------------------------- |
| `/u/[slug]`                  | Public profile, with its own OG image and privacy controls |
| `/share/report/[shareToken]` | A shared coaching report                                   |
| `/recap/share/[shareToken]`  | A shared season recap                                      |

### 3.7 Admin — `app/admin/`

`/admin/analytics` · `/ai-cost` · `/audit-logs` · `/feature-flags`.

---

## 4. How a coaching session actually flows

This is the path that justifies the whole system.

1. **Connect** — the player links a Riot ID at `/settings/accounts`. The Riot domain resolves
   it to a PUUID and stores a `RiotAccount`.
2. **Sync** — an Inngest job (`matchSync`) pulls recent ranked matches through the Riot API and
   writes `Match` + `MatchParticipant` rows. The dashboard re-syncs a stale account silently on
   load, so the data is current without the player asking.
3. **Measure** — the analysis domain computes real metrics from those rows: KDA, CS/min, vision
   score per minute, kill participation, damage share, death clustering, streaks, consistency.
   No AI involved. These are arithmetic over the player's own games.
4. **Interpret** — the coaching domain builds a prompt from those metrics and sends it through
   the AI client abstraction (`src/lib/ai/`, provider-agnostic between OpenAI and Anthropic).
   The model's job is to explain and prioritise the numbers, not to invent them.
5. **Assemble** — the response becomes a `CoachingReport`: summary, strengths, weaknesses with
   root causes and evidence, ordered action items with expected impact and timeframe, champion
   recommendations, estimated rank potential.
6. **Deliver** — the report streams its progress over SSE while it generates, then renders at
   `/coaching/[reportId]`, exports to PDF, reads aloud through TTS, and feeds `/improvement`.
7. **Track** — the plan's goals are checked against the next games automatically, so the loop
   closes rather than ending at a document.

**The rule that keeps this honest:** every figure a report cites traces back to a match row.
The model orders and explains; it does not supply numbers.

---

## 5. Architecture

### 5.1 Shape

Domain-driven and feature-cohesive: code is organised by _what it is about_, not by
technical layer. A feature's service, components, types and tests sit together.

```
Browser
  │
  ├─ Server Components / ISR ─────────┐
  └─ React Query hooks → API routes ──┤
                                      │
                        Domain services (src/domains/*)
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
        Prisma → Postgres      Redis cache            External APIs
                                                (Riot · Esports feed ·
                                                 OP.GG · Data Dragon ·
                                                 OpenAI · Anthropic ·
                                                 LemonSqueezy)
```

### 5.2 The domains

`src/domains/` — 15 of them:

| Domain       | Owns                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `identity`   | Auth, sessions, 2FA, GDPR, referrals, public profiles                                           |
| `riot`       | The Riot API client, account linking, match sync. **No Riot call happens outside this domain.** |
| `match`      | A single game and its timeline                                                                  |
| `analysis`   | Metrics over match rows: KDA, CS, vision, tilt, habits, recap, improvement plans                |
| `coaching`   | Report generation, PDF export, voice, report presentation                                       |
| `meta`       | Patch-current champion stats: tier lists, builds, counters, matchups, draft evaluation          |
| `champions`  | Champion pool health and matchup matrix                                                         |
| `counter`    | Counter-pick logic                                                                              |
| `draft`      | The live draft room and its real-time sync (ADR-016 live-draft)                                 |
| `esports`    | Pro schedule, standings, teams, players, games, pro meta                                        |
| `otp`        | One-trick assistant                                                                             |
| `onboarding` | Guided first run                                                                                |
| `billing`    | Plans, LemonSqueezy sync, limits                                                                |
| `teams`      | B2B accounts and roster analytics                                                               |
| `admin`      | Operator tooling                                                                                |

### 5.3 Rules that are actually enforced

From `CLAUDE.md`, and worth repeating because they explain why the code looks the way it does:

- **Route handlers validate, delegate, respond.** No business logic in `app/api/`.
- **No direct database access outside the data layer.** Prisma repository patterns only, no raw SQL.
- **No AI SDK calls outside `src/lib/ai/`.** The abstraction exists so the provider can change.
- **No Riot API calls outside `src/domains/riot/`.**
- **No component fetches its own data.** Data goes through React Query hooks in `src/hooks/`.
- **TanStack Query owns server state; Zustand is for client-only UI state.** Never the reverse.
- **No `any`.** Strict TypeScript, explicit parameter and return types.
- **Domains talk through their public API** (`src/domains/<domain>/index.ts`), not through each
  other's internals.

### 5.4 Caching, because it is most of the performance story

- **Meta and esports data** are fetched from public feeds and cached server-side with a TTL,
  shared across all requests (ADR-013). A tier list is one upstream fetch per patch window, not
  one per visitor.
- **AI responses** are cached by a key built from the inputs (ADR-014), so an identical report
  request does not spend the budget twice.
- **Pages** use ISR: 12 hours for tier lists and builds, 24 hours for champion guides, 5 minutes
  for the esports hub.
- **A failed refresh serves the last good value** rather than an error. Freshness is shown on
  the page so a stale number is never presented as current.

---

## 6. Data model

45 Prisma models. The ones that carry the product:

| Cluster    | Models                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Identity   | `User`, `Account`, `Session`, `Profile`, `UserSession`, `VerificationToken`, `AuditLog`                             |
| Riot       | `RiotAccount`, `PlayerIndex`, `Match`, `MatchParticipant`, `MatchDeathEvent`, `RankedHistory`                       |
| Analysis   | `ChampionStat`, `PerformanceSnapshot`, `PlayerHabit`, `TiltAlert`, `SeasonRecap`                                    |
| Coaching   | `CoachingReport`, `AiAnalysis`, `AiCache`, `ImprovementPlan`                                                        |
| Engagement | `Achievement`, `UserAchievement`, `Challenge`, `UserChallenge`, `Notification`, `PushSubscription`, `ShareableCard` |
| Social     | `DuoPartner`, `DuoQuest`, `Referral`, `DiscordIntegration`                                                          |
| Commerce   | `Subscription`, `WebhookEvent`                                                                                      |
| Teams      | `Team`, `TeamMember`, `TeamInvite`, `TeamActivity`                                                                  |
| Draft      | `DraftSeries`, `DraftGame`, `DraftAction`                                                                           |
| Reference  | `Champion`, `PatchVersion`, `FeatureFlag`                                                                           |

Full column-level detail: `docs/DATABASE_SCHEMA.md`.

---

## 7. Background work

24 Inngest functions in `src/inngest/functions/`. They exist because none of this should
happen inside a request.

- **Data** — `matchSync`, `timelineFetcher`, `patchVersionPoller`, `performanceSnapshotWorker`
- **Coaching** — `runCoachingJob`, `autoSessionReview`, `planRenewal`
- **Engagement** — `achievementChecker`, `challengeGenerator`, `challengeProgressChecker`, `tiltStreakCheck`
- **Email** — activation, report ready, rank change, weekly report, re-engagement, cart abandonment
- **Teams** — invite email, weekly report, subscription notification
- **Compliance** — `gdprExport`, `gdprErasure`, `rtbfComplianceChecker`
- **Growth** — `referralReward`

---

## 8. External data, and why each one

| Source                 | Used for                                                                      | Why not something else                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Riot API**           | The player's own matches and ranked history                                   | The only source of truth for a specific account                                                                                                                                                                          |
| **Data Dragon**        | Champions, items, runes, spells, splash art, ability clips                    | Riot's own static CDN; free and versioned per patch                                                                                                                                                                      |
| **OP.GG public feed**  | Patch-current aggregate stats — win/pick/ban, builds, matchups                | The Riot API gives you one player's games, not the meta. Rebuilding aggregate stats from scratch would need a match-collection pipeline at a scale this product does not need (ADR-008)                                  |
| **LoL Esports feed**   | Pro schedule, standings, rosters, live games, VOD archive and per-frame stats | Riot's own public esports API; per-frame data includes items and runes, so pro builds are derivable, and a game's length is derivable from its opening and closing frames even though no endpoint publishes it (ADR-016) |
| **OpenAI / Anthropic** | Turning metrics into a coaching report, plus Whisper STT and TTS              | Behind one abstraction so either can serve                                                                                                                                                                               |
| **LemonSqueezy**       | Subscriptions and webhooks                                                    | Merchant of record — it handles tax                                                                                                                                                                                      |

---

## 9. Plans and gating

`src/lib/auth/planLimits.ts` is the single source of truth. `-1` means unlimited.

| Limit                                  | Free      | Pro | Elite | Team |
| -------------------------------------- | --------- | --- | ----- | ---- |
| Riot accounts                          | 1         | 3   | 5     | 5    |
| Reports / month                        | 3         | ∞   | ∞     | ∞    |
| Reports / day                          | 1         | ∞   | ∞     | ∞    |
| Match history depth                    | 10        | 100 | 200   | 200  |
| Champion pool entries                  | 3         | ∞   | ∞     | ∞    |
| Full coaching report                   | ✗         | ✓   | ✓     | ✓    |
| Matchup / OTP / draft analyses per day | 5 / 3 / 3 | ∞   | ∞     | ∞    |

Free users see a report's verdict and summary; findings, the full action plan and champion
recommendations are behind Pro. The free _tools_ are not gated at all — they cost nothing to
serve and they are the acquisition channel.

Route protection is a short allowlist in `middleware.ts`, checked against the JWT without a
database call. Everything not on that list is public.

---

## 10. The visual system

The interface follows **LaneIQ** (ADR-015). Tokens live in `src/styles/globals.css` and are
wired into Tailwind in `tailwind.config.ts`.

- **Ground** — near-black greens (`#050706` → `#1E2A28`), not neutral grey.
- **Accent** — one acid green, `#C6FF3D`. It is spent on the thing that matters on a screen and
  nowhere else. Support hues (info teal, warning amber, danger red) carry data meaning only and
  are never a second brand colour.
- **Shape** — chamfer, not radius. The `.notch` utilities cut corners; the border radius scale is
  collapsed to near-zero so `rounded-2xl` still parses but no longer rounds.
- **Elevation** — read from border brightness and fill lightness. Panels are flat at rest: 1px
  outline, no shadow.
- **Type** — Orbitron for display, Chakra Petch for body, JetBrains Mono for every number.
  Numbers are always tabular.
- **HUD furniture** — `// SECTION` markers in mono caps, hairline rules, meters instead of
  gauges.

The pages were brought onto this system from a set of Claude Design files: dashboard, auth,
tier list, esports hub, season recap, builds index, build detail, champion guide and coaching
report.

---

## 11. Testing and delivery

| Layer              | Tool                   | Bar                                                  |
| ------------------ | ---------------------- | ---------------------------------------------------- |
| Unit / integration | Vitest                 | Domain services 80%, utilities 90%, API handlers 70% |
| Component          | Testing Library        | Key interactions only                                |
| E2E                | Playwright             | Critical user flows                                  |
| Types              | `tsc --noEmit`         | Strict, zero errors                                  |
| Lint               | ESLint via `next lint` | Zero warnings                                        |

Current suite: **1236 tests across 138 files.** No test makes a real network call — the Riot
API and the AI client are always mocked.

Deployment is Vercel on Fluid Compute. Migrations run outside the build (ADR-012) so a schema
change cannot take a deploy down with it.

---

## 12. Where to look next

| Question                                      | Document                         |
| --------------------------------------------- | -------------------------------- |
| How is the system structured?                 | `docs/ARCHITECTURE.md`           |
| How does the AI pipeline work?                | `docs/AI_ARCHITECTURE.md`        |
| What are the endpoints?                       | `docs/API_DESIGN.md`             |
| What is in the database?                      | `docs/DATABASE_SCHEMA.md`        |
| Where does a file go?                         | `docs/PROJECT_STRUCTURE.md`      |
| How is the frontend organised?                | `docs/FRONTEND_ARCHITECTURE.md`  |
| What does the product do, feature by feature? | `docs/FEATURES.md`               |
| Why was this decided?                         | `docs/adr/` — 19 records         |
| What is planned?                              | `docs/ROADMAP.md`, `docs/PRD.md` |
| What are the rules for changing code?         | `CLAUDE.md`                      |
| How do I run it?                              | `README.md`                      |

### A note on `README.md`

Two rows of its Tech Stack table have gone stale and will mislead you:

- **Styling** still describes the pre-rebrand "purple gradients, glow effects" aesthetic. ADR-015
  replaced it — see §10 above.
- **Localization** says "Turkish (full UI localization)". The UI is English; the README's own
  opening paragraph says so. The Turkish row is left over from an earlier phase.

Everything else in the README is current.
