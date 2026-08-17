# ADR-023: What a rank badge is allowed to claim

## Status: Accepted

## Context

The competitor research found one thing consistently, and it is the opening for
this whole section: **nobody verifies a coach's rank.**

- Metafy's own help centre: *"no application, no waitlist, and no vetting."* The
  rank is a sentence in a bio. The only real gate is Veriff KYC before a coach
  can withdraw money.
- Fiverr has no gaming-specific vetting at all; "I will make you Challenger"
  sells for $10.
- The most rigorous found anywhere is GG Clan's three-stage review — and even
  that is a one-time onboarding gate, not a standing proof.

We are unusually placed to do better for free: every user already links a Riot
account, `rankedService` already reads their rank, and `rankSnapshotSweepService`
already refreshes it daily.

The temptation is to call that "verified". It is not, and the difference
matters.

**Riot Sign-On is the only sanctioned way to prove an account belongs to a
person.** It requires an approved production API key *and* a separate
invitation, and the odds and timeline of that invitation for a platform this
size could not be established. The predecessor mechanism, Third-Party Code, was
switched off on 7 March 2022. The "set this profile icon" trick is not a
current documented practice and, without a nonce and an expiry, proves nothing:
anyone can read a public icon id.

## Decision

**Three tiers, and the UI never shows a stronger claim than the tier supports.**

| `RankProofMethod` | What it proves | Label | Reachable |
|---|---|---|---|
| `SELF_REPORTED` | nothing | no badge | — |
| `PLATFORM_CHECKED` | this rank was read by us, from Riot, for a linked account, on this date | "Checked by LaneIQ · *date*" | **now** |
| `RIOT_VERIFIED` | the account belongs to this person | "Riot-verified" | blocked on an RSO invitation |

`PLATFORM_CHECKED` is what ships. The badge carries the date it was read and
goes stale after 36 hours; a cron refreshes every 6, so there are several
chances to catch one before a reader sees it marked out of date.

A rank floor in search (`minTier`) matches **only** checked proofs. A floor a
self-report could satisfy is not a floor.

## Consequences

**Positive.** We can say something true that nobody else in the category says at
all: this number was read from Riot, and here is when. It costs no extra Riot
calls — the sweep reads `ranked_history`, which the product already fills. The
enum carries all three tiers from the start, so arriving at `RIOT_VERIFIED` is a
service change rather than a migration.

**Negative.** We cannot claim account ownership, and a coach could in principle
link an account that is not theirs. The honest label is the mitigation, and it
is still strictly more than any competitor offers. A date that stops moving
turns the badge straight back into a stale self-report, which is why the refresh
cron is part of the feature rather than an optimisation.

**Open.** RSO approval. Applying needs a production key first and then a
separate invitation; nothing in the product should assume it arrives.
