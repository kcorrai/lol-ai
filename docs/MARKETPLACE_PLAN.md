# Coach Marketplace — Master Plan

**Status:** In progress
**Decisions:** ADR-019 (role model), ADR-020 (payment architecture),
ADR-021 (session delivery), ADR-022 (availability and timezones),
ADR-023 (rank verification tiers)
**Board:** LA-19 · **Tasks:** M0 → M20

---

## 1. Why build this

LaneIQ sells software. It reads a player's matches, analyses them, generates an
AI report, and charges a subscription for the privilege. What it has never sold
is the thing a stuck player actually asks for: **a person who will look at their
games and tell them what they are doing wrong**.

That market exists and is transacting today. What it does not have is a trust
layer. Metafy — the category leader, $25M raised — states its own position
plainly in its help centre: *"no application, no waitlist, and no vetting."* A
coach types their rank into a bio and that is the whole of the claim. Fiverr
carries "I will make you Challenger" for $10. The most rigorous vetting found
anywhere in the category is GG Clan's three-stage review, and even that is a
one-time onboarding gate rather than a standing proof.

The complaint that follows is the same everywhere, and it is not about coaching
quality. Metafy's Trustpilot reviews cluster on: money taken up front, coach
goes unresponsive, refund refused on a policy technicality that nobody outside
the company can reconstruct.

**Both of those are things this codebase is unusually well placed to fix.**

Every user here already has a Riot account linked (`riot_accounts`), their rank
is already read (`rankedService.getCurrentRank`), and a daily rank snapshot cron
already runs (`rankSnapshotSweepService`). So the number on a coach's profile
does not have to be a sentence they wrote — it can be a value we read from Riot
and refresh every day. No competitor does this. It costs us almost nothing.

And a marketplace built on a recorded state machine — every transition written
to `booking_events` with an actor and a reason — cannot produce the second
complaint, because there is no such thing here as a refusal nobody can account
for.

### What we are careful not to claim

Riot Sign-On is the only sanctioned way to prove an account belongs to a person,
it requires a production API key *and* a separate invitation, and the odds and
timeline of that invitation for a platform our size are unknown. The old
Third-Party Code mechanism was switched off in March 2022. The profile-icon
trick is not a current practice and, without a nonce, proves nothing anyway.

So the badge has tiers and the labels are honest (§4). What we can say today is
*"we read this rank from Riot and it is dated"*, not *"Riot confirmed this is
their account"* — and even the first is more than anyone else in the category
offers.

## 2. What is being built

| Cluster | Surface | Who it is for |
|---|---|---|
| Discovery | `/coaches`, `/coaches/[slug]` | public, indexable |
| Becoming a coach | `/coach/apply`, admin review queue | applicants, us |
| Running a coaching business | `/coach/*` — profile, listings, availability, dashboard | approved coaches |
| Booking and receiving | `/sessions`, booking flow, delivery views | students |
| Keeping it honest | reviews, disputes, notifications, `booking_events` | both, and us |

Three session kinds, all human-delivered:

- **`VOD_REVIEW`** — async. Student supplies match ids or a video link and a
  goal; the coach returns a written summary plus timestamped annotations. No
  calendar involved, a delivery deadline instead.
- **`LIVE_SESSION`** — a scheduled 1:1 call on a meeting link the coach supplies.
- **`LIVE_SPECTATE`** — the coach watches the student's live games and debriefs.

## 3. Architecture at a glance

The section has **its own shell**, not the dashboard's. Kaan's call, and the
right one: a coach here is running a business (bookings, hours, students,
earnings) and a student is dealing with a person — neither of those is "look at
my last twenty games", and hanging them off the player sidebar would make both
read as a sub-tab of something else. One link in the dashboard sidebar leads
here, the same shape Esports uses, and one small link leads back. A section you
enter, not a page you pass through — but never a trap.

```
src/domains/marketplace/            new bounded context, isolated like esports/ and riot/
├── index.ts                        the ONLY import surface for the rest of the app
├── types.ts                        our types, not Prisma's rows
├── policy.ts                       the rules as numbers: commission, windows, deadlines
├── transitions.ts                  the booking state machine, as a table
├── slots.ts                        pure availability → free slots (timezone-correct)
├── rating.ts                       pure Bayesian average + Wilson lower bound
├── redact.ts                       pure contact-detail stripping
├── services/                       one narrow service per concern (15, all under 250 lines)
│   └── payments/                   provider-neutral ledger + drivers
└── components/                     section-specific UI

app/(market)/                       the section's own route group and shell
├── layout.tsx                      MarketChrome — own wordmark, own nav, no sidebar
├── coaches/…                       public, ISR, indexable — the acquisition surface
├── coaches/[slug]/                 public coach profile
├── coach/                          the coach console (auth-gated by middleware)
└── sessions/…                      the student's own side, in this section too
app/admin/coaches/…                 review queue and dispute resolution
app/api/coaches/…                   thin handlers over the services
src/inngest/functions/…             expiry, auto-completion, reminders, rank refresh
```

