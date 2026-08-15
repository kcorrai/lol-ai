# TASK-315 — Documentation for the search and duo work

Closes TASK-308 … TASK-314.

## Goal

Put the two shipped feature sets where someone looking for them would find them, rather than only
in eight task files.

## Change

- `docs/FEATURES.md` — **F-039 Player Search** and **F-040 Duo Panel**, in the same shape as the
  existing entries. F-039 leads with why it needed building at all: Riot has no name-search
  endpoint, so the index is the feature.
- `docs/ROADMAP.md` — Phase 5.5 (Removing the Front Door) and Phase 5.6 (The Duo Panel), both
  marked shipped, each with what changed and what to watch.
- `docs/PROJECT_STRUCTURE.md` — `src/components/search/`, `src/components/dashboard/laneiq/duo/`,
  the four new `src/lib/riot/` modules, and `src/lib/stores/` which the tree did not mention at
  all.

Already written in their own tasks and not repeated here: `ADR-017`, the `player_index` and
`duo_quests` tables in `DATABASE_SCHEMA.md`, and the three endpoints in `API_DESIGN.md`.

## Not done, deliberately

**No tile in the free-tools grid.** Every tile there links to a tool page; player search is a box
in the header of every marketing page and in the app top bar, with no page of its own. A tile
pointing at `/#demo` would describe it as something it is not, and the search bar is already more
discoverable than any grid entry.

**`DEPENDENCIES.md` unchanged.** None of TASK-308 … TASK-314 added a package.

refs TASK-315
