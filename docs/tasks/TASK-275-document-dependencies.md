# TASK-275 — Document the undocumented production dependencies

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #13 (score 44): "20 of 38 production dependencies
undocumented". Re-measured today: **18 of 38**, the difference being TASK-276 removing
`@stripe/stripe-js` and TASK-271 adding (and documenting) `@radix-ui/react-dialog`.

## A nuance the finding missed

`docs/DEPENDENCIES.md` opens by scoping itself to "every production and development dependency
**added after the initial project scaffold**". By its own terms `next`, `react-dom`, `prisma`,
`@prisma/client` and `next-auth` were never in scope — they came with the scaffold. The backlog
counted all 38 against a document that never claimed to cover them.

CLAUDE.md §2.1 is likewise about the act of installing ("never `npm install` a package without
updating `docs/DEPENDENCIES.md`"), so the rule was not actually being broken by the scaffold entries.

That said, "which of these did we choose and why" is more useful than the technicality, so this
documents all 18 — with the scaffold ones grouped and kept brief rather than padded with invented
deliberation. Writing three paragraphs of fake rationale for `react-dom` would be worse than
writing one line.

## Approach

Two groups:

- **Scaffold** — arrived with `create-next-app` / `prisma init`. One line each, with a pointer to
  the ADR where a real decision exists (ADR-001 pins the Prisma major, ADR-003 records the auth
  library choice).
- **Chosen** — installed deliberately. Full treatment: what it does, why it and not the obvious
  alternative.

Where a package is one of a set that only makes sense together (`clsx` + `tailwind-merge` +
`class-variance-authority`; `react-hook-form` + `@hookform/resolvers` + `zod`; `@upstash/redis` +
`@upstash/ratelimit`), they are documented as a unit — that is how they were adopted and how they
would be removed.

## Acceptance criteria

- [x] Every production dependency appears in `docs/DEPENDENCIES.md` (38/38), and every dev dependency too (24/24).
- [x] Verified by script against package.json: 0 missing across both.
