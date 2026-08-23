# ADR-020: A provider-neutral ledger, and Stripe as a driver

## Status: Accepted

## Context

Kaan's instruction was to build the system first and add Stripe to the site
afterwards. That leaves a question the instruction does not answer: what does a
booking's money look like in the meantime?

The existing payment provider is **LemonSqueezy** (ADR-004), chosen because it
is a merchant of record and handles VAT. That is the right shape for selling our
own subscriptions and the wrong shape for this: a marketplace pays a third party
out of money a student paid us, and a merchant of record does not do that.

Research into Stripe Connect for this specific problem turned up the shape it
would take: a **destination charge** carrying an `application_fee_amount`, with
the coach's account as `transfer_data.destination`; the hold done with a manual
payout schedule (Stripe is explicit that it "doesn't provide escrow services");
`Payout.create` to release; and
`Refund.create({ reverse_transfer: true, refund_application_fee: true })` to
return.

## Decision

**`booking_payments` is a ledger, not a mirror of a provider's object**, and the
provider is a driver behind a four-verb interface: `charge`, `release`,
`refund`, plus the account lookup.

The only driver today is `manual`, which advances the states and settles
nothing. The states are real from the start:

| Booking reaches                                        | Money becomes |
| ------------------------------------------------------ | ------------- |
| `PENDING_COACH`, `CONFIRMED`, `DELIVERED`, `DISPUTED`  | stays `HELD`  |
| `COMPLETED`                                            | `RELEASED`    |
| `DECLINED`, `EXPIRED`, either cancellation, `REFUNDED` | `REFUNDED`    |

Settlement is driven by the booking's status rather than called separately for
each outcome, so the money and the booking cannot disagree.

The provider columns already hold what Stripe needs: `providerPaymentId` ↔
`PaymentIntent.id`, `platformFeeCents` ↔ `application_fee_amount`,
`providerTransferId` ↔ `Transfer.id`, and `coach_payout_accounts` ↔ the
connected account.

## Consequences

**Positive.** Adding Stripe is a driver registration, not a schema change or a
rewrite of everything that reads the ledger. The expensive part of marketplace
payments is the state machine, and building it under a provider that cannot take
a payment means every wrong assumption surfaced without a refund attached.
Booking economics are snapshotted onto the row, so a rate change cannot rewrite
what a settled session was worth.

**Negative.** The UI has to say plainly that nothing has been charged, and does
— letting a student assume otherwise is the exact grievance that fills these
platforms' reviews. Two payment providers will coexist once Stripe lands
(LemonSqueezy for subscriptions, Stripe for the marketplace), which is more
surface than one but is the honest consequence of them being different problems.

**Open.** Whether the platform holding funds before remitting them raises
money-transmitter questions was not resolvable from Stripe's own documentation
and needs counsel before real money moves. Connect's structural claim is that
funds never pass through the platform's possession; that should be confirmed
rather than assumed.
