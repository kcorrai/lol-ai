# TASK-174: Full English Translation — Batch 1 (App UI, Components, Errors)

## Status: Pending
## Score: 90/100

## Goal
Site is English-only from now on. Translate all Turkish user-facing strings
in place (no i18n framework). Batch 1 covers the app surfaces.

## Scope
- Translate: `app/(app)/**`, `app/(auth)/**`, `app/(team)/**`, `app/admin/**`,
  `src/components/**`, `src/hooks/**`, Zod/validation messages,
  ~70 Turkish API error strings in `app/api/**`
- Method: fan out per-directory batches to cheap subagents (Haiku), then verify
  with a Turkish-character sweep (`[ğıışçöüĞİŞÇÖÜ]` in string literals) — zero
  user-facing hits allowed for these paths
- Keep gaming terminology consistent (glossary: Şampiyon→Champion, Sıralama→Ranked, etc.)

## Out of Scope
- Emails, AI prompts, remaining domains (TASK-175)
- Marketing/landing copy (rewritten in TASK-177)

## Commit
`feat(i18n): translate app UI and API messages to English`
