# ADR-057: Landing demos animate only what the product does

## Status: Accepted

## Context

The landing page now has three looping demos: the hero card (`HeroDemo`) plays a Riot ID
being read and graded, the Draft Room panel (`DraftDemo`) plays one full fearless draft, and
the desktop band (`OverlayDemo`) moves the overlay's "This game" readings. Moving pictures
make promises that a still drawing does not. A drawing of a build panel says "here is a build".
The same panel ticking off purchases says "it follows your purchases live", and the real one
does not: it is patch-wide advice, kept static because Riot forbids guidance driven by live
game state.

## Decision

A landing demo may only move what the real feature moves, in the order the real feature
moves it.

- The script is a pure function of elapsed time, in its own `*Timeline.ts` file with tests.
- Where the product has the rule as data, the demo reads it instead of copying it. The draft
  demo plays `DRAFT_SEQUENCE` from `@/domains/draft`.
- Numbers come from the page's existing sample (the sample report, the overlay drawing's
  resting values), so a demo and the still beside it describe the same player and game.
- Every demo is labelled as an example or illustration, runs only while on screen with the
  tab in front (`useDemoClock`), and shows its finished frame under reduced motion.
- A demo is `aria-hidden`. The real control or copy next to it carries the meaning.

## Consequences

- The overlay demo moves one panel out of three. That is less lively than it could be, and
  it is also true.
- A demo must fit in its container's rhythm: the draft plays in six seconds because
  `ArsenalTabs` rotates every seven.
- A new demo costs a timeline file and its tests, not only a component.
