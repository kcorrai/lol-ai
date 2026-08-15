# TASK-309 — Public search API and the autocomplete bar

Depends on [TASK-308](./TASK-308-player-search-index.md) for the index this reads.

## Goal

Put a tracker.gg-grade search box in front of the product: type part of a name, get real accounts
back while typing, click one, land on a profile. No login, no linking, no waiting.

## The problem being fixed

Finding a player required knowing their exact Riot ID *and* picking the right platform, then
pressing a button. Every one of those is a place to be wrong, and being wrong returned "not
found" rather than a suggestion. The one search box that existed lived below the fold of the
landing page; no other page had one at all.

## Change

- `app/api/public/search/route.ts` — `GET /api/public/search`. No auth, Zod-validated,
  150/min per IP.
- `src/lib/riot/regions.ts` — the platform list, previously copied inside `AnalyzeForm`.
- `src/lib/stores/searchStore.ts` — recent and favourite players. Client-only UI state, so
  zustand rather than TanStack Query, and persisted so a signed-out visitor keeps their
  shortcuts.
- `src/components/search/` — `PlayerSearchBar` (input, keyboard, selection), `SearchDropdown`
  (the panel), `RegionPicker`, `usePlayerSearch` (debounced fetch), `buildSearchRows` (what the
  panel shows), `searchTypes`.
- Mounted in `MarketingHeader`, `TopBar` and the landing hero's `AnalyzeForm`.
- `docs/API_DESIGN.md`.

## Three decisions

**No native `<select>` for the region.** TASK-295 removed every one of them from the product
because the OS paints the option list as a white panel no stylesheet reaches. `RegionPicker` is
the same chamfered-chip pattern as `RiotAccountSelector`.

**The landing hero keeps both paths.** Picking a suggestion goes straight to the public profile —
that is the no-friction path. The Analyze button beside it still runs the inline AI preview on
whatever is in the box. Nothing that was there was removed; the plain input simply became a
suggesting one. One behaviour did change: with suggestions on screen, Enter opens the top match
instead of submitting the form, which is what a search box is expected to do.

**The header breakpoint moved from `md` to `lg`.** The 62px bar could not hold four nav links, a
CTA and a search box at tablet widths. Below `lg` the hamburger now carries all three.

## Not a dead end when the index misses

The index only knows players who have shared a match with one of our users. Type a complete
`Name#TAG` it has never seen and the last row is "// Search Riot directly", which opens the
public profile page — that page resolves the Riot ID against Riot itself. So an incomplete index
costs a suggestion, never an answer.

## Tests

`buildSearchRows.test.ts` — favourites before recents, no duplicate row for a player who is both,
shortcut lists dropped once a query is typed, the direct row appearing only for a complete Riot ID
the index missed, and the typed casing surviving onto it.

`PlayerSearchBar.test.tsx` — arrow-key walking, Enter on the highlighted row, Enter with nothing
highlighted taking the top match, wrap-around, Escape closing without navigating, favouriting
without navigating, and the empty-result message.

`route.test.ts` — the payload, the 400s, the 429 that never reaches the index, and the empty list
a failing index answers with. Also asserts `seenCount`/`lastSeenAt` stay server-side.

**Found by the test, fixed in the component:** arrow-up from nothing highlighted entered at the
*first* row rather than the last, because `-1` fell through the modulo.

## Verified against the running app

`GET /api/public/search?q=ka` returned eight players from seeded history, mixed-case
(`KAE#BTW`, `Kaguya#Lowq`), with the connected account first and carrying the icon and level that
participant rows do not. `q=kaanproak0%23TR1` narrowed to one, `region=zz9` answered 400, and a
single character answered an empty list. The landing page renders both search boxes with the
chip, not a native select, and the public profile route still answers 200.

refs TASK-309
