# TASK-298: Persistence schema for draft series, games and actions

Spec: `docs/DRAFT_ROOM.md` §3, §4. Depends on TASK-297 for the enum vocabulary.

## Goal

Store a draft series durably so a room survives a refresh, a redeploy, and a
drafter's laptop dying mid-series.

## Deliverables

`prisma/schema.prisma`:

```prisma
enum DraftSeriesMode   { NORMAL FEARLESS TEAM_FEARLESS }
enum DraftSideEnum     { BLUE RED }
enum DraftGamePhase    { LOBBY IN_PROGRESS COMPLETE }
enum DraftActionKind   { BAN PICK }
```

- `DraftSeries` — `id`, `code @unique`, `blueToken @unique`, `redToken @unique`,
  `team1Name`, `team2Name`, `mode`, `gameCount`, `timerSeconds`,
  `disabledChampions String[]`, `createdById String?` (nullable — the feature is
  login-free), `createdAt`, `expiresAt`.
- `DraftGame` — `id`, `seriesId`, `gameNumber`, `blueTeam Int`, `phase`, `step`,
  `blueReady`, `redReady`, `turnStartedAt DateTime?`, `winnerSide DraftSideEnum?`,
  `version Int @default(0)`, `@@unique([seriesId, gameNumber])`.
- `DraftAction` — `id`, `gameId`, `step Int`, `side`, `kind`, `championKey String?`
  (null = a passed ban), `createdAt`, `@@unique([gameId, step])`.

Indexes: `DraftSeries.expiresAt` (cleanup sweep), `DraftGame.seriesId`,
`DraftAction.gameId`.

Cascade: deleting a series deletes its games; deleting a game deletes its actions.

## Notes

- `version` is the optimistic-concurrency guard _and_ the polling change detector
  (ADR-016). Every mutation bumps it inside the same transaction as the write.
- `createdById` is nullable on purpose. Anonymous drafts are the primary path;
  a signed-in creator only gets the series listed on their profile later.
- `code` is 8 URL-safe characters; the two tokens are 32. All three are generated
  with `crypto.randomBytes`, never `Math.random`.

## Done when

- A named migration exists under `prisma/migrations/`.
- `docs/DATABASE_SCHEMA.md` documents all three tables and the four enums.
- `npx prisma validate` passes and `npm run typecheck` is green against the
  regenerated client.