Rules this obeys: no cross-domain imports except through `index.ts`, no business
logic in route handlers, no component fetching directly, services under 250
lines, components under 200.

**No new npm dependency.** Messaging polls through React Query rather than
opening a socket, matching the precedent set for the draft room; reminders run
on the Inngest we already have; email goes through the Resend we already have.

## 4. The rank badge

| Tier | What it proves | Label | Available |
|---|---|---|---|
| `SELF_REPORTED` | nothing | no badge, plain text | — |
| `PLATFORM_CHECKED` | the rank on a linked account, as we read it, dated and refreshed daily | "Rank checked by LaneIQ · *date*" | **now** |
| `RIOT_VERIFIED` | the account belongs to this person | "Riot-verified" | blocked on an RSO invitation |

`RankProofMethod` carries all three from the start so the third tier is a
service change rather than a migration when RSO arrives.

## 5. Task sequence

Each task is one commit. M0–M8 are the spine and ship in order; M9–M20 are
independently shippable once the spine exists.

| Task | Title | Ships |
|---|---|---|
| M0 ✅ | Reconcile the schema drift (LA-15) | prerequisite — `migrate dev` becomes trustworthy |
| M1 ✅ | Domain foundation — schema, migration, policy, state machine | data layer, no UI |
| M2 ✅ | Coach application + admin review queue | the way in |
| M3 ✅ | Checked rank badge + daily refresh | the differentiator |
| M4 ✅ | Profile editing + listings | what a coach sells |
| M5 ✅ | `/coaches` search + public profile | first public page |
| M6 ✅ | Availability + slot computation | calendar correctness |
| M7 ✅ | Booking flow | the transaction |
| M8 | Payment ledger (manual driver) | money, modelled but not moved |
| M9 | Student sessions + coach dashboard | both sides' home |
| M10 | Async VOD review delivery | the async product |
| M11 | Live session delivery | the live product |
| M12 | Live spectate delivery | the third product |
| M13 | Session prep — the student's own data, shown to their coach | no AI, raw data |
| M14 | Messaging + contact redaction | the relationship |
| M15 | Two-sided blind reviews | reputation |
| M16 | Expiry, cancellation, auto-completion sweeps | the promises kept |
| M17 | Disputes + admin resolution | the promise of last resort |
| M18 | Notifications and reminders | attendance |
| M19 | Rate limiting and hardening | abuse |
| M20 | E2E, docs, launch checklist | launch readiness |

## 6. Non-goals for this section

- **No AI.** Not one call, not one AI table read. The product on sale is a
  person; the generated report is a different product and already exists.
- **No money moves yet.** The ledger and its state machine are real from day
  one; the only driver settles nothing. Stripe is a driver, not a rewrite.
- **No bundles or packages.** The most damaging complaint in the category is a
  partially-used package that cannot be refunded under any circumstance. One
  booking is one session.
- **No video hosting.** We store, transcode and serve nothing (ADR-007,
  ADR-018). A VOD review runs against a link or a match id.
- **No websockets.** Messaging polls, for the same reason the draft room does.
- **No group classes, courses, or calendar integration.** Later, if ever.

## 7. Risks

| Risk | Mitigation |
|---|---|
| RSO invitation never arrives | The badge has honest tiers from the start; nothing promises what we cannot prove |
| Timezone and DST errors — the subtlest failure class here | Weekly rules stored as wall-clock time and resolved per calendar day, never once; `slots.ts` is pure and heavily tested (ADR-022) |
| Liquidity: an empty marketplace helps nobody | Empty states and a waitlist ship with the storefront; the first coaches are invited by hand |
| Off-platform leakage | Restricted pre-booking messaging plus redaction. Not preventable, but measurable |
| A payment provider arriving later than the state machine | The ledger's columns already hold what a destination charge needs (ADR-020) |
| Disputes becoming unaccountable, as they are elsewhere | Every transition is in `booking_events` with an actor and a reason |

## 8. Definition of done for the section

- M0–M20 shipped, each as one commit.
- A user can apply, be approved, and appear on `/coaches` with a dated rank badge.
- A student can find a coach, book each of the three session kinds, receive the
  delivery, and review it; the coach can review the student, and neither sees
  the other's review until both are in or the window closes.
- No booking status ever changes without a `booking_events` row.
- No import bypasses `src/domains/marketplace/index.ts`.
- Zero new npm dependencies.
