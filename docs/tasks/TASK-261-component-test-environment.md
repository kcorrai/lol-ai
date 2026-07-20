# TASK-261 — Component test environment (jsdom) + honest coverage scope

## Status: Done

## Context

`docs/BACKLOG-SCORED-2026-07-20.md` finding #6 (score 82). Measured coverage is 28.08%
statements (1716/6111), but the denominator is wrong in two ways:

- `vitest.config.ts` sets `coverage.include: ["src/**/*.ts"]`, so **`app/` is excluded entirely** —
  all 122 API route handlers are unmeasured as well as untested. CLAUDE.md §5.2 requires 70% for
  API route handlers.
- `.tsx` is excluded from coverage, and `environment: "node"` means component tests **cannot run
  at all**. There are 0 `.test.tsx` files in the repo, and that is a config consequence rather
  than neglect.

This task removes the config blockers. It does not attempt to raise coverage — that is the point
of the tasks it unblocks (TASK-259/271 dialog a11y needs a component harness; TASK-262 needs the
route harness).

## Scope

1. Add a jsdom environment so `.test.tsx` files can run, without changing the environment for the
   existing 590 node tests.
2. Add `@testing-library/*` so component tests have a rendering API.
3. Widen `coverage.include` to cover `app/**` and `.tsx`, so the reported number reflects the
   whole application rather than the subset that happens to be tested.
4. Prove the harness works with one real component test — not a placeholder.
5. Record the new dependencies in `docs/DEPENDENCIES.md` with rationale (CLAUDE.md §2.1).

## Out of scope

- Writing component tests for existing components (separate tasks).
- The API route test harness (TASK-262).
- A CI coverage threshold (TASK-280) — widening the denominator will *lower* the reported
  percentage, so the gate must come after the tests it gates.

## Acceptance criteria

- [x] `npm run test` passes with all existing tests green (no environment regressions) — 595 passed
      (590 existing + 5 new).
- [x] At least one `.test.tsx` renders a real component and asserts on the DOM —
      `src/components/ui/ConfirmDialog.test.tsx`.
- [x] `npm run test:coverage` reports `app/**` and `.tsx` files in the denominator.
- [x] `docs/DEPENDENCIES.md` lists every added package with a rationale.
- [x] `npm run typecheck` and `npm run lint` clean.

## Result

Coverage denominator went from 6111 to 11858 statements, so the **reported number dropped from
28.08% to 15.69%**. Nothing got worse — the previous figure was measuring a subset. Treat 15.69% as
the first honest baseline.

## Notes

- Vitest 4 removed `environmentMatchGlobs`; the supported way to run two environments in one repo
  is `test.projects`. The `node` project keeps `environment: "node"` so existing tests are unaffected.
- **Gotcha:** tsconfig sets `jsx: "preserve"` (Next.js compiles JSX itself). Vite reads that and
  leaves JSX untransformed, so the first `.test.tsx` failed to parse. Fixed with
  `oxc: { jsx: { runtime: "automatic" } }` on the dom project — note Vite 8 is rolldown-based, so
  the key is `oxc`, **not** `esbuild` (an `esbuild` block is silently ignored).
- Pre-existing, unrelated: Vite 8 now prints a deprecation notice for `vite-tsconfig-paths`
  (`resolve.tsconfigPaths: true` is native). Not touched here — no task, CLAUDE.md §2.1.
