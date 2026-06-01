# TASK-004 — Riot API Integration & Account Connection

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 3 days

---

## Objective

Build the Riot API integration layer: connect a Riot account by Riot ID, validate it against the Riot API, and persist the account data. This is the gateway feature — nothing else works without it.

---

## Acceptance Criteria

- [ ] User can enter a Riot ID (GameName#TAG) and connect their account
- [ ] System validates the account exists via Riot Account API
- [ ] Summoner data is fetched and stored in `riot_accounts` table
- [ ] Error shown if Riot ID does not exist: "This Riot ID was not found. Check the spelling and try again."
- [ ] Error shown if account already connected to this user
- [ ] Error shown if region is invalid
- [ ] API rate limit (429) is handled gracefully: retry with exponential backoff
- [ ] Primary account flag set correctly (first connected account = primary)
- [ ] User can view their connected accounts in settings
- [ ] User can disconnect an account (preserves match data)

---

## Technical Requirements

### Riot API Endpoints Used

- `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` — get PUUID
- `GET /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}` — get summoner data
- Base URLs per region:
  - Account API: `https://europe.api.riotgames.com` (Americas/Europe/Asia routing)
  - Summoner API: `https://{region}.api.riotgames.com`

### Implementation Details

- `src/domains/riot/services/riotApiClient.ts` — typed HTTP client, handles auth headers, retries, rate limits
- `src/domains/riot/services/accountService.ts` — business logic for connecting/disconnecting accounts
- `src/domains/riot/mappers/accountMapper.ts` — maps Riot API response to our domain model
- Rate limit handling: read `X-App-Rate-Limit-Count` and `X-Method-Rate-Limit-Count` headers
- API key stored in `RIOT_API_KEY` env var, never logged

### Rate Limit Strategy

Development API key limits: 20 req/sec, 100 req/2min.  
Production key (after Riot approval): higher limits.

Implement: request queue with `p-limit` (concurrency limiter) and `p-retry` (retry with backoff).

---

## API Endpoints to Build

- `POST /api/riot/connect` — validate + connect account
- `DELETE /api/riot/:riotAccountId` — disconnect account
- `GET /api/riot/accounts` — list connected accounts for current user

---

## Pages/Components to Build

- `AccountConnectionForm` component in `src/domains/riot/components/`
- Settings page section: "Connected Accounts" (`app/(app)/settings/accounts/page.tsx`)

---

## Error Codes

| Riot API Error | Our Error Code | User Message |
|---|---|---|
| 404 | `RIOT_ACCOUNT_NOT_FOUND` | "This Riot ID was not found." |
| 429 | `RIOT_RATE_LIMIT` | "Too many requests. Please wait a moment." |
| 503/500 | `RIOT_API_UNAVAILABLE` | "Riot's servers are having issues." |

---

## Dependencies

- TASK-001, TASK-002, TASK-003
- Riot Developer Account with registered application and API key

---

## Notes

Do not build match sync in this task. Only account connection and validation. Match sync is TASK-005. Keep RiotApiClient stateless and independently testable.
