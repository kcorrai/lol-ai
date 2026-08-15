# TASK-310 — Rebuild the public profile on LaneIQ

Depends on [TASK-309](./TASK-309-player-search-bar.md), which made this page the destination of
every search.

## Goal

Make the page a search lands on worth landing on: LaneIQ rather than the pre-rebrand visual
system, ten matches rather than five, and a role split — without one extra Riot call in the
common case.

## What was wrong

`app/(marketing)/s/[region]/[gameName]/[tagLine]/page.tsx` was the one surface the TASK-294
rebrand never reached. It shipped `rounded-2xl` cards, `#C6FF3D`/`#f87171` literals inline, and
"LoL AI Coach" in its own title and OG tags. Three deeper problems sat underneath:

1. **It was a second implementation of the preview.** `src/lib/riot/publicSummoner.ts` duplicated
   `previewService.buildAccountPreview` — same Riot calls, same aggregation, minus the one-day
   cache. Every profile view was uncached.
2. **It fetched everything twice.** `generateMetadata` and the page component each called it, so
   one page view meant twelve Riot calls where six would do.
3. **Missing a player was a dead end.** A typo produced a 🔍 emoji and a link home.

## Change

- `app/(marketing)/s/loadProfile.ts` — wraps `buildAccountPreview` in React's `cache()`, so
  metadata and page share one load, and maps Riot errors to `not-found` / `rate-limited`.
- `app/(marketing)/s/components/` — `ProfileHero`, `ProfileChampions`, `ProfileRoles`,
  `ProfileMatches`, `ProfileNotFound`. The page itself is now composition.
- **Deleted** `src/lib/riot/publicSummoner.ts`. It had exactly one caller, which no longer calls
  it; leaving a duplicate fetch path behind would be worse than removing it.
- `src/lib/riot/rankDisplay.ts` — tier colours, labels and position labels, previously copied in
  both the page and `PreviewResultCard`. Both now import it.
- `previewService.ts` — `MATCH_DEPTH = 10`, and the depth is now part of the cache key.
- `app/api/public/preview/route.ts` — rate limit 10/hour → 60 per 10 min.

## The rate limit was the friction

Ten previews an hour per IP is a hard stop after ten looks, in a product whose pitch is that
looking is free. It made sense when every request was an uncached six-call Riot fan-out. It is
not needed now that each target is cached for a day: the limit only has to stop someone walking
the entire player base.

## A miss is now another search

`ProfileNotFound` says which platform was searched, explains that the tag matters and that a name
on one platform does not exist on another, and puts a search box under it. It also sets
`robots: noindex` — a page component cannot set a status code, so without that a typo'd URL is a
soft 404 that Google would index.

## Tests

`loadProfile.test.ts` — the happy path, an unknown region short-circuiting before Riot is called,
and Riot throttling kept distinct from a missing player, because only one of those is worth
retrying. React's `cache` only exists in the server build, so the test shims it.

`ProfileRoles.test.tsx` — the split read off the sample, ordered by games played, with per-role
win rates, and nothing rendered at all when there are no matches.

## Verified against the running app

The page answers 200 and renders `// Champion pool`, `// Role split`, `// Last 10 matches` and
`// Read`, with no `rounded-2xl` and no colour literals. A missing player renders the search-again
state with `noindex, follow`.

**Caught this way:** the first run still said "Last 5 matches". The cache key did not include the
depth, so a day-old five-match payload was being served to a page claiming ten. Fixed by putting
the depth in the key.

refs TASK-310
