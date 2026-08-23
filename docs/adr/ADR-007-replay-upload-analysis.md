# ADR-007: Replay Upload Analysis (.rofl) — Go / No-Go

## Status: Declined (Superseded by Timeline API)

## Context

League of Legends generates `.rofl` replay files stored locally on the player's machine. The hypothesis was: players could upload their `.rofl` files, and we'd parse them to generate coaching based on exact frame-by-frame game events.

### The .rofl file format

`.rofl` is a proprietary binary format with the following structure:

```
RIOT:ROFL:                  magic bytes (10 bytes)
[u16] header offset         pointer to metadata JSON
[u16] file length
[Metadata JSON]             plaintext — contains player stats, game info, match ID, participant data
[Payload header]            encrypted game event data (AES-256-CFB)
[Payload]                   binary-encoded game events (encrypted)
```

The metadata JSON header is **unencrypted** and contains:

- `statsJSON` — post-game player stats (kills, deaths, CS, items, etc.)
- `gameLength`, `gameVersion`, `queueId`
- Player names and champion IDs

The game event payload (the frame-by-frame event stream: positions, abilities cast, item purchases, death events) is **AES-256-CFB encrypted**. The encryption key is stored in the League client process memory at runtime and is **not** embedded in the `.rofl` file.

### Parser evaluation

| Library                   | Language   | Encrypted payload         | Status                         |
| ------------------------- | ---------- | ------------------------- | ------------------------------ |
| `js-rofl-parser` (npm)    | JavaScript | Metadata only             | Unmaintained (2018)            |
| `lol-replay-parser` (npm) | JavaScript | Metadata only             | Unmaintained (2020)            |
| `awpy` / `bayes-api`      | Python     | Metadata only             | LoL-specific forks, limited    |
| `ReplayBook`              | C#         | Metadata + limited events | Requires decryption workaround |
| Overwolf / companion apps | C++        | Full access               | Requires native desktop app    |

**No JavaScript/Node.js library can decode the encrypted event payload** without the runtime encryption key, which is only available during an active League session via native process injection.

### PoC findings

See `src/domains/analysis/poc/roflParser.ts` — a working PoC that:

1. Reads the `.rofl` header magic bytes to validate the file
2. Extracts the unencrypted metadata JSON (player stats, game metadata)
3. Returns structured participant data

The PoC works. However, it only provides the same data as the **Riot API `/match/v5/matches/{matchId}`** endpoint, which we already use.

The rich event stream (exact positions, ability casts, item purchases per frame) requires the encrypted payload which is inaccessible server-side.

### Compute and storage cost estimate

| Scenario                        | Volume             | Cost                                      |
| ------------------------------- | ------------------ | ----------------------------------------- |
| `.rofl` file size               | 50–200 MB per game | ~$0.004/file on R2 storage                |
| Upload bandwidth                | 100MB avg          | ~$0.009/file on Vercel                    |
| Processing                      | 2–5s CPU           | ~$0.001/file on serverless                |
| Per-user per-month (10 uploads) | —                  | ~$0.15/user                               |
| At 1,000 MAU                    | —                  | ~$150/month storage + $90/month bandwidth |

Upload-based replay analysis is **cost-viable** for metadata extraction only. Full event parsing would require storing 50-200MB blobs per game, which adds meaningful storage cost with no additional value (same data is free via Riot API).

### What the Timeline API already provides

The `/lol/match/v5/matches/{matchId}/timeline` endpoint (already integrated in TASK-122) provides:

- Kill events with positions
- Building destruction events
- Item purchase events (every purchase logged)
- Level-up events
- Skill level-up events
- Ward placement / kill events

This covers **90% of the coaching value** we'd get from replay event parsing, without any file upload complexity.

## Decision

**Declined — superseded by existing Timeline API integration.**

### Specific findings

1. **Metadata-only parsing is redundant**: `.rofl` header metadata duplicates what the Riot API already provides for free.
2. **Full event parsing is blocked**: AES-256-CFB encryption of the payload is inaccessible server-side without native code on the player's machine.
3. **Timeline API covers the gap**: Kill events, item purchases, objective control — all available from the existing timeline endpoint.

### What would change this decision

- A Riot-provided official `.rofl` SDK with documented decryption (no current plans)
- An Overwolf/companion app integration (deferred to Phase 6, see ADR-005) — this could access the event stream at runtime

### Immediate action

Close the replay upload feature track for Phase 5. The PoC parser (`src/domains/analysis/poc/roflParser.ts`) is preserved as a reference implementation if companion app development starts in Phase 6.

## Consequences

**Positive:**

- Zero engineering effort wasted on file upload infrastructure
- No new storage costs
- Timeline API continues to deliver event-level coaching data

**Negative:**

- Cannot offer frame-level position heatmaps (would require full event stream)
- Cannot show "you walked here and died to this gank" visualization
