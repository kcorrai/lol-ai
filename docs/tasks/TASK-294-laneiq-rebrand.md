# TASK-294: Adopt the LaneIQ visual system and rebuild the landing page

## Goal

Replace the accumulated navy/gold visual system with LaneIQ (see
[ADR-015](../adr/ADR-015-laneiq-visual-system.md)) across the product, and rebuild
the marketing landing page to the composition authored against it.

## Scope

### 1. Token layer (product-wide)
- `tailwind.config.ts` — repoint the existing semantic color names to LaneIQ values,
  add the `ink` / `acid` / `line` / `fg` scales, collapse the `borderRadius` scale,
  repoint `font-sans` / `font-display` and add `font-mono`.
- `src/styles/globals.css` — LaneIQ CSS custom properties, the layered page
  background (grid + hero bloom), and the HUD utilities (`.notch`, `.notch-sm`,
  `.notch-lg`, `.tag-cut`, `.hud-label`, `.glow-accent`).
- `app/layout.tsx` — Orbitron, Chakra Petch and JetBrains Mono via `next/font`,
  replacing Inter and Rajdhani.

### 2. Hardcoded literal sweep
95 occurrences of `#C89B3C` / `#c89b3c` / `rgba(200,155,60,…)` across 42 files,
including transactional email templates and OG image templates that no token layer
reaches.

### 3. Landing page rebuild
`app/(marketing)/page.tsx` rebuilt to the design's composition:
sticky glass nav → full-bleed hero with the Riot ID form → live data strip →
sample report panel → champion pool audit → free tools → tier list → how it works →
pricing → closing splash → footer.

The rebrand is **visual only** — no section may lose functionality. Sections whose
job the design already does are served by a LaneIQ equivalent:

| Removed | Replaced by |
|---|---|
| `HeroSection` + `DemoSearchBox` | `LandingHero` + `AnalyzeForm` |
| `MetaSnapshotSection` | `TierListPreview` |
| `ToolsInActionSection` | `FreeToolsGrid` |
| `HowItWorksSection` | `HowItWorksStrip` |
| Final CTA block | `ClosingSplash` |

Sections with **no** counterpart stay on the page and are rendered as before:
`ProductDemo`, `FeaturesSection`, `TeamPlanSection`, `TestimonialsSection` — all
still wrapped in `Reveal`. They pick up LaneIQ colors from the token layer but keep
their own centred-marketing composition; harmonising them with the HUD language is
follow-up work, not a functional gap.

Now genuinely unreferenced (superseded, safe to delete when someone decides):
`HeroSection`, `HeroShowcase`, `MetaSnapshotSection`, `ToolsInActionSection`,
`HowItWorksSection`, `DemoSearchBox`. `PreviewResultCard` is **not** in this list —
`AnalyzeForm` renders it.

## Out of scope

- Moving individual product panels onto the notch motif. The token layer makes them
  consistent; the HUD signature lands per-panel in follow-up work.
- The dashboard redesign. Tracked separately as TASK-295.

## Acceptance

- [ ] No `#C89B3C` / `rgba(200,155,60` literal remains in `app/` or `src/`
- [ ] `npm run lint`, `npx tsc --noEmit` and `npm test` pass
- [ ] Landing page renders every section of the design at desktop and mobile
- [ ] `docs/adr/ADR-015` records the decision
