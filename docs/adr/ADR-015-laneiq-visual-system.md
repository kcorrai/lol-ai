# ADR-015: Adopt the LaneIQ visual system

## Status: Accepted

## Context

The product shipped with an ad-hoc visual system: a `#0A0E1A` navy ground, a
`#C89B3C` gold accent, Rajdhani/Inter type, and generously rounded corners. It was
never specified anywhere — it accumulated. The consequences showed up as 95
hardcoded gold literals across 42 files, a body gradient mixing an indigo tint with
a gold tint for no stated reason, and no rule for when a surface is raised versus
inset.

A design system ("LaneIQ") was authored in Claude Design against the same product
brief, together with a landing page composition built on it. It specifies tokens,
type, motion, and — more importantly — the rules those tokens obey: one rationed
accent, near-zero radii with chamfered corners carrying the shape instead, mono for
every numeral, and layered rather than flat backgrounds.

The choice was between scoping it to marketing and rebranding the whole product.
Scoping it would have left a visible seam at the login boundary, and the dashboard
was already queued for the same treatment.

## Decision

Adopt LaneIQ as the product-wide visual system, applied at the token layer.

The existing Tailwind semantic color *names* (`background`, `surface`, `border`,
`text`, `accent`, `success`, `danger`, `warning`) are kept and their *values*
repointed to LaneIQ. The ~300 component files already consume those names, so the
palette change reaches them without edits. Two further global levers do the rest:

- The Tailwind `borderRadius` scale is collapsed (`xl`/`2xl` → 4px), which retires
  rounded corners everywhere at once rather than across 143 files.
- The font variables are repointed, so `font-sans`/`font-display` pick up Chakra
  Petch and Orbitron in place of Inter and Rajdhani.

Only genuinely hardcoded values — the 95 gold literals — require a per-file sweep.

New LaneIQ-native scales (`ink`, `acid`, `line`, `fg`) and HUD utilities (the notch
clip-paths, grid and scanline backgrounds, accent glow) are added alongside for work
authored against the system directly.

## Consequences

**Gained.** One accent with a stated rationing rule, so "the number that matters"
has somewhere to be loud. A shape language that does not depend on border-radius
fashion. Numerals in a tabular mono face, which the product needs — it is a data
product and its columns never lined up before. A written source of truth, so the
next 95 literals do not accumulate.

**Paid.** Every screen changes appearance in one commit. Components that leaned on
gold-specific contrast, or on roundness to separate a card from its ground, need
visual review; the token layer makes them *consistent*, not automatically *good*.
Transactional email and OG image templates carry inline colors that no token layer
reaches, so they were swept by hand and will drift again unless watched.

**Deferred.** Per-component adoption of the notch motif is incremental. Panels stay
square-cornered until each is deliberately moved onto `--clip-notch`; nothing breaks
in the meantime, but the HUD signature is only partly present until that pass ends.

**Rejected.** Scoping the system to `app/(marketing)` was rejected because a player
crossing from the landing page into the dashboard would have changed brands mid-flow.
