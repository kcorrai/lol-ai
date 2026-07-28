# ADR-012: Run migrations as a release step, not as part of the build

## Status: Accepted

## Context

`vercel.json` ran `prisma migrate deploy` as the first thing in `buildCommand`,
so every deployment opened a database connection before it compiled a single
file.

On 2026-07-20 this turned a database problem into a delivery problem. The Neon
transfer quota was exhausted, the database refused connections, and the deploy
failed at `migrate deploy` (`P1001`). Eight days later production is still
serving `a70c57a`: thirty-five commits are stuck behind an outage that none of
them caused, and one of them is the fix for the egress pattern that exhausted
the quota in the first place. The system could not deliver its own remedy.

The coupling has a second consequence that had not been noticed. Vercel applies
the same `buildCommand` to preview deployments. Every branch push therefore runs
`migrate deploy` against whatever `DATABASE_URL` the Preview environment
resolves to. If that is the production database, an unreviewed migration on a
feature branch reaches production schema before the pull request is opened.

Migrating during the build is a common default because it is the least
configuration. It is not the same as being correct: building an artefact and
changing the shape of live data are different operations, with different
failure modes, different reversibility, and different people who should be
watching.

## Decision

`buildCommand` becomes `npx prisma generate && next build`. `prisma generate`
reads `schema.prisma` from disk, so the build no longer needs a database.

Migrations run as a separate, deliberate release step:

- **Automated path** — `.github/workflows/migrate.yml`, on push to `main`,
  running `prisma migrate deploy` against a `PRODUCTION_DATABASE_URL` repository
  secret. The job skips itself when the secret is absent, so the workflow can
  land before the secret exists without turning CI red.
- **Manual path** — `npm run db:migrate` with `DATABASE_URL` set to production.
  This is the bridge until the secret is configured, and the break-glass route
  whenever the workflow cannot run.

The stale `migrate resolve --rolled-back 20260607000012_analytics_indexes ||
true` prefix is dropped. It repaired a failed migration on 2026-06-07 and has
been a no-op on every build since.

## Consequences

**Code can now be deployed against a schema that has not been migrated.** This
is the real cost, and it is not hypothetical — it is the failure mode the old
coupling prevented by construction. Two things contain it:

1. _Migrations must be backward-compatible with the currently deployed code._
   Expand first, contract later: add nullable columns and new tables freely;
   never rename or drop in the same release that stops using them. This is a
   discipline, not an enforcement, and it is the discipline this ADR trades for
   deliverability.
2. The migration job and the Vercel build both start from the same push and run
   concurrently, so ordering between them is not guaranteed. Under
   expand-then-contract, a brief window where new schema exists and old code is
   still serving is harmless, and so is the reverse for additive changes.

**A deploy no longer fails when the database is unreachable.** That is the
point, and it was measured rather than assumed: with `NODE_ENV=production`,
`next build` produces an identical set of errors whether the database is up or
pointed at a closed port. The prerender paths that read cached meta data return
`[]` and fall back to dynamic rendering; nothing throws. `migrate deploy` was
the only step that actually required a connection.

**Preview deployments stop migrating anything.** Whatever the Preview
environment's `DATABASE_URL` pointed at, it is no longer written to during a
build.

**Migrating becomes a thing someone has to know about.** The knowledge moves out
of `vercel.json` and into `docs/DEPLOYMENT_CHECKLIST.md`, where it can be
forgotten. The automated path exists precisely so that the manual one is the
exception.

## Alternatives rejected

**Keep `migrate deploy` in the build but make it non-fatal (`|| true`).** This
is strictly worse than either option: the deploy proceeds, the schema silently
does not change, and the application runs against a schema it does not expect.
It converts a loud build failure into a quiet runtime one.

**A protected admin API route that runs migrations on demand.** Puts a schema
mutation tool on the public request surface, where it must be authenticated,
rate limited, and audited forever. The value does not justify the permanent
attack surface.

**Point Preview at a separate database and keep migrating in the build.** This
fixes the preview problem but leaves the primary one untouched: production still
cannot deploy while the database is down. Worth doing on its own merits;
unrelated to this decision.
