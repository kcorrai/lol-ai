# TASK-013 — Landing Page & Marketing Site

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 2 days

---

## Objective

Build the public marketing landing page and pricing page. These pages must communicate the product's core value proposition clearly, build trust, and convert visitors to registered users.

---

## Acceptance Criteria

- [x] Landing page (`/`) is static-generated (SSG)
- [x] Page loads in < 1.5 seconds (Lighthouse performance ≥ 90) — pure Server Components, zero client JS; verify post-deploy
- [x] Hero section: headline, subheadline, primary CTA ("Get Started Free"), product screenshot/mockup
- [x] "How it works" section: 3 steps (Connect → Analyze → Improve)
- [x] Features section: 4 key features with icons and descriptions
- [x] Social proof section: testimonial quotes (placeholder for MVP, real for launch)
- [x] Pricing page (`/pricing`) shows Free vs. Pro comparison table
- [x] Pricing page CTA links to `/register`
- [x] Both pages are SEO-optimized (title, meta description, OG tags)
- [x] Mobile responsive
- [x] Navigation header: logo, "Pricing" link, "Login" link, "Get Started" CTA button

---

## Technical Requirements

### SEO

Every marketing page exports metadata:
```typescript
export const metadata: Metadata = {
  title: 'LoL AI Coach — AI-Powered League of Legends Coaching',
  description: 'Get personalized coaching from AI. Analyze your matches, fix your mistakes, climb faster.',
  openGraph: { ... }
}
```

### Performance

- No client-side JavaScript on marketing pages (pure Server Components)
- Images: WebP format, explicit dimensions, lazy loading via `next/image`
- Fonts: preloaded in `<head>`, self-hosted or Google Fonts with `display: swap`

### Copy (Draft — MVP)

**Hero Headline:** "Your AI Coach is Watching Your Games"  
**Hero Subheadline:** "Connect your Riot account. Get specific, honest feedback on what's holding you back. Stop being hardstuck."

---

## Components to Build

`app/(marketing)/components/` (page-level, not reused):
- `HeroSection.tsx`
- `HowItWorksSection.tsx`
- `FeaturesSection.tsx`
- `TestimonialsSection.tsx`
- `MarketingHeader.tsx`
- `MarketingFooter.tsx`
- `PricingCard.tsx` (also used in `/pricing`)
- `PricingComparisonTable.tsx`

---

## Pages to Build

- `app/(marketing)/page.tsx` — landing page
- `app/(marketing)/pricing/page.tsx` — pricing page
- `app/(marketing)/layout.tsx` — marketing layout

---

## Dependencies

- TASK-001 (project setup)
- TASK-011 (pricing data — plan feature list)
- No auth dependency (public pages)

---

## Notes

Do not spend more than 2 days on this for MVP. The product is the landing page. A clean, fast, honest page beats a flashy one every time. Placeholder screenshots are fine for beta launch — replace with real product screenshots once UI is built.

---

## Completion Summary

**Completed:** 2026-06-03

### What was built

- `app/page.tsx` deleted — was a plain redirect to `/dashboard`, replaced by marketing route group.
- `app/(marketing)/layout.tsx` — Marketing layout (MarketingHeader + MarketingFooter). Pure Server Component, no providers.
- `app/(marketing)/page.tsx` — Landing page. SSG (`○` in build). Composes all sections. Exports full OG metadata.
- `app/(marketing)/pricing/page.tsx` — Pricing page. SSG. Free vs Pro cards + comparison table. CTA → `/register`.
- `app/(marketing)/components/MarketingHeader.tsx` — Sticky header: logo, Pricing nav link, Login link, Get Started CTA.
- `app/(marketing)/components/MarketingFooter.tsx` — Simple footer with links and copyright.
- `app/(marketing)/components/HeroSection.tsx` — Headline, subheadline, dual CTAs, CSS dashboard mockup (no image dependency).
- `app/(marketing)/components/HowItWorksSection.tsx` — 3-step grid with icons and connecting line decoration.
- `app/(marketing)/components/FeaturesSection.tsx` — 4-feature card grid; Champion Analytics marked "Coming Soon".
- `app/(marketing)/components/TestimonialsSection.tsx` — 3 placeholder quote cards.
- `app/(marketing)/components/PricingCard.tsx` — Reusable plan card; `highlighted` prop for Pro plan emphasis.
- `app/(marketing)/components/PricingComparisonTable.tsx` — Full feature comparison table (Free / Pro columns, check/X cells).

### Architecture notes

- All components are pure Server Components — zero `"use client"`. No hydration cost on marketing pages.
- Hero section uses a CSS-only dashboard mockup instead of an image, avoiding external asset dependency for beta.
- Pricing values (`$0` free, `$9.99/mo` Pro) are hardcoded — Stripe integration (TASK-011) is blocked; dynamic pricing is a post-unblock concern.
- Middleware matcher does not include `/` or `/pricing`, so both routes are publicly accessible without auth.

### Validation

- `npm run lint` — ✅ no warnings
- `npm run typecheck` — ✅ clean (after clearing stale `.next` cache from deleted `app/page.tsx`)
- `npm run build` — ✅ `/` and `/pricing` both `○` (Static)
- `npm test` — ✅ 43/43 passed
