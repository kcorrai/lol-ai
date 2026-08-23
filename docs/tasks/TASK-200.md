# TASK-200: Small compliance & config hygiene fixes

## Status: Done

## Goal

Three low-risk cleanups surfaced by the codebase audit.

## Scope

1. `src/lib/push/pushService.ts`: the VAPID subject fell back to
   `process.env.RESEND_FROM_EMAIL`, an env var that does not exist anywhere
   (`.env.example` defines `EMAIL_FROM`, and `VAPID_SUBJECT` already has a
   documented default). `EMAIL_FROM` is a display-name format
   (`Name <addr>`), invalid inside `mailto:`. Drop the phantom var and fall back
   to the same literal `mailto:` documented in `.env.example`.
2. `src/lib/utils/logger.ts`: `eslint-disable no-console` had no explanatory
   comment (CLAUDE.md 2.1). Add one — this file _is_ the logging service.
3. `.env.example`: document the optional, code-referenced vars that were missing:
   `RIOT_RATE_LIMIT_PER_SECOND`, `RIOT_RATE_LIMIT_BURST` (both default 20) and
   `E2E_MOCK` (test-only).

## Tests

Config/comment-only + a null-safe fallback; suite stays green, typecheck + lint clean.

## Commit

`chore(config): drop phantom env ref, document logger disable + optional vars`
