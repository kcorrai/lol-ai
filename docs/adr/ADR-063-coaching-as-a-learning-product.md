# ADR-063: Coaching as a learning product, before payments exist

## Status: Accepted

## Context

LA-129 compared how Preply, italki, Metafy and others take a student from "I like
this coach" to a paid, repeated relationship. Two things came out of it.

**Money.** Real charging is blocked: Stripe does not onboard businesses in Turkey,
PayPal has been closed there since 2016, and Lemon Squeezy (ADR-004) prohibits
selling services, coaching included. Kaan chose the clean path: Stripe Connect
once the company abroad exists, exactly the driver ADR-020 already left room for.
So everything that depends on money — packages, subscriptions, a "try another
coach free" guarantee, service-fee lines — waits for that.

**Everything else did not need to wait.** The storefront sold single sessions to
people who could not ask a question first, had no trial, no reason to come back,
and no link from the AI analysis a player had just read. Code review also found
that the booking form never attached the student's Riot account, so the coach's
Session prep panel was empty on every real booking.

## Decision

The coaching section is treated as its own learning product, built on what this
codebase uniquely holds — the student's games — and without new services or
dependencies:

1. **A request page instead of an inline form**, with the student's own recent
   games to tick (and the account attached), a draft that survives sign-in, and an
   order summary showing the total, the answer window and the cancellation rule.
2. **Trials.** `coach_listings.isTrial`: at most 30 minutes, one per student per
   coach. A trial that was declined, expired or cancelled does not use it up, so
   the rule lives in `bookingService`, not in a database constraint.
3. **Ask before booking.** A thread no longer needs a booking. The gate that used
   to be "has booked" is now narrower limits (`questionGate.ts`): five new coaches
   a day, two messages until the coach replies. Contact redaction is unchanged.
4. **Matching.** A six-question "find my coach" page and an AI-report card both
   produce storefront URLs — coaches at least one tier above the player — and carry
   the student's goal into the request. Nothing is stored server-side.
5. **Session goals.** `session_goals`: up to three measurable targets (CS per
   minute, deaths, vision per minute, KDA) a coach sets once a session is agreed.
   Progress is read from the first ten ranked games after the goal, from stored
   match rows only — no AI, no Riot calls.
6. **Supply.** A "New on LaneIQ" strip for coaches with no rating (Wilson ordering
   always puts them last), and an optional YouTube intro video
   (`coach_profiles.introVideoUrl`), click-to-load on YouTube's cookie-less host —
   ADR-021's "we host no video" holds.
7. **Reach.** Session confirmations and reminders are also sent as a bot DM to
   users who linked Discord through the bot (ADR-035), using the existing token.

## Consequences

**Positive.** The student's path — find, ask, request, learn, come back — works end
to end without money moving, and each step uses data we already hold. All schema
changes are additive, so no worktree's Prisma client breaks on them.

**Negative.** Pre-booking messages reopen the door to off-platform deals that the
booking gate used to close; redaction and the limits reduce it, the terms of
service carry the rest. Goals measure only what match data can show — "play safer
after first back" has no column — so coaches will still write the rest in notes.

**Open.** Packages, subscriptions and the trial guarantee are designed around real
charges and come with the Stripe driver.
