# Coach marketplace — launch checklist

**Board:** LA-19 · **Plan:** `docs/MARKETPLACE_PLAN.md` · **ADRs:** 019–023

The code for M0 → M20 is shipped. This is the list of things that are true about
running it, and the ones that have to become true before a stranger is allowed
to pay a stranger through it.

The section is safe to expose today **because no money moves**. Everything below
is written on that assumption; the moment the Stripe driver replaces `manual`,
the first block stops being optional.

---

## 1. Before real money — blocking

- [ ] **Stripe Connect account, live mode.** ADR-020 has the shape: destination
      charges, `application_fee_amount` for our cut, manual payout schedule so
      `HELD → RELEASED` stays ours to decide.
- [ ] **Replace the `manual` payment driver.** `src/domains/marketplace/services/payments/providers/`
      — a second file implementing the same interface. No table changes: the
      ledger columns were named after their Stripe counterparts on purpose.
- [ ] **Onboard payouts before the first paid booking.** A coach with
      `coach_payout_accounts.payoutsEnabled = false` must not be bookable. The
      column exists and is read; the Connect onboarding link does not exist yet.
- [ ] **Refund path tested against real Stripe test keys**, including the
      dispute resolution that reverses the transfer *and* the application fee.
- [ ] **Tax and invoicing decision.** Destination charges make us the merchant
      of record for the platform fee. Ask an accountant before the first payout,
      not after.
- [ ] **Terms of service covering the marketplace.** Off-platform arrangements,
      no-show policy, the 72-hour dispute window, what our cut buys. The product
      already tells people some of this; the terms have to agree with it.

## 2. Before the storefront is public — blocking

- [ ] **At least five approved coaches.** An empty storefront is worse than no
      storefront, and the first coaches have to be invited by hand — nobody
      applies to a marketplace with nothing in it. The empty state is honest,
      but it is not a launch.
- [ ] **An admin who is not you.** Applications land in `/admin/coaches` and the
      48-hour clock in `COACH_RESPONSE_HOURS` starts when a coach responds, not
      when we do. A queue nobody watches is the complaint that killed the
      competitors.
- [ ] **Inngest functions registered in production.** `refreshCoachRanks` and
      `marketplaceSweeps` are in the `functions` array at
      `app/api/inngest/route.ts`. Confirm both appear in the Inngest dashboard
      after deploy — the sweeps are what expire unanswered requests and
      auto-complete delivered ones. Without them bookings sit forever.
- [ ] **Email sending verified for the marketplace templates.** Booking
      requested, accepted, declined, expiring, reminder, delivered, review
      window open.

## 3. Operational — do once, then check quarterly

- [ ] **Commission is a per-profile column** (`coach_profiles.commissionBps`,
      default 2000 = 20%). Changing the default does not change existing
      profiles; that is deliberate, and it means a rate change is a migration
      decision, not a config edit.
- [ ] **Price bounds** are `MIN_PRICE_CENTS` 500 / `MAX_PRICE_CENTS` 100 000 in
      `policy.ts`. Revisit once there is a real price distribution.
- [ ] **Rank freshness.** `coach_rank_proofs.staleAt` drives the "checked on"
      date shown next to a badge. If `refreshCoachRanks` stops, badges go stale
      visibly rather than silently — verify that is still true after any change
      to the badge component.
- [ ] **Riot API budget.** The rank refresh is one request per approved coach
      per run. At a few hundred coaches this is nothing; at a few thousand it
      needs a queue of its own.

## 4. What is deliberately not done

These are not oversights. Each is written up with its reasoning.

| Not done | Where the decision lives |
|---|---|
| Real payments | ADR-020 — ledger first, driver later |
| Video hosting / embedded calls | ADR-021 — link plus timestamps, Mux and Daily costed as upgrade paths |
| `RIOT_VERIFIED` badge tier | ADR-023 — needs an RSO invite we do not have; the column and the UI branch are ready |
| Websockets for messaging | ADR-016 precedent — polling, same as live draft |
| Packages / bundles | Plan §6 — the single most damaging complaint in the category |
| Google / iCal calendar sync | Plan §6 — next round |
| AI anywhere in this section | Kaan's call, recorded in the plan. The product on sale is a person |

## 5. Verification that was actually run

- `npm run lint`, `tsc --noEmit` — clean.
- `vitest run` — 1896 tests across 188 files pass, including 100% pins on `policy.ts`,
  `transitions.ts`, `rating.ts` and `redact.ts` in `vitest.config.ts`.
- `npx playwright test --project=setup --project=marketplace` — 8 pass. Covers
  the public storefront signed out, the login wall on `/coach` and `/sessions`,
  canonical URL, and apply → approve → appear on the storefront.
- By hand against local Postgres: a booking driven through
  `PENDING_COACH → CONFIRMED → DELIVERED → COMPLETED`, and the refusal paths.

**Not covered by an automated test:** the two-account student side — booking,
delivery and the blind review reveal. It needs a second seeded session and a
coach with published hours, which is more than a smoke test should carry. The
rules underneath it are unit-tested and were driven by hand. If this section
grows a second E2E investment, that is where it goes.
