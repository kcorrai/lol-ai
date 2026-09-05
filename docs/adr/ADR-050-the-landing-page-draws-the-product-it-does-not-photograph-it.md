# ADR-050: The landing page draws the product, it does not photograph it

## Status: Accepted

## Context

The landing page illustrated the product with real screenshots. `scripts/captureScreenshots.ts`
drove a headless browser over a running dev server, wrote nine JPEGs into `public/screenshots/`,
and two sections rendered them: `ProductShowcase` ("Inside the app") showed a wide dashboard
capture over three smaller ones, and `FreeToolsGrid` used six as tile backgrounds.

This was itself a correction. The tiles had been champion splash art, which was decorative and
silent about what the tools do, and the section before that used CSS mock-ups drawn against a
design that no longer shipped. Photographing the real thing was the obvious fix, and the
argument for it — "a visitor deciding whether to sign up is entitled to see the actual screens"
— is sound. What went wrong was the execution, in three ways that turned out to be inherent
rather than incidental.

**The captures were shown far smaller than they were taken.** The viewport was 1440x900. The
three supporting frames are about 400px wide and the six tool tiles about 400x180 — a 3.5x
reduction. At that scale no text in a screenshot survives, and all nine read as grey
rectangles with a green smudge. Nothing about the pipeline could fix this: the page's layout
sets those widths, and a capture narrow enough to survive them would be a picture of a
different, mobile, product.

**The lead capture collided with the page it sat on.** A full-page shot includes the app's own
top bar — the wordmark, the player-search field — which landed directly beneath the marketing
header's wordmark and player-search field. The result read as the page having embedded itself
in an iframe rather than as a photograph of a screen.

**They carried facts that expire.** The tier list burns its patch number into the header, so
`PATCH 26.16` was baked into a JPEG while the live site served 26.17, next to win rates that
had also moved. The script's own comments acknowledged both this and that the captures cut off
mid-row, which was concealed with a gradient over the bottom edge.

The codebase already had the alternative and a rule for when to reach for it. `SampleReport`,
`ArsenalVisuals`, `ArsenalBoards` and the three `desktop/*Visual.tsx` files draw their subject
in DOM, and `desktop/chrome.tsx` records the standing rule that screens a shot "cannot reach
honestly" keep their drawn illustrations — written for the desktop companion, which has no
signed build to photograph, and for `/coaching` and `/creator`, which are empty states on a
fresh account.

## Decision

Extend that rule to all of the landing page's product imagery: it is drawn, never captured.

- The four screens in `ProductShowcase` and the six marks in `FreeToolsGrid` are DOM, under
  `app/(marketing)/components/laneiq/screens/`.
- Every drawing is wrapped in `Illustration` (`desktop/chrome.tsx`), which supplies the
  `role="img"` label and the `// Illustration` caption. A picture of a product is read as a
  photograph of it unless something says otherwise; the caption is that something.
- Every drawing names, in a comment, the file whose structure and labels it reproduces. That
  citation is the only thing keeping a drawing in step with the screen it draws.
- No drawing carries a patch number, a live win rate, or anything else the page states
  accurately elsewhere. `TierListPreview` reads the real meta snapshot and is where a real
  patch number belongs.
- The capture pipeline is removed — `scripts/captureScreenshots.ts`, the
  `capture:screenshots` script, and `public/screenshots/`. Leaving it would leave an
  invitation to undo this.

## Consequences

**Gained.** The drawings are legible at the size they are actually shown, because they are
authored at that size. They cannot go stale on a patch, because they assert nothing that a
patch changes. They follow the token layer, so a palette change reaches them the way it
reaches every other component, and they cost no image bytes — about 970KB of JPEG left the
repository. Producing landing imagery no longer needs a running dev server, a seeded database
and a signed-in session; the section renders in CI like any other component.

**Paid.** A drawing does not update itself. When the dashboard's columns are rearranged or the
tier list gains a column, `DashboardScreen` and `TierListScreen` keep showing the old shape
until somebody edits them, and nothing fails to make that obvious — the cited file in each
comment is the only signal. This is a real regression against photographs, which were at least
wrong loudly. It is accepted because the photographs were unreadable, which is worse than
out of date, and because the drawings assert much less: structure and labels move far more
slowly than the numbers the captures carried.

**Also paid.** "Real screens, not mock-ups" was a claim the page made and can no longer make.
The section's subtitle now reads "Drawn from the real screens", which is weaker and true.

**Rejected.** Cropping each capture to one legible region and framing it was considered and
would have fixed legibility and the double-header collision, but not staleness, and it keeps a
pipeline that needs a seeded database and a login to run. Drawing costs one authoring pass and
removes all three problems.

**Not covered.** `app/(marketing)/components/ToolsInActionSection.tsx` also references
screenshots, at paths that do not exist. It is imported from nowhere and is not on the landing
page; this ADR does not decide its fate.
