# TASK-316 — Page titles say the brand twice

**Phase:** Maintenance
**Status:** Planned
**Estimated Effort:** 0.5 day

---

## Symptom

Every page that sets its own title renders the brand twice:

```
Log in | LoL AI Coach | LoL AI Coach
```

Found while investigating a console error on `/login` (the Station watchdog
quoted the title in its report).

## Root cause

`app/layout.tsx` defines a title template:

```ts
title: { default: "LoL AI Coach — …", template: "%s | LoL AI Coach" }
```

and 18 page-level `title` values across 15 files already end in
`| LoL AI Coach`, so the template appends a second copy.

Affected files include SEO-critical pages, not just auth screens:

- `app/(tools)/builds/[champion]/page.tsx` and `[role]/page.tsx`
- `app/(tools)/counters/[champion]/page.tsx`
- `app/(tools)/matchups/[slug]/page.tsx`
- `app/(tools)/tools/page.tsx`, `counter-picker`, `draft-analyzer`, `matchup`
- `app/(auth)/login|register|forgot-password|reset-password/page.tsx`
- `app/(app)/layout.tsx`, `app/(team)/layout.tsx`

## Why it matters

Google truncates titles around 55-60 characters, so on the pages built to rank
the duplicate eats the space that should carry keywords —
`"Ahri Build — Runes, Items & Skill Order | LoL AI Coach | LoL AI Coach"` loses
its tail. It also reads as a mistake to anyone scanning a tab strip or a SERP.

## Scope

- Strip the trailing `| LoL AI Coach` from every page-level `title`; the
  template supplies it.
- Two of the entries are `default` titles inside their own layout `title`
  objects rather than templated strings — check each before editing, because a
  `default` is *not* passed through the parent template and does need the brand.
- The esports section (TASK-298 onwards) already omits the suffix; use it as the
  reference.
- Add a note to the section in `CLAUDE.md` §7 or the frontend docs stating that
  page titles never include the brand.

## Acceptance Criteria

- [ ] No rendered title contains the brand twice — checked by crawling the
      routes in `app/sitemap.ts` and asserting on `<title>`
- [ ] Titles that are `default` values keep their brand
- [ ] Convention written down so the next page does not reintroduce it
- [ ] `tsc --noEmit`, lint and tests pass
