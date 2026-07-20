# Scored backlog — 2026-07-20

Everything outstanding, measured rather than estimated. **Priority score is 0-100: higher = do
sooner.** It combines blast radius (what breaks, for whom), likelihood, and how silent the failure is
— a defect that fails loudly in CI scores lower than one that fails silently in production.

Health scores per area are at the bottom.

---

## P1 — Silent failures that cost money or leak access (do first)

### 1. Billing webhook verification has zero test coverage — **score 96**
`src/lib/lemonsqueezy/lsWebhookVerify.ts` is at **0% coverage**, and so is every other file in
`src/lib/lemonsqueezy/` (`lsCheckout`, `lsSubscriptionSync`, `subscriptionService`, `client`,
`lsWebhookDispatch`). The implementation is currently correct — raw body, HMAC-SHA256,
`timingSafeEqual` — which is exactly why this scores highest: **nothing would tell you if that
stopped being true.** A refactor that reads `req.json()` instead of `req.text()`, or swaps
`timingSafeEqual` for `===`, breaks no test and fails no build. The failure mode is anyone being able
to forge a `subscription_created` event and grant themselves a paid plan.
→ TASK-257. Start here: it is a pure function, so the test is cheap and the consequence is unbounded.

### 2. Report quota is bypassable by concurrent requests — **score 88**
`src/lib/auth/authorization.ts:49-83` counts reports, then the caller inserts — no transaction, no
lock, no constraint. N parallel requests on the free plan (1/day) produce N reports, each a paid LLM
call. This is the only ceiling on per-user AI spend and it does not hold under concurrency.
`accountService.ts:70` has the same shape for `isPrimary`.
→ TASK-255.

### 3. `authorization.ts` is untested — **score 85**
0% coverage on the file containing `assertOwnsRiotAccount`, `assertCanAddRiotAccount`,
`assertCanGenerateReport`, `checkIsPro`. Every IDOR defence and every paywall in the app routes
through these four functions. The audit found the call sites apply them consistently — the functions
themselves are unverified.
→ TASK-257.

### 4. Inngest endpoint fails open in production — **score 78**
`src/inngest/client.ts:7-12` logs a warning when `INNGEST_SIGNING_KEY` is unset in production but does
not fail. `/api/inngest` serves 26 functions including GDPR erasure, email dispatch, and subscription
renewal. A missing env var silently downgrades that to an unauthenticated endpoint.
→ Make it throw at boot instead of warning. Small change, filed under TASK-257's umbrella; worth its
own task.

### 5. `bruteForce.ts` and `totpService.ts` untested — **score 74**
Login throttling and 2FA, both at 0%. `register`/`forgot-password`/`reset-password` *do* call the
throttle (verified), so the wiring is right; the logic behind it has no tests.
→ TASK-257.

---

## P2 — Real defects, loud enough to notice eventually

### 6. Test coverage is structurally incomplete — **score 82**
Measured, not estimated: **28.08% statements** (1716/6111). But the number is more flattering than
reality, because `vitest.config.ts` sets `coverage.include: ["src/**/*.ts"]`:
- **`app/` is not in the denominator at all** — all 122 API route handlers are unmeasured *and*
  untested (CLAUDE.md §5.2 requires 70%).
- **`.tsx` is excluded entirely**, and `environment: "node"` with no jsdom means component tests
  cannot run today. There are 0 `.test.tsx` files, and that is a config consequence, not neglect.

Whole modules sit at 0%: `lib/lemonsqueezy`, `lib/stripe`, `lib/push`, `lib/security`,
`lib/features`, `lib/riot/{dedup,errors,lifecycle,publicSummoner}`.
→ Two prerequisites before the coverage number can improve honestly: add a jsdom environment for
component tests, and build the first API-route test harness (there is none — this is why route
coverage is 0/122, not laziness).

### 7. N+1 queries — **score 68**
`habitDetectionService.ts:119-147` runs a `findFirst` plus a write per candidate inside a serial loop.
`sendWeeklyReportEmails.ts:66-104` runs one `rankedHistory.findFirst` per subscriber inside a weekly
fan-out, and over-selects whole `MatchParticipant` rows at lines 33-64 to read one boolean.
→ TASK-256. Batch both into a Map; consider a unique constraint so the habit loop collapses to
`upsert`.

