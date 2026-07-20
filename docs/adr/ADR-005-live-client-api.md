# ADR-005: Riot Live Client Data API — Go / No-Go

## Status: Accepted (Deferred)

## Context

Riot Games provides the **Live Client Data API** (port `2999`) during an active game session. It exposes real-time in-game state: current gold, level, items, live events (kills, objectives, deaths), active player stats, and scoreboard. The goal of this research was to evaluate whether LoL AI Coach could use this data to deliver real-time coaching feedback.

### What the API provides

| Endpoint | Data |
|---|---|
| `GET /liveclientdata/allgamedata` | Full game state snapshot |
| `GET /liveclientdata/activeplayer` | Active player stats (gold, level, abilities) |
| `GET /liveclientdata/playerlist` | All players + items |
| `GET /liveclientdata/eventdata` | All game events (kills, turrets, dragons) |
| `GET /liveclientdata/gamestats` | Clock, game mode, map |

- Base URL: `https://127.0.0.1:2999` (self-signed TLS cert, requires `rejectUnauthorized: false`)
- No authentication — accessible from any process running on the same machine
- Available only while a game is in progress (404 / no response when idle)
- Polling interval: Riot documents ~500ms refresh rate; >10 req/s is discouraged

### Riot ToS compliance

Checked against [Riot Games Developer Policies](https://developer.riotgames.com/policies/general):
- ✅ Live Client Data API is explicitly permitted for personal non-commercial apps
- ✅ Desktop companion apps and browser extensions are allowed
- ✅ No Riot API key required for the live-client endpoints
- ✅ No PII is exposed — summoner name is available but not PUUID in this API
- ⚠️ Reselling raw Live Client data or using it in a product that charges per-use requires a partnership agreement

Our SaaS model (coaching reports, not raw data resale) falls within allowed use.

### PoC findings

A proof-of-concept was implemented against a running League client:

```typescript
// PoC: read live game state
async function getLiveGameData() {
  const res = await fetch("https://127.0.0.1:2999/liveclientdata/allgamedata", {
    // Node.js: must disable cert validation for Riot's self-signed cert
    // @ts-expect-error node-fetch/undici agent option
    agent: new https.Agent({ rejectUnauthorized: false }),
  });
  return res.json();
}
```

**Confirmed working:** active player stats, event stream (kills, deaths, objectives), team compositions, and real-time gold values are all readable.

**Blocker identified:** The API runs at `localhost:2999` on the **player's machine**. Our Next.js server has no path to reach it. This is not a technical limitation we can work around — it is fundamental to the API design.

### Architecture gap

| Layer | Current | Required for Live Client |
|---|---|---|
| Data source | Riot API (server-side) | `localhost:2999` (client-side) |
| Execution environment | Vercel serverless | Player's desktop |
| Latency | Post-game | Real-time (sub-second) |

To bridge this gap, one of the following is required:
1. **Electron companion app** — runs alongside League, polls `localhost:2999`, sends events to our WebSocket endpoint
2. **Browser extension** — same approach via `chrome.runtime.connectNative` or a content script proxy
3. **Native overlay** — full overlay application (similar to Overwolf apps)

### Estimated effort

- Option 1 (Electron): 3–4 weeks initial build, ongoing maintenance as League patches change the API
- Option 2 (extension): 2–3 weeks, simpler but requires Chrome Web Store review cycle
- Option 3 (overlay): 6+ weeks, highest complexity, best in-game UX

## Decision

**Conditional Go — Deferred to Phase 6.**

The Live Client API is technically viable and Riot ToS compliant. Real-time coaching has high product value. However, it requires a companion desktop component that is outside the current Phase 4/5 scope (web-only architecture).

**Immediate action:** None. No code changes to the existing codebase.

**Phase 6 action:** Build an Electron companion app as a separate repository (`lol-ai-companion`). The companion polls `localhost:2999`, forwards events to `wss://lolaicoach.gg/api/live-events`, and the web app streams AI tips in response.

## Consequences

**Positive:**
- Clear, bounded architecture: companion app is a separate deployment unit
- No changes required to the existing Vercel/Next.js stack
- Live coaching can be added as a Pro-tier feature with a clear distribution path (downloadable app)

**Negative:**
- Requires users to install a separate app → higher friction vs. web-only
- Electron app adds a new platform to maintain (Windows focus initially, macOS later)
- Companion app version must stay compatible with League client updates

---

## Addendum (2026-07-20, TASK-249): the post-lock path was taken

This ADR's decision is unchanged — champion select still needs a companion app — but it framed the
problem as all-or-nothing, and part of it turned out to be reachable from the server.

**What changed.** `GET /lol/spectator/v5/active-games/by-summoner/{puuid}` returns the full
participant list — both teams' champions, summoner spells and runes — for a game already in
progress. It is a normal server-side Riot API call on our existing key (probed: 404 when idle, not
403). TASK-249 uses it to prefill the draft analyzer from the player's live match.

**What it does not solve.** Spectator only sees a game once it has **started**. During champion
select there is nothing to query: that state lives in the LCU API on the player's own machine,
behind the same localhost barrier this ADR describes. Draft-time advice — the moment it would
actually be most useful — still requires the companion app.

**Consequences for the deferred work.** The companion app remains the only route to champ select
and to real-time in-game coaching. Its value is now marginally lower for the "what am I up
against" use case, since players can get a comp read once loading screen hits, and correspondingly
concentrated on the two things only it can do: advice *during* picks and bans, and live in-game
events.

**Caveat carried forward.** Spectator counts against the Riot key's rate limit, so it is wired to
an explicit button press and never polled. A production key would be a prerequisite for anything
more frequent.
