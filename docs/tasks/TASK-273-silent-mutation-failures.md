# TASK-273 — Surface disconnect and set-primary failures

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #11 (score 50).

## Problem

`ConnectedAccountsList.tsx` renders `sync.isError` (line 86-88) but nothing for the other two
mutations on the same card. `useDisconnectAccount` and `useSetPrimaryAccount` are both
`useMutation<_, Error, string>`, so a rejection lands in `.error` and is then thrown away.

The user experience of a failed disconnect is that they press **Confirm** and _nothing happens_.
No message, no spinner, no change — the row stays exactly as it was. The most likely real rejection
is the deliberate one: `CANNOT_DISCONNECT_FREE_PLAN` from `authorization.ts:32`. The button is
already hidden for free plans via `canDisconnect`, but a stale subscription query renders it, and
then the explanation the API took the trouble to write is discarded.

Same for "Make Primary".

## Approach

Mirror the pattern already used for `sync` a few lines above, so the card gains no new vocabulary.

Two details worth getting right rather than copying blindly:

- The disconnect confirmation stays open on failure. Collapsing it back to the idle "Disconnect"
  button would hide the error the user needs to read.
- The message is announced (`role="status"`), because the visual change is far from the button that
  was pressed and a screen-reader user gets no feedback at all otherwise.

## Tests

`ConnectedAccountsList.test.tsx` (new) — the component has none. Uses the jsdom project from
TASK-261.

- a failed disconnect shows the server's message
- the confirmation stays open after a failure, so the message remains visible
- a failed set-primary shows its message
- the happy path shows no error
- errors are scoped to the card whose mutation failed

## Acceptance criteria

- [ ] Both mutations surface their error message.
- [ ] Failure does not silently reset the confirmation state.
- [ ] Full suite, typecheck, lint clean.
