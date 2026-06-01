# TASK-014 — Champion Static Data Pipeline

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 1 day

---

## Objective

Build the pipeline that ingests Riot's static champion data (Data Dragon) into the `champions` table. Champion data is required for displaying champion names, icons, and roles throughout the app.

---

## Acceptance Criteria

- [ ] `champions` table is populated with all current LoL champions
- [ ] Each champion has: id, key, name, title, roles, difficulty, image_url, patch_version
- [ ] Running the pipeline again on a new patch updates existing records (upsert)
- [ ] Champion icons load correctly from Riot's CDN URLs
- [ ] Script can be run manually: `npm run sync:champions`
- [ ] Script run during initial seed (`prisma/seed.ts` calls it)

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
