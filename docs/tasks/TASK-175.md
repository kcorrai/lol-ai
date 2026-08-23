# TASK-175: Full English Translation — Batch 2 (Emails, AI Prompts, Domains)

## Status: Pending

## Score: 88/100

## Goal

Finish the English conversion: transactional emails, AI prompt templates
(must produce English output), and remaining domain-layer strings.

## Scope

- Email templates (`src/lib/email*`, notification/invitation/reengagement) → English
- AI prompt templates (`src/lib/ai/**`, coaching/analysis/otp domains):
  rewrite instructions in English AND instruct English output; spot-check one
  AI output path in dev for quality
- Remaining `src/domains/**` Turkish strings; delete or translate leftover
  `src/domains/counter/data/counters/*` files if still referenced after TASK-167
- Final full-repo Turkish sweep (excluding docs/tasks history)

## Out of Scope

- Multi-language support

## Commit

`feat(i18n): translate emails, AI prompts and domain strings to English`
