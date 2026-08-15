# TASK-310 — Cross-linking esports into builds, champions and tier lists

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 0.5 day
**Depends on:** TASK-308

---

## Objective

Connect the two clusters in both directions. Esports pages already link into the
champion pages (TASK-308); this task adds the reverse — a pro-play module on the
pages that already rank — so the existing traffic discovers the new section and
the new section inherits the old section's authority.

## Scope

- **`src/domains/esports/components/ProPlayStrip.tsx`** — a compact module,
  server-rendered from cached data, showing for one champion: pro presence and
  win rate this split, the pro build in one line, and the last three pro games
  with player names. Links to `/esports/champions/[champion]`.
  - Renders nothing at all when the champion has no pro games — no empty box, no
    "no data" placeholder on a page that is not about esports.
- Mounted on:
  - `/builds/[champion]` and `/builds/[champion]/[role]` — under the ranked build,
    framed as "how pros build it".
  - `/champions/[name]` — in the champion overview.
  - `/counters/[champion]` — one line only.
- **Tier list** — a "pro presence" column on `/tools/tier-list` linking to the
  pro meta table, showing where the ranked meta and the pro meta disagree. That
  disagreement is genuinely interesting content and costs nothing extra.
- **`/tools` hub and `/meta`** — an esports card in the grid.
- Data comes through `src/domains/esports/index.ts` only. The meta domain does not
  import esports services directly, and vice versa.

## Acceptance Criteria

- [ ] `ProPlayStrip` renders on build, champion and counter pages for champions
      with pro games, and renders nothing for those without
- [ ] Pro presence column on the tier list, linking to `/esports/champions`
- [ ] Esports card on `/tools` and a link from `/meta`
- [ ] No cross-domain import bypasses either domain's `index.ts`
- [ ] No measurable LCP regression on `/builds/[champion]` (cached read only —
      measure before and after)
- [ ] Component under 200 lines; `tsc --noEmit`, lint and tests pass
