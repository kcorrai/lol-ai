# TASK-286: Run the dev server on Turbopack

## Status: Done

## Context

Local development felt slow. Measured on Next 14.2.35 with the default Webpack
dev bundler, first visit to a route:

| Route              | Webpack | Turbopack                      |
| ------------------ | ------- | ------------------------------ |
| `/`                | 12.6s   | (19.4s — includes server boot) |
| `/tools`           | 14.9s   | 4.6s                           |
| `/meta`            | 13.3s   | 4.0s                           |
| `/tools/tier-list` | 13.6s   | —                              |

Warm renders were 0.05–0.08s in both cases, and a fresh render of an
already-compiled page (cache-busted query string) stayed at 0.06s. So the cost
is per-route on-demand compilation, not request handling and not the database
— `localhost:5432` refuses instantly rather than hanging, so the unreachable
local Postgres contributes no measurable latency.

## Decision

Add `--turbo` to the `dev` script, and bake in the standing `-p 3001`
preference so the port no longer has to be passed by hand.

`nextConfig` defines no custom `webpack()` function — the `webpack` key in
`next.config.mjs` is an option of Sentry's `withSentryConfig`, not Next's
bundler hook — so Turbopack is not silently discarding build configuration.

## Consequences

- ~3x faster per-route cold compile in dev.
- Sentry's webpack plugin does not run under Turbopack, so dev-mode
  auto-instrumentation is absent. Production builds are unaffected: `next
build` still uses Webpack.
- If Turbopack ever misbehaves, `npm run dev -- --no-turbo` is not a thing;
  drop the flag from the script instead.
