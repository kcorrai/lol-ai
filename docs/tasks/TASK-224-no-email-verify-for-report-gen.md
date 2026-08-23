# TASK-224 — Don't require email verification to generate AI reports

## Status: In Progress

## Problem

`POST /api/coaching/generate` blocks report generation unless the user's email is verified
("Please verify your email address before generating AI reports.", 7.png). A brand-new user who
just wants a report is stopped. Email verification should only gate features that actually _send_
email (weekly report emails, activation), not in-app report generation.

## Fix

Remove the `emailVerified` check at the top of the generate route. Abuse is still bounded by the
existing rate limits (`FREE_GENERATE_LIMIT` / `PRO_GENERATE_LIMIT`) and plan caps
(`assertCanGenerateReport`, 1/day free). Email-delivery features keep their own `emailVerified`
checks (e.g. `sendActivationEmail`, weekly report emails) — untouched.

## Deliverables

- `app/api/coaching/generate/route.ts`: drop the `emailVerified` lookup + `Errors.emailNotVerified()`.
