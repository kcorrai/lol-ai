# TASK-259 — Dialogs are not keyboard- or screen-reader-accessible

Status: **open — not yet implemented**

## Problem

Verified by reading the files: `src/components/ui/ConfirmDialog.tsx` contains **no** `role`, no
`aria-*`, no Escape handler and no focus management — a grep for all four returns nothing. It is a
plain `<div className="fixed inset-0 …">`.

Consequences, in order of severity:

- **Escape does not close it.** The only exit is clicking a button with the mouse.
- **Focus is not trapped or moved.** Tab walks straight out of the dialog into the page behind it,
  which is still fully interactive. A keyboard user can end up operating hidden content.
- **Screen readers do not announce it as a dialog**, so there is no indication the context changed.

`src/components/ui/UpgradeModal.tsx:62` has the related defect: the backdrop is a clickable `<div>`
with `onClick={onClose}` and no `role`, `tabIndex`, or key handler, so dismiss-by-backdrop is
mouse-only.

Related, lower severity: `src/components/shared/ChampionSelector.tsx:152` and the message input in
`src/domains/coaching/components/CoachingChatView.tsx:152` use `placeholder` with no `aria-label`.
Placeholder text is not an accessible name.

## Suggested approach

Do not hand-roll focus trapping. `@radix-ui/react-slot` is already a dependency, so
`@radix-ui/react-dialog` is the consistent choice — it provides the role, labelling, Escape handling,
focus trap and restore, and scroll locking, and is what shadcn/ui builds its Dialog on.

Per CLAUDE.md §2.1 adding it requires a `docs/DEPENDENCIES.md` entry and a rationale; the rationale is
that the alternative is reimplementing the WAI-ARIA dialog pattern by hand in two components.

Migrate `ConfirmDialog` first (it is the smaller surface and is used for destructive actions, where
an accidental keyboard activation is worst), then `UpgradeModal`. Add `aria-label` to the two inputs
as a separate, trivial commit.

## Tests

Component tests: Escape closes, focus moves into the dialog on open and returns to the trigger on
close, Tab stays within the dialog, and the dialog exposes an accessible name.

refs TASK-259
