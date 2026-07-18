# TASK-212: Landing entrance animations

## Status: Done

## Goal
Landing sections should animate in as the user scrolls ("elementler animasyon ile gelsin").

## Scope
- `Reveal.tsx` (client): framer-motion wrapper — fade + rise into view once
  (`whileInView`, `viewport once`), honours `prefers-reduced-motion`.
- `page.tsx`: wrap MetaSnapshot, ToolsInAction, HowItWorks, ProductDemo, Features,
  TeamPlan and Testimonials in `<Reveal>`. Hero left instant (above the fold / LCP).

## Tests
tsc + lint + 352 tests green.

## Commit
`feat(landing): scroll entrance animations for sections`
