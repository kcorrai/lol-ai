# TASK-306: Documentation, navigation and discovery for the draft room

Depends on TASK-297 … TASK-305.

## Goal

Ship the feature properly: documented, linked, and findable. Code that ships
without docs is not done (CLAUDE.md §1.5).

## Deliverables

**Docs**

- `docs/API_DESIGN.md` — the seven `/api/draft` endpoints with payloads, status
  codes and rate limits.
- `docs/DATABASE_SCHEMA.md` — `draft_series`, `draft_games`, `draft_actions`.
- `docs/FEATURES.md` — the draft room entry, including what it does that the
  reference tool does not.
- `docs/PROJECT_STRUCTURE.md` — the `src/domains/draft/` tree.
- `docs/DEPENDENCIES.md` — confirm no new runtime dependency was added by this
  work. If one was, justify it or remove it.

**Navigation and discovery**

- `/tools` gets a Draft Room card, first position.
- The tools nav and `RelatedTools` link to `/draft`.
- `app/(tools)/draft/opengraph-image.tsx` so a shared draft link previews with the
  team names and series score rather than a bare URL. This is how the link
  actually travels — Discord, every time.
- `sitemap.ts` includes `/draft`; individual draft rooms are `noindex` (they are
  private scrim links, not content).

**Cleanup**

- Extend the existing expiry cron to delete `DraftSeries` past `expiresAt`.

## Done when

`npm run lint`, `npm run typecheck` and `npm run test` are all green; every doc
above reflects what actually shipped; `/tools` links to the room; and a shared
`/draft/<code>` link renders its OG card with the correct team names.
