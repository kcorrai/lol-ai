# TASK-308: The draft room throws for signed-out visitors — no QueryClient

## Symptom

`/draft` returns `200` but renders nothing below the heading. The served HTML
contains:

```
No QueryClient set, use QueryClientProvider to set one
```

The page's `<h1>` survives (it is server-rendered); everything from
`CreateDraftForm` down is replaced by the error boundary. `/draft/<code>` fails
the same way — which is the whole room.

## Root cause

`app/(tools)/layout.tsx` renders two different trees (TASK-237):

```tsx
if (session?.user) return <ToolsAppChrome>{children}</ToolsAppChrome>;  // mounts QueryProvider
return <MarketingHeader /> … {children} … <MarketingFooter />;          // does not
```

Only `ToolsAppChrome` mounts `QueryProvider`. Every free tool built before this
one is server-rendered, so nothing anonymous ever needed React Query — and the
one component that did, `LiveGameButton`, works around it by gating on
`useSession` and rendering nothing for anonymous visitors:

> The inner component uses React Query, and the tools layout only mounts
> QueryProvider for signed-in visitors (TASK-237) — so the hook must not run for
> anonymous ones.

That workaround cannot apply here. The draft room is login-free by design
(`docs/DRAFT_ROOM.md` §4) and every part of it — polling, the catalogue, the
mutations — is React Query. Gating it on a session would delete the feature for
its intended audience.

Nothing caught this because the component tests mock the hooks, the route tests
mock the service, and no test renders a public tool page inside the real layout.

## Fix

Mount `QueryProvider` in the anonymous branch of `app/(tools)/layout.tsx`.

Not nested inside the draft routes only: a second provider under the signed-in
branch's existing one would mean two clients and two caches on the same page,
which is a subtler bug than the one being fixed. One provider per branch, at the
layout that already forks.

**Cost.** Anonymous visitors to every free tool now load the React Query runtime.
It is already a dependency and already shipped to the signed-in branch of these
same pages; the marginal cost is the provider itself.

## Follow-up, not done here

`LiveGameButton`'s `useSession` gate exists only to dodge this. It can be
simplified now, but it is a different component with its own reason to check for
a session (it needs a Riot account), so it is left alone rather than changed
speculatively.

## Done when

- `GET /draft` serves the create form in its HTML, with no `No QueryClient`.
- `GET /draft/<code>` serves the room.
- The signed-in branch still mounts exactly one provider.
- A test renders a client component that calls `useQuery` inside the anonymous
  tools layout tree, so the next public tool to reach for a hook does not
  rediscover this.
