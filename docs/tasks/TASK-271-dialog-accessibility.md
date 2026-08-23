# TASK-271 — Make the dialogs keyboard- and screen-reader-accessible

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #8 (score 64). Supersedes the investigation filed as
TASK-259. Unblocked by TASK-261 — until vitest could render components there was no way to test any
of this.

## Problem

`ConfirmDialog.tsx` is a plain `<div>` overlay. Verified absent: `role`, any `aria-*`, an Escape
handler, and any focus management. The consequences:

- A screen reader does not announce it as a dialog, and does not associate the title or the
  description with it.
- Focus stays wherever it was — usually the button that opened the dialog, which is _behind_ the
  overlay. Tabbing walks straight into the page underneath, which is still fully interactive.
- Escape does nothing.
- Focus is not restored when it closes.

This guards **destructive actions** (removing a team member), which is what lifts it above a routine
a11y nit: a keyboard user can reach and activate the page behind a confirmation prompt.

`UpgradeModal.tsx:62` has a related but smaller problem — its backdrop is a clickable `<div>` with
no keyboard equivalent, so dismissing it is mouse-only.

## Approach

Use `@radix-ui/react-dialog` rather than hand-rolling the WAI-ARIA dialog pattern. Focus trapping,
focus restoration, `aria-modal`, the Escape handler, scroll locking and inert background content are
exactly the things that are easy to implement subtly wrong.

**The public prop contract does not change.** Both components are mounted conditionally by their
parents (`TeamDashboard.tsx:171`) or take an `open` prop (`UpgradeModal`). Radix's `open` is wired
internally so no call site has to change.

One deliberate behaviour addition: while `isPending`, Escape and outside-click are suppressed. The
buttons are already disabled during a destructive action in flight, so allowing the same dialog to
be dismissed by keyboard would be inconsistent.

## Dependency

`@radix-ui/react-dialog` — new. `@radix-ui/react-slot` was already a dependency, so this is the same
family rather than a new vendor. Recorded in `docs/DEPENDENCIES.md` per CLAUDE.md §2.1.

## Tests

`ConfirmDialog.test.tsx` already exists from TASK-261 and acts as the regression net for the
behaviour that must survive the rewrite (labels, callbacks, the pending guard). Adding:

- exposes an accessible dialog role, named by its title and described by its description
- Escape triggers cancel
- Escape does nothing while pending
- focus moves into the dialog on open

`UpgradeModal.test.tsx` (new) — renders nothing when closed, closes on Escape, has an accessible
name.

## Acceptance criteria

- [ ] Both dialogs expose `role="dialog"` with an accessible name and description.
- [ ] Escape closes; focus is trapped and restored.
- [ ] Pending destructive actions cannot be dismissed.
- [ ] Existing TASK-261 tests still pass unchanged — the contract is the same.
- [ ] Full suite, typecheck, lint clean.
