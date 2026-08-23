# TASK-290: Restore production

## Status: Blocked — needs owner action and a Neon quota reset

## Context

Production is broken on two independent counts, both confirmed from Vercel
runtime logs on 2026-07-20:

1. **`RIOT_API_KEY` is expired.** Riot returns 401 `Invalid or missing Riot API
key`. Development keys expire every 24 hours; this has now broken production
   twice in two days.
2. **Neon is unreachable** — `Can't reach database server at
ep-jolly-pine-aq09634u…`. The 5 GB monthly _transfer_ quota is exhausted
   (TASK-282); it resets around **1 August 2026**.

Production currently returns 200 for most paths, which is misleading: those are
stale ISR responses. The one request that took a cache miss
(`/api/public/preview`, `cache=MISS` in the log) failed immediately. As ISR
entries expire and cannot be revalidated, more of the site will fail.

This blocks TASK-289 — Riot will not review an application whose site does not
load.

## Runbook, in dependency order

### 1. Set `RIOT_API_KEY` in Vercel _(owner — dashboard)_

Project → Settings → Environment Variables → Production. A fresh development key
works but dies again in 24h; the real fix is the production key, which is what
TASK-289 is for. Chicken-and-egg: a working site is needed to _get_ the
production key, so a development key is the bridge.

No Vercel CLI is installed and the Vercel MCP surface exposes no env-var
management, so this cannot be automated from here.

### 2. Set `INNGEST_SIGNING_KEY` in Vercel _(owner — dashboard)_

`src/inngest/client.ts` throws at module load when `NODE_ENV=production` and the
key is absent (TASK-264, deliberate — without it `/api/inngest` accepts unsigned
requests to 27 functions including GDPR erasure). It is **not** in `.env.local`.
The guard exempts the build phase, so the build passes and the _first request_
fails. Set this before deploying or production dies on cold start.

### 3. Wait for Neon, or upgrade _(blocked until ~1 Aug, or a paid plan)_

~~`build` is `prisma migrate deploy && prisma generate && next build`, so the build
opens a database connection. **While the quota is exhausted the build itself can
fail** — this is not merely a runtime concern.~~

**Superseded by TASK-291 / ADR-012 (2026-07-28).** The build no longer runs
migrations — it is `prisma generate && next build` — so an unreachable database
no longer fails the deploy on its own account. Migrations are now a separate
release step (`.github/workflows/migrate.yml`, or `npm run db:migrate` by hand).

The database is still needed to _migrate_, so step 4's outstanding migrations
remain blocked until Neon is reachable. What changed is that the application
code can now ship without waiting for that.

Options: wait for the reset, or move to Neon's Launch plan (usage-based, ~$15/mo).
Owner previously said "I'll buy it when we launch".

Do not skip TASK-282's fix before re-measuring: 5.8 GB is the number for the
_broken_ state, not real traffic. The fix (memoization, narrowed `select`, no
write-on-read) is committed but has never been deployed.

### 4. Deploy

`git push origin main` — 35 commits unpushed at time of writing.

**Three migrations have never been applied to production:**
`20260720000001_add_duo_partner`,
`20260720000002_add_match_participant_puuid_index`,
`20260720000003_webhook_event_processed_nullable`. All three applied cleanly
against local Postgres, so they are expected to succeed. Verify the applied set
once Neon is reachable — it could not be checked while the database is down.
TASK-287 needed no migration.

_(This previously read "four", listing `webhook_event_processed_nullable` and
`20260720000003` separately. They are the same migration directory.)_

Since TASK-291 these run outside the build, so **the deploy will no longer tell
you if they failed** — check the Migrate Production workflow, or run
`npx prisma migrate status` against production.

### 5. Verify before applying to Riot

At minimum: landing page loads, the Riot ID search on `/` returns a real preview,
`/tools/tier-list` renders, and `/terms` and `/privacy` are reachable — Riot
inspects the legal pages by hand.

## Separate blocker for TASK-289: there is no custom domain

The project serves only `lol-ai-three.vercel.app` and two
`*-kcorrais-projects.vercel.app` aliases. Riot's domain verification expects a
`riot.txt` string on **a domain you own**, and `vercel.app` is not owned by us.

Whether Riot accepts a platform subdomain could not be established from their
public documentation. Treat a custom domain as a likely prerequisite for the
production key application, and note it interacts with decision D1 in
`docs/RIOT_PRODUCTION_KEY_CHECKLIST.md` — if the product is going to be renamed
away from "LoL", buy the domain for the new name rather than twice.

## Why this is not being done now

Steps 1 and 2 need dashboard access to secrets; step 3 needs a quota reset or a
purchase. None of it is automatable from here, and deploying into an exhausted
quota risks a failed build for no gain.
