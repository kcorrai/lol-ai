# ADR-022: Weekly hours are wall-clock, resolved per day

## Status: Accepted

## Context

A coach says "I am free Tuesdays 18:00–21:00". A booking is an instant. The
conversion between them is where scheduling systems quietly break.

The failure is specific: resolve the weekly rule to a fixed UTC offset once, and
every slot is an hour wrong for half the year. Cal.com's own scheduling code
carries the comment *"there will be 60 min offset on the day of DST change"* at
exactly this spot, and its schema stores availability as timezone-naive `time`
with the zone on the parent schedule.

Two wall times also have no single answer. Spring forward skips an hour, so
01:30 does not happen. Autumn back repeats one, so 01:30 happens twice.

## Decision

**Recurring availability is stored as wall-clock time plus an IANA zone, and
resolved to instants per calendar day at read time. Bookings are stored as
resolved UTC instants.**

- `coach_availability.startTime`/`endTime` are `@db.Time` — no zone.
- `coach_profiles.timezone` is the IANA name they are read in.
- `bookings.startTime`/`endTime` are `DateTime` — a booking is a single event
  with no recurrence to re-resolve.
- `days Int[]` rather than a row per weekday, so "Mon, Wed, Fri 18:00–21:00" is
  one row. RRULE was considered and rejected: the pattern never needs it.

The two ambiguous wall times are handled explicitly, matching Temporal's
`compatible` disambiguation:

- **Gap** — the window is dropped. The clock never showed that time, so nobody
  could have turned up for it.
- **Overlap** — the earlier instant wins. It is the one a person expecting
  "01:30" arrives at.

`Intl` does the zone maths. Node and every browser ship the IANA database, so
there is nothing to install and nothing to keep updated — and no new dependency,
which this section is trying hard to avoid.

## Consequences

**Positive.** 18:00 stays 18:00 through a clock change, which is what the coach
meant. A coach who moves country changes one field. Students see instants
rendered in their own zone, and an instant has no timezone left to get wrong.
No dependency.

**Negative.** Every slot computation does per-day `Intl` work rather than
arithmetic on a cached offset. It is bounded by the horizon (30 days) and
nothing about it is hot, but it is not free. The naive two-pass conversion
returns the *later* instant in an overlap, so the code probes both sides of the
boundary and takes the earliest candidate that round-trips — more work than the
obvious implementation, and the tests say why.

Tested against Europe/Istanbul (permanent UTC+3, the control case),
Europe/London and America/New_York, including every hour of both 2026 EU
transition days.
