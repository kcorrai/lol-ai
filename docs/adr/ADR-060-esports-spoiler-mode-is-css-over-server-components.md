# ADR-060: Esports spoiler mode is CSS over server components

## Status: Accepted

## Context

A viewer catching up on a VOD saw the result before pressing play: series
scores, dimmed losers, bracket winners, head-to-head records, recent form and
tournament champions are on nearly every esports page (LA-123). A "hide
scores" setting had to cover all of them.

Almost every one of those pages is a server component with ISR — the hub every
5 minutes, league and tournament pages hourly — and the rows that show results
(`MatchRow`, `SeriesRow`, `BracketView`, …) are server components too. The
setting lives in the viewer's browser. Three ways to connect the two:

1. **Make the result components client components** that read the setting and
   render `?` instead of the score. Every list in the section would ship as
   client JavaScript, and the server's HTML would still carry the scores until
   hydration swapped them out — a flash of exactly what the setting hides.
2. **Put the setting in a cookie and render on the server.** Every esports page
   would become dynamic per viewer, giving up the ISR caches the section is
   built around (ADR-016) for a preference most readers never touch.
3. **Keep the HTML as it is and hide with CSS.** Components carry
   `data-spoiler*` attributes; rules in `globals.css` keyed off an attribute on
   `<html>` do the hiding.

## Decision

Option 3.

- Components only mark what gives a result away:
  - `data-spoiler` for a score or winner, which is masked behind a "?" chip;
  - `data-spoiler-outcome` for winner/loser styling, which is flattened;
  - `data-spoiler-rail` for a win/loss edge colour;
  - `data-spoiler-block` for a whole section, with a placeholder shown in its
    place.
- `data-hide-scores="true"` on `<html>` switches the rules on.
- An inline script in the esports layout (`spoilerScript.ts`) sets that
  attribute from `localStorage` as the HTML is parsed, before anything paints.
  A returning reader never sees a score flash.
- The preference is a persisted zustand store (`esportsPrefsStore`). It is
  client-only UI state, per CLAUDE.md §2.2. The time zone picker's preference
  lives in the same store. `SpoilerToggle` rehydrates the store after mount and
  keeps the attribute in step.
- One delegated click handler reveals a single result: it marks the nearest
  `data-spoiler-scope` as `data-revealed`, and stops the click from following
  the row's link.

Standings stay visible in spoiler mode. A league page without its table has
nothing left to say, and the toggle's tooltip says so.

## Consequences

- Every page stays statically cached and server-rendered, and the scores stay
  in the HTML for crawlers and for readers who never turn the setting on.
- Hiding is only as complete as the marking. **A new component that shows a
  result must add the attributes**, or it will show through spoiler mode.
- A client-side navigation into the section does not run the inline script. The
  toggle sets the attribute after mount, so on that path a score can show for a
  frame.
- A few signals remain on purpose: the number of games in a series' game
  switcher and on match pages, and page titles and meta descriptions, which are
  written for search.
