# ADR-041: Account for AI spend before optimising it

## Status: Accepted

## Context

`docs/AI_ARCHITECTURE.md` has described cost management since version 1.0: §8.3
specifies a daily cost aggregate stored for the admin dashboard, §8.2 lists hard caps, and
the pipeline diagram in §2 shows the AI client doing "cost tracking".

None of it existed. Of eleven call sites, exactly one — the coaching pipeline — recorded
anything, into `ai_analyses`. The other ten spent money that nothing counted. The
`costUsd` column has been in the schema since the first migration and had never been
written. The only hard cap in the product was the per-user daily message limit on chat;
nothing bounded the total.

The practical consequence is that every question about the AI bill had to be answered by
reading code and guessing: which feature dominates, whether the expensive tier is
justified where it is used, whether a cache is earning its keep. This ADR is about
removing the guessing, not about the optimisations that follow from it.

## Decision

**Three things, in this order: count it, name it, cap it.**

### Count it — a usage ledger, in Redis

`src/lib/ai/usage.ts` counts calls, prompt tokens, completion tokens and cost per task,
per day and per month.

Recording happens in a wrapper around the provider inside `getAiClient`, not at the call
sites. A call site can forget; ten of eleven already had. From the wrapper there is no
path to a model that skips the ledger.

Streamed responses are counted too. `streamChat` now _returns_ the usage its provider
reports and the wrapper reads it through `yield*`, so consumers doing `for await` over the
tokens are unaffected. This matters more than it sounds: chat is the highest-volume
surface and runs on the expensive tier, and a ledger blind to it would describe the small
half of the bill.

Counters live in Redis rather than Postgres for exactly ADR-014's reason. This is
regenerable telemetry at one write per model call, and Postgres here is billed by network
transfer — the same pressure that made three tasks move data _out_ of `ai_cache`. The
per-call record in `ai_analyses` stays where it is; only the aggregate is new.

### Name it — a task-to-tier map

`src/lib/ai/taskTiers.ts` lists every AI task and the tier it runs on. Callers name what
they are doing; the map decides which model serves it.

The tier used to be chosen per call site, which made the single biggest lever on the bill
unreviewable — nobody could see what the expensive model was being spent on without
reading eleven files. A test asserts the map lists exactly the tasks actually called, so
it cannot quietly stop being the whole picture.

The map also records _why_ a task is where it is, which is what caught a mistake in the
plan for this work: `otp-assistant` and `build-explanation` look like short-output tasks
and are not — they use the 2000-token default and validate multi-field JSON with a Zod
schema that `.parse()`s. A weaker model's shape error there throws and the feature fails
rather than degrading, which is not a decision to make on output length.

### Cap it — a budget, off by default

`assertWithinAiBudget()` runs before every model call and throws once a configured daily
or monthly ceiling is reached.

Three failure directions were chosen deliberately:

- **No default limit.** A cap that refuses a paying customer's coaching report is not
  something to switch on with a number this repository invented.
- **Unpriced spend is not enforced**, and warns once. A budget the ledger cannot price
  would otherwise read as "under budget" forever.
- **An unreachable ledger fails open.** This is a cost ceiling, not a safety one; it must
  not take the product down.

### No built-in price table

`AI_MODEL_PRICES` is configuration. There is no compiled-in default, and that is the point:
model prices change, differ per provider and plan, and a stale constant would put
confident wrong numbers on the one dashboard whose entire job is to be trusted. Unset
means the ledger still counts every token — the half that cannot be wrong — and reports
cost as `null`, which is never rendered as zero.

## Consequences

- One extra Redis round trip per model call for recording, and roughly one per five-second
  burst for the budget check. Against a call that takes seconds, this is noise.
- Cost figures are only as good as `AI_MODEL_PRICES`. Whoever sets it owns keeping it
  current; the alternative was owning a number in the build that nobody would remember to
  update.
- `streamChat`'s signature now carries a return type. Existing consumers are unaffected —
  `for await` ignores a generator's return value — but a new provider must report usage or
  its streams will not be counted.
- Tier changes are now a one-file diff, which is the point, and also the risk: demoting a
  task is a quality decision and the map is where the reasoning has to be written down.
