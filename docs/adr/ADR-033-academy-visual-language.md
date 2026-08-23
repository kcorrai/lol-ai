# ADR-033: The Academy's visuals are borrowed assets and our own drawing, never our own video

## Status: Accepted

## Context

The Academy shipped sixty-one lessons (LA-21…LA-32) without a single image in any of them. A
lesson that says "the ward goes in the tri-brush" tells a Silver player where the tri-brush is
in words, and that is the one thing words are worst at.

The obvious answer is video, and it is the wrong one at this size. LA-42 recorded the reasoning
and Kaan's decision. Briefly: hosting 61 clips is tens of dollars a month, but _producing_ a
60–90 second clip that actually teaches a lesson — find the example, record it, cut it, annotate
it, caption it — is realistically 2–4 hours each. That is 120–240 hours, three to six weeks of
one person full time, and it goes stale every patch. There is nobody to do it. The card is open
in the backlog as a decision record, not as work.

That left the question this ADR answers: what _are_ the Academy's pictures made of?

Three sources were available:

1. **Riot's CDN assets** — Data Dragon item, champion, spell and rune icons; Riot's official
   ability preview clips on CloudFront. Already whitelisted in `next.config.mjs` for both
   `next/image` and the CSP, already wrapped by `ChampionIcon` / `ItemIcon` / `AbilityClip`.
2. **Our own drawing** — `RiftMap`, an SVG schematic of Summoner's Rift in a 0–100 box, written
   for the map drills.
3. **Screenshots and footage we capture ourselves** — the expensive option, and the one with an
   unanswered licensing question about building a subscription product's core content out of
   Riot's rendered game.

## Decision

The Academy's visual language is built from (1) and (2) only. Three block kinds carry it:

- `figure` — a row of Riot's own icons, addressed through a **curated catalogue**
  (`src/domains/academy/assets.ts`). A lesson names `"control-ward"`; it never writes `2055` and
  never writes a URL.
- `mapFigure` — `RiftMap` with numbered pins, in the same 0–1 coordinate space the map drills
  already use.
- `clip` — Riot's official ability preview, emitted **only** by the champion lesson generator,
  which is the one place that holds a champion's numeric key.

We host no video, store no image, and add no dependency. `public/` stays at its current 344 KB.

The catalogue is the load-bearing part of this decision. Content is authored by whoever is
writing the code, increasingly with a model's help, and a raw numeric id is exactly the kind of
thing that is plausible and wrong. A slug is checked by the compiler; an id is checked by a
reader looking at a live page. Champions are the one open set — there are too many to enumerate
— so `figures.test.ts` checks those names against the Data Dragon snapshot instead.

## Consequences

**Good**

- Zero marginal cost. Riot serves the bytes; we serve a URL string.
- Nothing goes stale on a schedule. An icon is versioned by `DDRAGON_VERSION` and a schematic is
  a shape.
- The teaching survives the images. Every `figure` note and every `mapFigure` pin renders as
  text beside its picture, and `RiftMap` is `aria-hidden` precisely so the numbered list under it
  is the content rather than a caption for it. A lesson read with images off loses nothing but
  the images.
- A wrong asset is a failed typecheck, not a hole on a live page.

**Bad**

- The schematic cannot show a brush, a camp or a wall. Map figures teach shapes — a half, a
  river mouth, an approach — and a lesson that needs to point at one specific bush still cannot.
  Accepted: the alternative is Riot's minimap art, which is theirs, and a screenshot, which is
  the expensive option this ADR exists to avoid.
- We are dependent on Data Dragon's id stability. An item Riot retires becomes a broken icon
  until the catalogue is edited — one line, in one file, caught by the next run of
  `assets.test.ts` only if the id stops resolving in shape rather than in fact.
- Ability clips exist only for champions Riot has published them for, which is why `AbilityClip`
  falls back to the poster rather than showing a black rectangle.

**Not decided here**

LA-42's tiers 2 and 3 — an animated diagram driven by `waveSim`, and an animation of the
player's own match built from the timeline we already fetch — are still open, and neither
requires filming anything either. This ADR does not rule on them; it rules that the pictures
come from Riot's CDN and our own SVG, which both of those obey.
