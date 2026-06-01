# TASK-013 — Landing Page & Marketing Site

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 2 days

---

## Objective

Build the public marketing landing page and pricing page. These pages must communicate the product's core value proposition clearly, build trust, and convert visitors to registered users.

---

## Acceptance Criteria

- [ ] Landing page (`/`) is static-generated (SSG)
- [ ] Page loads in < 1.5 seconds (Lighthouse performance ≥ 90)
- [ ] Hero section: headline, subheadline, primary CTA ("Get Started Free"), product screenshot/mockup
- [ ] "How it works" section: 3 steps (Connect → Analyze → Improve)
- [ ] Features section: 4 key features with icons and descriptions
- [ ] Social proof section: testimonial quotes (placeholder for MVP, real for launch)
- [ ] Pricing page (`/pricing`) shows Free vs. Pro comparison table
- [ ] Pricing page CTA links to `/register`
- [ ] Both pages are SEO-optimized (title, meta description, OG tags)
- [ ] Mobile responsive
- [ ] Navigation header: logo, "Pricing" link, "Login" link, "Get Started" CTA button

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
