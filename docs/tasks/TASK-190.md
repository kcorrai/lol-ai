# TASK-190: Draft Analyzer — prevent duplicate + off-role picks

## Status: Done

## Goal
Fix two reported Draft Analyzer bugs: the same champion could be selected in
multiple slots, and any champion could be dropped into any lane regardless of the
roles it actually plays.

## Scope
- `ChampionCombobox`: add optional `positions` on `ChampionOption` and a
  `position` prop; filter the dropdown to on-lane champions (champions with no
  role data still show, so the list never empties).
- Draft `page.tsx`: attach each champion's real lanes from the meta snapshot
  (`positions`), fall back to "any lane" when the snapshot lacks the champion.
- `DraftBuilder`: per-slot, hide champions already taken on either team and pass
  the slot's `position` to the picker.
- `draftEvalService.dedupeDraft` (new, exported): server-side guard that drops a
  champion drafted twice across both teams (defends hand-crafted ?blue/?red URLs).

## Tests
- `draftEvalService.test.ts`: dedupe across teams + within a team; evaluation
  strips the smuggled duplicate.

## Commit
`fix(draft): prevent duplicate and off-role champion picks`
