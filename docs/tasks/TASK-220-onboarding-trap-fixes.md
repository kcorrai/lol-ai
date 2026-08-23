# TASK-220 — Fix onboarding traps: missing connect anchor, no escape, full-screen block on missing target

## Status: In Progress

## Problem

A brand-new user (no Riot account) is permanently trapped on the forced first-journey
(TASK-217) at the "Enter your Riot ID" step. Nothing on the page is clickable.

Root causes:

1. **Missing spotlight anchor.** The `connect` step targets `data-tour="connect-form"`, but no
   element carries that attribute. `findTarget` returns null → `rect` is null → `SpotlightOverlay`
   renders its full-screen `inset-0` dim panel with `pointer-events-auto`, which absorbs _every_
   click on the page. Confirmed live: `connectAnchorExists:false`, `fullScreenBlock:true`,
   `connectButtonCovered:true`. Not caught in TASK-217 testing because it was verified with an
   account-holding user, for whom the connect step is fast-forwarded and never rendered.

2. **No escape from the forced flow.** The `connect`/`syncing`/`generate-report` steps advance
   only when a live gate flips (`hasAccount`/`hasMatches`/`hasCompleteReport`) — each a hard
   external dependency (valid Riot ID + Riot API, an account with ranked games, a working AI
   provider). Any failure leaves the user with no way forward and no way out.

3. **Full-screen block on any missing target.** The overlay cannot tell "centered step (dim
   everything on purpose)" from "target step whose anchor wasn't found (a bug)". The latter should
   never fully trap the user.

## Fix

1. Add `data-tour="connect-form"` to the connect form's `Card` (`Card` already spreads props).
2. **Escape hatch:** a subtle "Skip setup" control on the coach bubble → `dismiss()` (POST
   onboarding-complete + hide the overlay), so no gate can permanently trap anyone.
3. **Graceful degradation:** thread `hasTarget` into `SpotlightOverlay`; when `rect` is null but a
   target was expected, render a _non-blocking_ dim (`pointer-events-none`) so the page stays
   usable instead of freezing.

## Deliverables

- `AccountConnectionForm.tsx`: `data-tour="connect-form"` anchor.
- `useGuidedOnboarding.ts`: `dismiss()` + `stepHasTarget` in the returned state.
- `GuidedOnboarding.tsx`: pass `hasTarget` / `onDismiss` down.
- `SpotlightOverlay.tsx`: non-blocking fallback when a target is expected but unresolved.
- `CoachBubble.tsx`: "Skip setup" escape control.
- `guideSteps.test.ts`: assert every step `target` is in the known-anchor allowlist (regression
  guard that would have caught the missing `connect-form`).

## Verification

Log in as a no-account user (`fresh2@lolai.test`), reach the connect step: the form is
spotlighted and clickable, and "Skip setup" exits the journey. Drive it with Playwright MCP.
