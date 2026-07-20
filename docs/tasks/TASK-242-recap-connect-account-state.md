# TASK-242 — Season recap asks for an account instead of spinning forever

## Problem
4.png: `/recap` sat on "Preparing season recap…" indefinitely for a user with no Riot account.

## Cause
The generate effect early-returns when there is no `primaryAccount`, so the mutation never fires
and both `recap` and `error` stay null — which is exactly the condition the spinner branch
(`isPending || (!recap && !error)`) treats as "still working".

## Change
`app/(app)/recap/PageClient.tsx` — added a no-account branch ahead of the spinner: a
connect-account card explaining the recap is built from ranked games (and needs at least 5),
with a CTA to `/settings/accounts`. Gated on `!accountsLoading` so the real load still shows the
spinner rather than flashing the prompt.

refs TASK-242
