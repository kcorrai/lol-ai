# TASK-313 — Weekly duo quests

Depends on [TASK-312](./TASK-312-duo-synergy.md). Feeds the panel in TASK-314.

## Goal

Give a pair something to do together, and a reason to come back on Monday. Three goals a week,
progress read from the games they actually play, XP when they land it.

## Change

- **Schema** — `DuoQuest` (`duo_quests`), migration `20260816000002_add_duo_quests`.
- `duoQuestCatalog.ts` — pure. Six quests, the Monday-to-Monday window, and which three run in a
  given week.
- `duoQuestService.ts` — generation, progress and XP.
- `duoMatchLoader.ts` — the two-query shared-match load, extracted from `duoSynergyService` so
  quests and synergy read the same rows and cannot disagree about which games the pair played.
- `GET /api/duo/quests`, `useDuoQuests`.
- `docs/DATABASE_SCHEMA.md`, `docs/API_DESIGN.md`.

## Deterministic, not generated

Individual challenges cost an AI call each (`challengeGenerationService`). Duo quests are per
*pair*, so the same approach would scale spend with pairs rather than players — and "win three
together" needs no creativity to be worth doing.

`questsForWeek` rotates a fixed catalogue by week number. The set is therefore stable all week,
changes on Monday, identical for every pair — which makes it something two players can talk about
— and reproducible, which makes a bug reproducible.

## Generation happens on read

There is no cron. Which quests run is a pure function of the week, so a scheduled job could not
compute anything the request cannot, and a pair who never open the panel cost nothing.

That makes `GET /api/duo/quests` a write, which is only safe because of two things:

- The unique index on `(riotAccountId, partnerPuuid, key, periodStart)` makes the upsert
  idempotent.
- **Only the transition to complete pays.** A quest already stored as complete is not paid again,
  so refreshing the page is not an XP button.

Completion and the XP increment share one `$transaction`, the same shape
`challengeProgressService` uses: a failed XP write cannot leave a quest marked done and unpaid.
A persistence failure is logged and swallowed — progress has already been computed correctly, and
showing it beats failing the panel over a bookkeeping row.

`partnerPuuid` is part of the unique key, so switching duo mid-week starts a fresh set rather than
inheriting the previous partner's progress.

## Tests

`duoQuestCatalog.test.ts` — the Monday window including the Sunday off-by-one (`getUTCDay()` is 0
on Sunday, six days after its Monday), stability within a week, rotation across weeks, and every
measure: longest streak rather than current, chronological ordering regardless of input order,
the death and vision thresholds at their boundaries, and an empty week measuring zero rather than
throwing.

`duoQuestService.test.ts` — null without a duo and no match load, the week window passed to the
loader, progress capped at the target, XP paid on the same transaction as the completion, **no
second payment for an already-complete quest**, one upsert per quest under the week key, and
progress still reported when the write fails.

## Verified against real data

`kaanproak0#TR1` with `C0marKopter#TR1`, evaluated over the week their seeded matches fall in:
"Queue up 5/5", "Carry each other 3/3", "Back to back 2/2", all complete. User XP went 0 → 210 on
the first read and stayed 210 on the second, `xpAwarded` was 210 then 0, and exactly three rows
were written. That is the property that matters most here, and it is checked against the database
rather than a mock.

refs TASK-313
