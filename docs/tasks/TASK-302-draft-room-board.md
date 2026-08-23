# TASK-302: Draft room board and champion grid

Spec: `docs/DRAFT_ROOM.md` §2, §6. Depends on TASK-301.

## Goal

The room itself: two team columns, ten pick slots, ten ban slots, the champion
grid in the middle, and a turn indicator that makes it obvious whose move it is.

## Deliverables

`src/domains/draft/components/`

- `DraftBoard.tsx` — the frame. Blue column left, red column right, grid centre,
  ban strips top and bottom of each column.
- `DraftSlot.tsx` — one pick or ban slot. States: empty · pending (the active
  turn, pulsing in the acting side's colour) · locked · timed-out.
- `ChampionGrid.tsx` — every champion, alphabetical, from `/api/champions/all`.
  - Role filter: Top · Jungle · Mid · Bot · Support, from `Champion.roles`.
  - Search box, focused by default, matching name and common aliases
    (`asol` → Aurelion Sol, `mf` → Miss Fortune, `tk` → Tahm Kench).
  - Unavailable champions render dimmed, never hidden, with the reason on hover:
    _banned this game_ · _already picked_ · _locked by fearless_ · _disabled_.
    Hiding them is what the reference tool does and it makes fearless series
    confusing — you cannot see what the series has already burned.
- `TurnIndicator.tsx` — "Blue ban 3" / "Red pick 2" plus the countdown ring, and
  a **Lock In** button that is enabled only when it is your turn and a legal
  champion is highlighted.
- `SeriesTabs.tsx` — G1…G5, current game highlighted, completed games showing the
  winner. Switching a tab pushes `?game=N`.

`app/(tools)/draft/[code]/page.tsx` composes them.

## Interaction rules

- Click selects a champion (highlight). **Lock In** or `Enter` commits it. Nothing
  commits on a single click — a misclick during a 30 s turn is unrecoverable.
- Arrow keys move the highlight through the filtered grid; `/` focuses search.
- Spectators get the whole board read-only, with no Lock In and no highlight.
- The board is the primary surface at ≥1280 px; below that the grid stacks under
  the two columns and the ban strips collapse into a single row.

## Rules

- No component over 200 lines. `ChampionGrid` splits its cell into
  `ChampionCell.tsx` if it approaches the limit.
- Champion portraits via `next/image` (CLAUDE.md §10).
- Grid virtualisation is _not_ in scope — 170 cells render fine.

## Done when

The room renders a full lobby and a full completed draft from fixture state,
role filter and search narrow the grid correctly, unavailable reasons show, and
`ChampionGrid.test.tsx` covers filter + search + alias matching + the four
unavailable reasons.
