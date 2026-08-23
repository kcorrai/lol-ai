# TASK-248 — Visual patch meta report

## Problem

7.png: `/meta` opened with a ~160-word paragraph as the first thing on the page, and the ▲/▼ rank
deltas collided with champion names.

## The collision was a real layout bug

In `MoverList.tsx` the champion `Link` had no `min-w-0`/`truncate` and the delta badge no
`shrink-0`, so in a ~420px column longer names ("Mordekaiser", "Tahm Kench", "Twisted Fate") ran
under the badge. Truncating alone wouldn't have been enough — the row was carrying name + delta +
WR/PR/BR + games + a counters link on one line. It is now two lines: champion and delta on top,
stats and the link below.

## Change

- `MetaHero.tsx` (new) — the single biggest winner and loser as large splash-art cards with the
  rank delta as the dominant number and a green/red wash for legibility over art of varying
  brightness.
- `AbilityClip.tsx` (new, client) — Riot's official ability clip via the existing
  `abilityVideoUrl` helper (`src/lib/ddragon.ts:91`), already used by `/champions/[name]`. Zero
  production cost and it updates itself every patch.
  - `preload="none"` and play-on-hover, not autoplay: the poster carries the page and the webm is
    only fetched when someone actually points at a card.
  - A CDN miss or blocked autoplay falls back to the splash image rather than a black rectangle.
  - `priority` on the hero posters — they are the page's LCP element, which Next flagged once the
    hero went in.
- `page.tsx` — hero above the winner/loser grid; `metaSummary` moved below it into a `<details>`
  ("Read the full patch breakdown"). The text stays in the HTML: TASK-186 added it for Google's
  scaled-content rules, so deleting it would cost rankings. Numeric champion ids for the clips come
  from `fetchAllChampions()`, which `MetaMover` doesn't carry.

## Verified live

`/meta` — zero name/delta overlaps across all 20 rows at both 1200px and 900px viewports; hero
cards render Mordekaiser (▲129) and Jayce (▼35); summary present in the DOM (157 words) and
collapsed by default; both `<video>` elements sit at `networkState: 1` (idle) on load, confirming
they cost nothing until hovered.

Playback itself was confirmed by calling `play()` directly — `readyState: 4`, 8.7s of 1056px video
streaming from the CDN, and `media-src` in `next.config.mjs` already allows that host. **The hover
trigger could not be exercised through Playwright**: React's synthetic handlers don't fire from
its dispatched events in this dev setup (the same quirk recorded for `.click()`), so hover-to-play
is worth a quick check in a real browser.

Also caught in review: `formatGames` already appends "k", so the shortened `…}g` suffix rendered
"62kg". Restored to "62k games".

refs TASK-248
