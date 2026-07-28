# TASK-291: Take `prisma migrate deploy` out of the build command

## Status: Done

## Context

The 2026-07-20 production deploy (`dpl_Hkg1x13FmF26aNv8ecgTs1sKEduk`, commit
`7a9aebb`) failed, and it failed in the _build_, not at runtime:

```
Error: P1001: Can't reach database server at ep-jolly-pine-aq09634u…:5432
Command "npx prisma migrate resolve … && npx prisma migrate deploy && …" exited with 1
```

Production is still serving `a70c57a` eight days later. Thirty-five commits —
including the TASK-282 egress fix that would _reduce_ the very quota pressure
that took the database down — cannot ship, because shipping them requires the
database to be up.

`vercel.json` sets:

```
buildCommand: npx prisma migrate resolve --rolled-back 20260607000012_analytics_indexes || true
              && npx prisma migrate deploy
              && npx prisma generate
              && next build
```

Two problems follow from this, both observed rather than hypothesised:

1. **A database outage becomes a deploy outage.** Schema migration is a release
   concern; compiling the application is not. Coupling them means the blast
   radius of an unreachable database extends to every change in the repository,
   including changes that do not touch the schema at all.

2. **Every deployment migrates, including previews.** Vercel uses the same
   `buildCommand` for preview builds unless overridden. Whatever `DATABASE_URL`
   is bound to the Preview environment is migrated on every branch push. If
   Preview resolves to the production database — not verifiable from here, it
   needs the dashboard — then a feature branch carrying a migration rewrites the
   production schema before anyone reviews it.

There is also a stale artefact in the command: the `migrate resolve
--rolled-back 20260607000012_analytics_indexes || true` prefix. It is a one-off
repair for a failed migration from 2026-06-07 that has been re-run on every
build since. It is inert now, but it is one more database round trip on the
critical path of every deploy.

## Decision

Reduce the build command to what actually builds:

```
npx prisma generate && next build
```

`prisma generate` reads `schema.prisma` from disk and needs no connection, so
the build no longer opens one on its own account.

Migrations move to an explicit step, run against production deliberately rather
than as a side effect of compilation. See ADR-012 for the mechanism and for the
alternatives that were rejected.

## Scope

- `vercel.json` — reduce `buildCommand`.
- `package.json` — the `build` script carries the same coupling for anyone
  running it locally; align it.
- `docs/DEPLOYMENT_CHECKLIST.md` — the migration step becomes something a human
  performs, so it has to be written down where a human will look.
- `docs/tasks/TASK-290-production-restoration.md` — its step 4 assumes the build
  migrates. Correct it.
- ADR-012.

Out of scope: making `next build` itself survive an unreachable database. That
turned out not to be needed — see the measurement below.

## Verification

Run on 2026-07-28 against the local Postgres cluster, using a closed port
(`127.0.0.1:5433`) to stand in for an unreachable database.

**The failure reproduces.** `prisma migrate deploy` against the closed port
exits 1 with `P1001: Can't reach database server` — the same error, same exit
code, that killed the production deploy. The step being removed is demonstrably
the step that fails.

**`next build` does not need the database.** With `NODE_ENV=production`, the
build was run twice — once with the database up, once against the closed port —
and the two runs produced an _identical_ set of errors. Not one additional
failure came from the database being gone. All 739 pages were generated in both
runs; the `generateStaticParams` implementations that read cached meta data
return `[]` when `getMetaSnapshot` yields null, so those routes fall back to
dynamic rendering instead of throwing. `metaStatsService` logged 36 `snapshot
fetch failed … using last-good` warnings and the build carried on.

This is the result that decides the scope of the change: removing `migrate
deploy` is not merely necessary for a database-independent deploy, it is
_sufficient_.

### Two measurement traps, both hit before the numbers meant anything

- **`NODE_ENV` was `development` in the shell.** `next build` then prerenders
  with the development build of `react-dom`, and the run fails on `/404`,
  `/500`, `/_not-found`, `/coaching/chat` and more, all reporting `<Html> should
not be imported outside of pages/_document`. It reads exactly like a broken
  application. It is an artefact of the environment. Vercel sets
  `NODE_ENV=production` via `vercel.json`, so this never happens there. The
  first two runs of this experiment were invalid for this reason, and had they
  been believed they would have reported a production-blocking build failure
  that does not exist.
- **Three routes fail on Windows regardless of anything in this task.** The
  `opengraph-image` routes under `(tools)` throw `TypeError: Invalid URL` from
  `fileURLToPath` inside `next/dist/compiled/@vercel/og` — a path-handling
  problem on Windows, present with the database up and down alike. It is
  unrelated to migrations and is not evidence about production, which builds on
  Linux. Both comparison runs carry it, which is what makes them comparable.

**Not verified here:** that the Vercel build succeeds end to end. The local
build cannot prove that while the `@vercel/og` routes fail on Windows. What is
proven is the difference between database-up and database-down, which is the
claim this change rests on.

- `npm run lint`, `npm run typecheck`, `npm test` stay green.

## Note on the correction to TASK-290

TASK-290 records "four migrations have never been applied to production" and
lists `webhook_event_processed_nullable` and `20260720000003` separately. These
are the same migration — the directory is
`20260720000003_webhook_event_processed_nullable`. Three migrations are
outstanding, not four:

- `20260720000001_add_duo_partner`
- `20260720000002_add_match_participant_puuid_index`
- `20260720000003_webhook_event_processed_nullable`