### 8. Dialogs are keyboard- and screen-reader-inaccessible — **score 64**
`ConfirmDialog.tsx` has no `role`, no `aria-*`, no Escape handler, no focus trap — verified, a grep
for all four returns nothing. Focus escapes into the page behind it, which stays interactive. It
guards **destructive actions**, which is what lifts this above a normal a11y nit.
`UpgradeModal.tsx:62` backdrop is a clickable `<div>`, mouse-only.
→ TASK-259. Use `@radix-ui/react-dialog` (`@radix-ui/react-slot` is already a dep) rather than
hand-rolling the WAI-ARIA dialog pattern. **Blocked on #6** — there is no way to test this until
vitest can render components.

### 9. Missing transactions on multi-step writes — **score 58**
`challengeProgressService.ts:84-97` updates the challenge, then awards XP separately. If the second
fails, the challenge is marked complete and the XP is never granted — invisible, and unrecoverable
without manual repair.

### 10. Hydration risk from `Date.now()` in render — **score 52**
Verified 3 of the 4 flagged files are `"use client"` and therefore SSR'd:
`RecentMatchList.tsx`, `DailyChallengeWidget.tsx`, `ConnectedAccountsList.tsx`. `DataFreshness.tsx`
is a server component — **not** a defect, despite being flagged.
→ Confirm an actual console mismatch warning before fixing; the symptom is cosmetic (a flickering
relative timestamp), so this is verify-then-fix, not fix-blind.

### 11. Silent mutation failures — **score 50**
`ConnectedAccountsList.tsx` surfaces `sync.isError` but not `disconnect` or `setPrimary`. A rejected
disconnect renders nothing at all — the user clicks, and the UI simply does not change.

---

## P3 — Hygiene and drift

### 12. Dependencies two majors behind — **score 62**
Measured: `next` 14.2.35 → 16.2.10, `prisma`/`@prisma/client` 5.22 → 7.8, `react` 18 → 19,
`eslint` 8 → 10, `tailwind` 3 → 4, `framer-motion` 11 → 12.
Next and Prisma are the ones that matter — two majors on the framework and the data layer means
security patches are landing on branches this app is not on. This is a planned migration, not a
quick bump: React 19 alone touches the R3F/drei versions pinned to the React-18 line (ADR-009).

### 13. 20 of 38 production dependencies undocumented — **score 44**
CLAUDE.md §2.1 requires every dependency be listed in `docs/DEPENDENCIES.md` with a rationale.
Measured: 18 documented, **20 missing** — including `next`, `next-auth`, `prisma`, `zod`, `resend`,
`@sentry/nextjs`, `@upstash/*`, `@lemonsqueezy/lemonsqueezy.js`, `@stripe/stripe-js`.
→ Mostly a backfill. Do it in one pass, and resolve #14 while writing it.

### 14. Two payment providers, one of them possibly dead — **score 40**
`@stripe/stripe-js` + `src/lib/stripe/subscriptionService.ts` (36 lines, 0% coverage) coexist with the
active LemonSqueezy integration. ADR-004/TASK-112 recorded the Stripe → LemonSqueezy move.
→ Decide: delete the Stripe path, or document why it stays. Dead payment code is a liability.

### 15. Twelve files over CLAUDE.md size limits — **score 34**
Worst: `guideSteps.ts` 360/150, `billing/PageClient.tsx` 309/200, `ReportPDF.tsx` 303/200.
→ TASK-260. Only some are worth splitting — `ReportPDF` and `recapSlides` are inherently long
catalogues, not tangled logic. Refactor-only commits, never bundled with features.

### 16. No route-level loading states — **score 30**
No `loading.tsx` anywhere. Pages have their own skeletons, so this is a polish item, and doing it
naively produces two loading UIs in sequence.
→ TASK-258.

### 17. CI does not enforce a coverage threshold — **score 28**
CI runs lint, typecheck, unit and e2e (verified, both workflows). `test:coverage` exists but nothing
gates on it, so coverage can drift down silently.
→ Only useful *after* #6; a threshold on a 28% baseline that excludes `app/` measures the wrong thing.

