# TASK-289: Pre-application checklist for a Riot production key

## Status: Done

## Context

The product needs a Riot **production** key. Development keys expire every 24
hours, which has already broken production twice in two days, and a personal key
is not permitted for "public consumption". Before applying, the codebase needed
auditing against Riot's actual published policy rather than assumption.

## Decision

Produced `docs/RIOT_PRODUCTION_KEY_CHECKLIST.md`, structured by what the reader
can act on: hard blockers, decisions only the owner can make, verified-compliant
items with codebase evidence, points to state explicitly in the application, and
realistic timing.

Every row was checked against this repository. Claims sourced from Riot were
taken from their live policy pages, with the two genuinely unresolved areas
(trademark scope for API products, and the Policies-vs-Terms monetization
conflict) flagged as unresolved rather than papered over.

## Outcome

- **2 blockers:** production is not currently loadable by a reviewer (TASK-290),
  and domain verification via `riot.txt` has not been done.
- **3 owner decisions:** the "LoL AI Coach" name, declaring monetization, and B2B
  team plans against the scouting prohibition.
- **13 requirements verified compliant**, including the two that were open
  questions at the start: GDPR RTBF (closed by TASK-287) and the live-game
  feature (cleared by TASK-288).

The single highest-value finding is sequencing: the only verbatim Riot rejection
found in their public tracker was for a link that did not load. Applying while
production is broken would waste a review cycle measured in months.

## Consequences

The checklist is a living document — Riot policy changes and the audit is dated
2026-07-20. Re-verify before submitting if significant time passes.
