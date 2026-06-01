# TASK-005 — Match History Sync Pipeline

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 3 days

---

## Objective

Build the match data ingestion pipeline: fetch match IDs from Riot API, fetch full match detail for new matches, normalize the data, and persist to the database. This must be idempotent and efficient.

---

## Acceptance Criteria

- [ ] Sync fetches the last 20 ranked match IDs for a connected account
- [ ] For each match ID not already in the database, fetches full match data
- [ ] Match and all 10 MatchParticipant records are persisted correctly
- [ ] Sync is idempotent: running it twice does not duplicate records
- [ ] Sync respects Riot API rate limits (no 429 errors in normal operation)
- [ ] Sync triggered automatically when a new Riot account is connected
- [ ] Sync can be manually triggered via `POST /api/riot/:riotAccountId/sync`
- [ ] Manual sync is debounced: max 1 per 5 minutes per account
- [ ] `last_synced_at` updated on `riot_accounts` after successful sync
- [ ] API route returns 202 with sync status (not blocking)

---

## Technical Requirements

### Riot API Endpoints Used

- `GET /lol/match/v5/matches/by-puuid/{puuid}/ids` — get match ID list
  - Params: `queue=420` (ranked solo), `count=20`
  - Base: `https://{routing}.api.riotgames.com` (routing: americas/europe/asia)
- `GET /lol/match/v5/matches/{matchId}` — get full match detail

### Region → Routing Mapping

| Region | Routing |
|---|---|
| na1, br1, la1, la2 | americas |
| euw1, eun1, tr1, ru | europe |
| kr, jp1 | asia |
| oc1 | sea |

### Data Flow

```
1. Fetch last N match IDs
2. Filter: exclude match IDs already in our DB
3. For each new match ID (in batches of 3 to respect rate limits):
   a. Fetch full match detail
   b. Map to domain model (matchMapper.ts)
   c. Upsert Match record
   d. Upsert 10 MatchParticipant records
   e. Flag our tracked player's participant (link to riot_account_id)
4. Update riot_accounts.last_synced_at
```

### Match Mapper Responsibilities

`src/domains/riot/mappers/matchMapper.ts`:
- Extract match metadata from `info` object
- Map each participant's stats to `MatchParticipant` fields
- Calculate derived fields: `csPerMinute`, `goldPerMinute`
- Determine `won` from team data
- Normalize position string (Riot uses "UTILITY" for support)

---

## API Endpoints to Build

- `POST /api/riot/:riotAccountId/sync` — trigger async sync, returns `{ jobId, status: 'queued' }`
- `GET /api/riot/:riotAccountId/sync/status` — poll sync status (MVP: simple DB flag, no queue)

---

## Services to Build

- `src/domains/riot/services/matchSyncService.ts` — orchestrates the sync
- `src/domains/riot/mappers/matchMapper.ts` — Riot API → domain model

---

## Error Handling

- Individual match fetch failures do not abort the whole sync — log and continue
- If Riot API returns 429: pause sync for 2 minutes, then continue
- If a match has already been synced by another user in a prior match: upsert (deduplication by `match_id`)

---

## Testing Requirements

- Unit test `matchMapper.ts` with a fixture of a real Riot API match response
- Test idempotency: sync same match IDs twice → same DB state
- Test partial sync: 1 of 5 matches fails → other 4 saved correctly

---

## Dependencies

- TASK-004 (Riot account connection)
- TASK-003 (database schema: Match, MatchParticipant tables)

---

## Notes

In MVP, sync runs synchronously in the API route (no background queue). For Phase 2, this will be extracted to a background job. Design the service so this extraction is trivial (no framework coupling, pure async functions).
