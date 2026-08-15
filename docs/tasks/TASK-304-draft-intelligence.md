# TASK-304: Live Draft Intelligence panel

Spec: `docs/DRAFT_ROOM.md` §1 "Where we go further". Depends on TASK-303.

## Goal

The reason to use our draft room instead of the reference tool. While it is your
turn, the panel tells you what to take and why, from the patch's real numbers —
not from vibes and not from an LLM.

## Deliverables

`src/domains/draft/services/draftAdviceService.ts`

`getDraftAdvice(state, side)` → `DraftAdvice`, composed from data we already have:

- `getMetaSnapshot()` — per-role win rate, pick rate, ban rate for the patch.
- `getChampionCounters(championId, position)` — matchup win rates.
- `evaluateTeam()` from `draftTeamEval` — damage split, frontline, engage, scaling.

Scoring for a **pick** turn, per candidate champion, for each role you still need:

```
score = metaWinRate
      + counterEdge      // mean advantage vs enemy champions already locked
      + compFit          // rewards fixing an AD/AP skew or a missing frontline
      - contested        // penalises a champion the enemy is likely to want back
```

Every component is surfaced, never just the total: the panel shows
*"Ornn — 52.1% top · +2.4 into K'Sante · fixes your frontline"*. A number with no
reason attached is not advice.

For a **ban** turn the same machinery runs against the *enemy's* needs and returns
the champions that would hurt you most.

`src/domains/draft/components/`

- `DraftAdvicePanel.tsx` — the ranked list for the current turn, click-to-highlight
  wired into the grid.
- `CompReadout.tsx` — AD/AP bar, frontline / engage / scaling meters, recomputed
  after every lock.
- `LaneEdges.tsx` — each matchup as both laners land, favoured side and margin.

## Rules

- **Visibility:** your own side only, while the game is live. Spectators and the
  opposing drafter see it after the game completes. Leaking it live would make the
  tool unusable for real scrims.
- **Cost:** the meta snapshot and the counter tables are already cached
  (TASK-292, ADR-013). The advice is computed **client-side** from one payload
  fetched once when the room opens — no per-turn network call, no AI call, no
  added Neon egress.
- Missing meta data degrades to the grid with no panel. It never blocks a draft.
- Scoring lives in a pure `draftAdviceScoring.ts` so it is testable without
  fixtures of the whole meta snapshot.

## Done when

`draftAdviceScoring.test.ts` pins the four score components independently and
their combination; the panel shows five ranked suggestions with reasons on a pick
turn and five threats on a ban turn; hiding rules verified for spectator, own
side, and opposing side.
