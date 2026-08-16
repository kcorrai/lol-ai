# TASK-317 — Region options are unclickable while the suggestions panel is open

**Phase:** Maintenance
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Symptom

Type anything into the player search box, then try to switch platform with the
region chip: the menu opens, but clicking an option does nothing. The pointer
never reaches the option. Switching region works only from a search box that has
not been focused yet.

Found while investigating "player search doesn't work" on a fresh local
database: the seeded account is on `euw1`, the box defaults to `tr1`
(`DEFAULT_REGION`), so the natural recovery — change the region — was itself
blocked.

## Root cause

`PlayerSearchBar` renders two overlays that start at the same Y and share a
stacking level:

| Overlay | Positioned against | Classes |
|---|---|---|
| Suggestions | `rootRef` (whole bar) | `absolute left-0 right-0 top-[calc(100%+6px)] z-50` |
| Region listbox | `RegionPicker`'s own wrapper | `absolute right-0 top-[calc(100%+6px)] z-50` |

The region chip sits inside the bar and is `h-full`, so both overlays resolve to
the same top edge. With equal `z-index` the later element in DOM order wins, and
the suggestions panel is rendered after the chip — so it covers the options.

Nothing closes the suggestions first: the panel only closes on a mousedown
*outside* `rootRef` (`PlayerSearchBar.tsx`), and the region chip is inside it.

Confirmed in the browser — `document.elementFromPoint()` at the centre of the
`EUW` option returns the suggestions panel's empty-state `<p>`, not the option.

## Scope

- Let `RegionPicker` tell its parent when the menu opens, and have
  `PlayerSearchBar` close the suggestions panel at that moment, so the two
  overlays are never open together.
- Reopen the suggestions once a region is chosen, so the results for the newly
  selected platform are visible without a second click on the input.
- Raise the region listbox above the suggestions panel so a future overlay
  cannot reintroduce the same interception.

Out of scope: `DEFAULT_REGION` itself, and the emptiness of `player_index` on a
fresh database — both are working as designed.

## Acceptance Criteria

- [x] With a query typed, opening the region menu and clicking an option changes
      the region
- [x] After choosing a region the suggestions panel shows results for it
- [x] The region menu still opens and closes from an untouched search box
- [x] Regression test covers the "query typed, then switch region" path
- [x] `tsc --noEmit`, lint and tests pass

## Verification

The jsdom test asserts the suggestions panel is gone once the menu opens — it
cannot see a pointer interception, so the click itself was replayed in a real
browser: type a query, open the chip, click `EUW`. Before the fix that click
timed out against the panel; after it the chip reads `EUW` and the panel reopens
on the new platform.

Confirmed the test earns its place by reverting the handler to a no-op — the new
case fails, the other twelve still pass.
