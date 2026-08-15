# TASK-305: Completed-draft summary, series tracking and export

Spec: `docs/DRAFT_ROOM.md` §1, §6. Depends on TASK-304.

## Goal

What happens when the twentieth champion locks. The reference tool gives you a
screenshot; we give you the evaluation the app already knows how to produce.

## Deliverables

- `DraftSummary.tsx` — replaces the champion grid once a game completes:
  - Both final comps, side by side.
  - The verdict, lane edges and team evaluation from the existing
    `evaluateDraft()` — no new analysis code.
  - **Record winner** buttons for the two drafters, feeding `/result`.
- `SeriesOverview.tsx` — the series so far: score, every game's comps, and the
  running fearless lockout pool so both teams can see what is burned before
  game 3 starts.
- **Export** — one button opening
  `/tools/draft-analyzer?blue=…&red=…` in a new tab with the finished comps
  pre-filled, so the deeper analyser picks up where the room left off.
- **Copy summary** — plain text for Discord: comps, bans, verdict, and the
  spectator link.
- **Next game** — advances to `game N+1`, applies the mode's lockouts, resets both
  ready flags, and defaults the blue side to the team that was on red.

## Rules

- No new evaluation logic. This task *composes* `evaluateDraft`,
  `draftTeamEval` and TASK-304's advice service. If something is missing, it gets
  added there, not here.
- Recording a winner is idempotent and only the two drafters may do it.
- The summary renders for spectators too — once the game is complete, everything
  is public.

## Done when

Finishing a draft shows comps, verdict and lane edges; recording a winner updates
the series score for every viewer; **Next game** carries the fearless pool
correctly into game 2; the export link opens the analyser with both comps filled.
`DraftSummary.test.tsx` covers the completed-state render and the winner controls'
permission rules.
