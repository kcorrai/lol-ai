# TASK-312 — AI match previews and recaps (cached, top leagues only)

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-307

---

## Objective

Give match and tournament pages original written content — the thing purely
generated pages lack — without letting AI cost scale with traffic.

## Scope

- **`src/domains/esports/services/esportsNarrativeService.ts`**
  - `getMatchPreview(matchId)` — head-to-head record, form, standings context and
    each team's champion tendencies → a three-paragraph preview.
  - `getMatchRecap(matchId)` — final scoreboards, drafts and gold curves → a
    recap that names what decided each game.
  - Both go through `src/lib/ai/` (provider-abstracted, never a vendor SDK
    directly) and both are **generated once and cached permanently** on the match
    id + game states. A view never triggers a generation; generation happens in
    the TASK-305 warm job.
- **Cost gate, enforced in code not convention:**
  - Only tier-1 leagues (the feed's `priority` 1 set: Worlds, MSI, First Stand,
    LCK, LEC, LTA, LPL) and only playoff/knockout stages outside those.
  - A per-day generation cap; when hit, the job logs and skips rather than
    queueing.
  - Recap only for completed series; preview only within 48 h of kickoff, and
    discarded once the recap exists.
- **Grounding rules:** the prompt receives only data we hold, and the output is
  parsed and validated like every other AI response in the pipeline. Any number in
  the text must exist in the input payload — a validation step rejects a recap
  that invents a statistic. Pages label the text as AI-written.
- Rendered on the match page under the scoreboard, and as a tournament-page
  digest for the current stage.

## Acceptance Criteria

- [ ] Preview and recap generate for a tier-1 series and render on the match page
- [ ] A page view never triggers a generation (verified by log/counter)
- [ ] League/stage gate and daily cap enforced and unit tested
- [ ] Numbers in the output are validated against the input; a fabricated figure
      fails validation and no text is published
- [ ] Output labelled as AI-generated
- [ ] AI pipeline test coverage per CLAUDE.md §5.4: happy path, API error,
      malformed response, cache hit
- [ ] Service under 250 lines; `tsc --noEmit`, lint and tests pass