### 18. Public endpoints without rate limits — **score 26**
`/api/leaderboard`, `/api/champions/all`, `/api/auth/verify-email`. All cheap and non-mutating, so
this is scraping/noise surface rather than a real DoS or cost vector. `/api/public/preview` and the
three sensitive auth routes **are** limited (verified).

### 19. CSP allows `'unsafe-inline'` — **score 24**
A genuine trade-off for Tailwind and Next's inline runtime, not an oversight. Worth revisiting only
with a nonce-based CSP, which is a real project.

### 20. `/recap` page title is still Turkish — **score 22**
`app/(app)/recap/page.tsx:4` → `title: "Sezon Recap"`, a leftover from before the Phase-6 English
pass. One line.

### 21. `promote-team` hand-rolls auth — **score 20**
Not the escalation an automated pass claimed — it requires `ADMIN_EMAIL` session or `CRON_SECRET`.
But it bypasses `withAdminAuth`, and it returns `err.message` to the client (minor info disclosure).
→ Route it through `withAdminAuth`, drop the raw error.

---

## Ops — needs your decision, not code

| Item | Score | Note |
|---|---|---|
| `puuid` index migration not applied to prod Neon | **90** | The TASK-251 fix does nothing until it runs. Apply while the table is small — past a few million rows it needs `CREATE INDEX CONCURRENTLY`, which cannot run inside Prisma's migration transaction. |
| 6 commits unpushed | **60** | TASK-250..260 are local only. |
| Scope automated audits away from `.env*` | **55** | A review pass printed live API keys into its transcript. Not a leak (gitignored, never committed), but a process fix. |

---

## Health scores

| Area | Score | Reasoning |
|---|---:|---|
| **Architecture & code discipline** | **92** | 0 `any` across 787 files, 0 `console.*` outside the logger, 0 TODO, 1 justified eslint-disable, no cross-domain service imports, Riot and AI access properly isolated. The CLAUDE.md rules are genuinely followed, not aspirational. |
| **Security posture** | **74** | Strong foundations: verified webhook HMAC over raw body, scoped CSP, `CRON_SECRET` on schedulers, admin routes fail closed, consistent ownership asserts at the service layer, `.env*` correctly ignored. Held down by untested security controls, the quota race, and Inngest failing open. |
| **Data layer & performance** | **70** | The biggest problem (unindexed `puuid` on the largest table) is fixed but unapplied. Remaining: two N+1s, a missing transaction, and some over-fetching. No raw-SQL injection surface — the one `$queryRaw` is properly parameterized. |
| **Frontend & UX** | **72** | Pages handle loading and empty states well, and the segment error boundaries just landed. Hydration risks unconfirmed, some silent mutation failures. |
| **Accessibility** | **55** | Dialogs are the weak point: no role, no Escape, no focus management, on destructive actions. Images and links are in good shape. |
| **Testing** | **38** | 28% of `src/**/*.ts`, and the config excludes `app/` and `.tsx` entirely — so 122 route handlers and every component are unmeasured *and* untestable without config work. Security and billing modules sit at 0%. This is the weakest area by a wide margin. |
| **Docs & dependency hygiene** | **58** | Task docs and ADRs are unusually good — better than most production codebases. Undercut by 20/38 undocumented deps and two-major framework lag. |
| **CI & release** | **70** | CI runs lint + typecheck + unit + e2e; tsconfig strict with no weakening flags; no `ignoreBuildErrors`. No coverage gate, and releases currently sit unpushed. |

### Overall: **70 / 100**

The shape of this codebase is unusual and worth naming plainly: **the parts that are hard to retrofit
are in good condition, and the parts that are missing are mostly additive.** Type safety,
architectural boundaries, and domain modelling are the things that are expensive to fix later, and
they are solid. Testing is the one area that is genuinely weak, and it is weak in a specific,
fixable way — two config changes (jsdom, and including `app/` in coverage) unblock most of it.

The single highest-leverage action is #1: test the webhook verification. It is a pure function,
takes under an hour, and it is currently the only thing standing between a config regression and
free subscriptions.
