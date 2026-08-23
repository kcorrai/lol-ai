# TASK-014 — Champion Static Data Pipeline

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 1 day

---

## Objective

Build the pipeline that ingests Riot's static champion data (Data Dragon) into the `champions` table. Champion data is required for displaying champion names, icons, and roles throughout the app.

---

## Acceptance Criteria

- [x] `champions` table is populated with all current LoL champions
- [x] Each champion has: id, key, name, title, roles, difficulty, image_url, patch_version
- [x] Running the pipeline again on a new patch updates existing records (upsert)
- [x] Champion icons load correctly from Riot's CDN URLs
- [x] Script can be run manually: `npm run sync:champions`
- [x] Script run during initial seed (`prisma/seed.ts` calls it)

---

## Technical Requirements

### Data Dragon API

```
GET https://ddragon.leagueoflegends.com/api/versions.json
→ Returns array of versions, first = latest

GET https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json
→ Returns champion data map
```

### Champion Image URL Pattern

```
https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{champion.image.full}
```

### Script Location

`scripts/syncChampions.ts` — standalone script, uses Prisma directly

### Upsert Logic

```typescript
await prisma.champion.upsert({
  where: { id: champion.key },
  update: { ...mappedData, patchVersion: version },
  create: { ...mappedData },
});
```

---

## Why This Is a Separate Task

Champion data is static (changes only on patches). Fetching it on-demand from Riot's CDN on every request is wasteful. Storing it locally enables:

- Offline development
- Fast lookups without external API dependency
- Ability to add our own metadata (tier scores, pool recommendations)

---

## Dependencies

- TASK-001 (project setup)
- TASK-003 (champions table)

---

## Notes

Riot releases new champions approximately once per 3-4 weeks (new patches). In Phase 2, add a weekly cron job to run this sync automatically. For MVP, run manually when a new champion is released.

---

## Completion Summary

**Completed:** 2026-06-03

### What was built

- `scripts/syncChampions.ts` — standalone Data Dragon sync script.
  - Fetches latest patch version from `versions.json`
  - Fetches all champion data from `champion.json` (172 champions as of patch 16.11.1)
  - Upserts each champion into `champions` table via Prisma
  - Strict TypeScript: `DDragonChampionData`, `DDragonChampionResponse` interfaces — no `any`
  - Network safety: `AbortController` timeout (15s), descriptive error on HTTP failure, timeout, or network drop
  - Guard: refuses to run if champion data is empty (prevents accidental wipe)
  - Non-numeric `key` guard (has never occurred in Data Dragon but defensive)
  - `loadEnvFiles([".env", ".env.local"])` at entry point — loads env vars for standalone execution without requiring dotenv-cli; CI/production process env wins (only sets if key absent)
  - Exports `syncChampions(prisma)` so seed.ts can import it
  - Entry point guard via `process.argv[1]` — does NOT auto-execute when imported

- `package.json` — `"sync:champions": "tsx scripts/syncChampions.ts"` added

- `prisma/seed.ts` — mock `upsertChampion` helper and 10 hardcoded champions removed; replaced with `await syncChampions(prisma)` call

### Verified output

```
🏆 Syncing champions from Data Dragon...
  ✓ 172 champions upserted (patch 16.11.1)
✅ Champion sync complete.
```

### Validation

- `npm run lint` — ✅ no warnings
- `npm run typecheck` — ✅ clean
- `npm run build` — ✅ clean
- `npm test` — ✅ 43/43 passed
- `npm run sync:champions` — ✅ 172 champions upserted (patch 16.11.1)
