# Deployment Checklist

Steps that cannot be automated — verify before/after each production deploy.

---

## First-Time Setup (One-Off)

### Vercel

- [ ] Link project: `vercel link` in project root
- [ ] Set all env vars from `.env.example` via Vercel dashboard or `vercel env add`
  - Critical: `DATABASE_URL`, `DATABASE_READONLY_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`
  - Payments: `LEMONSQUEEZY_*` (5 vars including `LEMONSQUEEZY_TEAM_VARIANT_ID`)
  - Queue: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
  - Cache: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
  - Monitoring: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
  - Admin: `ADMIN_EMAIL`, `CRON_SECRET`
- [ ] Confirm `DATABASE_READONLY_URL` is set to the Neon read-replica URL (not the primary)
- [ ] Confirm `NEXT_PUBLIC_APP_URL` is set to the production domain (e.g. `https://lolaicoach.gg`)
- [ ] Set `NODE_ENV=production` in Vercel environment

### Inngest

- [ ] Register app URL in Inngest dashboard → Apps → Add App
  - URL: `https://lolaicoach.gg/api/inngest`
- [ ] Verify all functions are listed after registration:
  - `coaching/report.generate`
  - `account/deletion.scheduled`
  - `team/invite.send`
  - `riot/sync.matches`
  - `riot/sync.ranked`
  - `weekly/digest.send` (cron)
- [ ] Copy `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from Inngest dashboard → Settings

### LemonSqueezy

- [ ] Create Product → Pro Plan variant → copy ID to `LEMONSQUEEZY_PRO_VARIANT_ID`
- [ ] Create Product → Pro Annual variant → copy ID to `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID`
- [ ] Create Product → Team Plan variant → copy ID to `LEMONSQUEEZY_TEAM_VARIANT_ID`
- [ ] Create Webhook at https://app.lemonsqueezy.com/settings/webhooks
  - URL: `https://lolaicoach.gg/api/lemonsqueezy/webhook`
  - Events to subscribe (check all):
    - `subscription_created`
    - `subscription_updated`
    - `subscription_cancelled`
    - `subscription_expired`
    - `subscription_resumed`
    - `subscription_payment_failed`
  - Copy signing secret to `LEMONSQUEEZY_WEBHOOK_SECRET`

### Sentry

- [ ] Create project at sentry.io → Next.js
- [ ] Copy DSN to `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Create Auth Token (Settings → Auth Tokens) with `project:write` scope → `SENTRY_AUTH_TOKEN`
- [ ] Source maps upload is configured in `next.config.ts` via `withSentryConfig`

### Neon PostgreSQL

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Add the production connection string as the `PRODUCTION_DATABASE_URL`
      repository secret (GitHub → Settings → Secrets → Actions). Until this
      exists, `.github/workflows/migrate.yml` skips itself with a warning and
      every migration has to be applied by hand.
- [ ] Create read replica branch in Neon Console → Branches → Add Branch (read replica)
- [ ] Copy read-replica connection string to `DATABASE_READONLY_URL`

### Upstash Redis

- [ ] Provision via Vercel Marketplace (adds `KV_REST_API_URL` + `KV_REST_API_TOKEN` automatically)
- [ ] Or provision manually at console.upstash.com → create database → copy REST URL + token

---

## Every Deploy

**The build no longer applies migrations** (ADR-012). `vercel.json` runs only
`prisma generate && next build`, so a deploy succeeds whether or not the schema
is current — which means an unmigrated schema now surfaces as a runtime error
rather than a failed build. If the push contains anything under
`prisma/migrations/`, confirm it was applied.

- [ ] `git push origin main` — Vercel auto-deploys
- [ ] If the push added migrations: check the **Migrate Production** workflow run.
      If it skipped (no `PRODUCTION_DATABASE_URL` secret), apply them yourself:
      `DATABASE_URL="<production url>" npx prisma migrate deploy`
- [ ] Confirm nothing is pending: `DATABASE_URL="<production url>" npx prisma migrate status`
- [ ] Check Vercel deployment logs for build errors
- [ ] Run health check: `curl https://lolaicoach.gg/api/health`
  - Expected: `{"status":"ok","services":{"database":{"ok":true},"redis":{"ok":true}}}`
- [ ] Verify cron is registered in Vercel dashboard → Settings → Crons
  - `/api/cron/weekly-digest` — every Monday 09:00 UTC
  - `/api/cron/match-sync` — every hour

---

## Rollback

If a deploy causes issues:
1. Vercel dashboard → Deployments → click previous deployment → Promote to Production
2. Or: `git revert HEAD && git push origin main`
