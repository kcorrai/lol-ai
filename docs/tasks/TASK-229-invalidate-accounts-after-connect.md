# TASK-229 — Connected account doesn't appear until hard refresh

## Status: In Progress

## Problem

On `/settings/accounts`, submitting the connect form navigates to `/dashboard`, but returning to
the accounts page shows no account — only a full page refresh reveals it. `AccountConnectionForm`
POSTs `/api/riot/connect` via `fetch` and calls `router.push`/`router.refresh`, but never
invalidates the React Query `["riot-accounts"]` cache that `useRiotAccounts` reads. Client
navigation back to the accounts page serves the stale (empty) cached list; a hard refresh builds a
fresh QueryClient and refetches.

## Fix

After a successful connect, `queryClient.invalidateQueries({ queryKey: ["riot-accounts"] })` before
navigating, so the list refetches on the next render.

## Deliverables

- `src/domains/riot/components/AccountConnectionForm.tsx`: invalidate `["riot-accounts"]` on success.

## Verification

Playwright: log in, connect an account, navigate back to `/settings/accounts` (client nav, no
refresh) → the account is listed.
