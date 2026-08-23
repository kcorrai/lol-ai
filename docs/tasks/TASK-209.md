# TASK-209: Session-aware CTAs on marketing pages (Dashboard when logged in)

## Status: Done

## Problem

Logged-in users still see "Log In" + "Get Started Free" on the landing/marketing
pages. They should instead see a "Dashboard" action that takes them into the app.

## Context (verified)

- `MarketingHeader.tsx` is a client component but static (no session). SessionProvider
  is at the root layout, so `useAuth()` works on marketing/tools pages.
- `HeroSection.tsx` and the landing final CTA (`app/(marketing)/page.tsx`) are SERVER
  components with `/register` "Get Started Free" links → need a small client island.
- `useAuth()` returns `{ isAuthenticated, isLoading, ... }`.

## Scope

- `MarketingHeader.tsx`: when authenticated, replace the desktop "Log In + Get
  Started Free" with a single "Dashboard" button (→ /dashboard); mobile top CTA and
  the mobile dropdown likewise swap to "Dashboard". Default (loading/logged-out)
  keeps the current CTAs to avoid a hydration flash for anonymous visitors.
- New `StartFreeCta.tsx` (client): renders "Go to Dashboard → /dashboard" when
  authenticated, else "Get Started Free → /register". Reused in the Hero primary
  CTA and the landing final CTA so the whole landing page is consistent.

## Tests

tsc + lint + vitest green. Dev-server visual check of the logged-out landing (CTAs
unchanged, no console/hydration errors). Logged-in swap verified by the
`isAuthenticated` conditional (a real session can be checked on the deploy).

## Commit

`fix(marketing): show Dashboard CTA to logged-in users on landing/header`
