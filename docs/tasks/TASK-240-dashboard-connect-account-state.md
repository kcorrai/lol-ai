# TASK-240 — Dashboard shows a "connect your account" state instead of an endless skeleton

## Problem
A signed-in user with no Riot account connected saw the dashboard skeleton forever (2.png):

```tsx
if (accountsLoading || !accounts || accounts.length === 0) return <PageSkeleton />;
```

Loading and empty were collapsed into the same branch, so "nothing to show yet" rendered as
"still loading". Nothing told the user what to do, and there was no way forward from the page.

## Change
- `src/components/dashboard/dashboardView.ts` (new) — pure `resolveDashboardView(accountsLoading,
  accountCount)` returning `"loading" | "no-account" | "ready"`. Splitting the decision out keeps
  it unit-testable; the component tree isn't (vitest here has no JSX setup).
- `src/components/dashboard/ConnectAccountPrompt.tsx` (new) — the no-account state: what the app
  needs, a primary "Connect Riot Account" CTA to `/settings/accounts`, and a secondary link to the
  free tools so the page is never a dead end for someone not ready to link an account.
- `app/(app)/dashboard/PageClient.tsx` — branch on `resolveDashboardView`: skeleton only while
  loading, prompt when there are no accounts. `DevRestartOnboarding` still renders in both.

The onboarding tour is unaffected: its connect step targets `data-tour="connect-form"` on
`/settings/accounts`, which this state links to rather than replaces.

## Tests
`dashboardView.test.ts` — loading wins over empty, empty vs populated, and loading-with-cached-
accounts (a background refetch must not flip a populated dashboard back to the prompt).

refs TASK-240
