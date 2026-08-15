# Live Draft Room — Feature Specification

Shared reference for TASK-297 … TASK-306. Individual task files describe *what to
build*; this file describes *what it is*.

---

## 1. What we are building

A public, login-free draft room: one link creates a whole series, both teams open
it, pick and ban against a live 20-step tournament sequence, and the room carries
champion lockouts across every game of the series.

This is the feature drafter.lol is known for. We match it and add the thing they
do not have: **the draft board is wired into our meta data**, so while you draft
you can see what the pick actually does to your comp.

### Parity targets (drafter.lol)

| Their feature | Ours |
|---|---|
| One link for the whole series | Yes — `/draft/<code>`, `?game=N` selects the game |
| Normal / Fearless / Ironman | Normal / Fearless / Team Fearless (§3) |
| 1–5 games | Yes |
| Blue / Red drafter + spectator roles | Yes, token-based (§4) |
| Ready check before the draft starts | Yes |
| Champion grid with role filter + search | Yes |
| Per-turn countdown | Yes, 30 s default, configurable |
| Disabled champions before the draft | Yes |
| Copy draft link | Yes |
| Save / export the finished draft | Export into `/tools/draft-analyzer` (§6) |

### Where we go further

1. **Live Draft Intelligence** — a side panel, visible only to your own team
   during the draft, that ranks the champions you should take *right now* from the
   patch's real win-rate and counter data, and flags what to ban.
2. **Live comp readout** — AD/AP split, frontline, engage and scaling recomputed
   after every lock, reusing `draftTeamEval`.
3. **Lane edges as they form** — the moment both laners in a matchup are on the
   board, the panel shows who is favoured and by how much.
4. **A real verdict at the end** — the finished draft flows straight into the
   existing `evaluateDraft` output instead of being a static screenshot.

---

## 2. The draft sequence

Standard competitive tournament order. 20 steps, indexed 0–19.

| # | Side | Type | | # | Side | Type |
|---|---|---|---|---|---|---|
| 0 | Blue | Ban 1 | | 10 | Blue | Pick 3 |
| 1 | Red | Ban 1 | | 11 | Red | Pick 3 |
| 2 | Blue | Ban 2 | | 12 | Red | Ban 4 |
| 3 | Red | Ban 2 | | 13 | Blue | Ban 4 |
| 4 | Blue | Ban 3 | | 14 | Red | Ban 5 |
| 5 | Red | Ban 3 | | 15 | Blue | Ban 5 |
| 6 | Blue | Pick 1 | | 16 | Red | Pick 4 |
| 7 | Red | Pick 1 | | 17 | Blue | Pick 4 |
| 8 | Red | Pick 2 | | 18 | Blue | Pick 5 |
| 9 | Blue | Pick 2 | | 19 | Red | Pick 5 |

Blue side always acts first — that is how the game itself works. Which *team*
sits on blue side is a per-game property (§3), so "first selection" is expressed
by putting that team on blue rather than by mutating the sequence.

---

## 3. Series rules

**Modes** — what carries between games of one series:

- `NORMAL` — nothing carries. Every game starts from the full roster.
- `FEARLESS` — every champion **picked** in an earlier game of the series is
  unavailable to **both** teams for the rest of it. Bans do not carry.
- `TEAM_FEARLESS` — each team is locked out of its **own** earlier picks only.
  The enemy may still take them.

Bans never carry in any mode; a ban is spent on the game it was made in.

**Sides** — each game stores `blueTeam: 1 | 2`. Game 1 defaults to Team 1 on blue;
subsequent games default to alternating, and either drafter may override it from
the game tab before the ready check.

**Disabled champions** — a series-level list set at creation. Those champions are
never selectable and never counted as banned.

---

## 4. Roles and access

Creating a draft mints three secrets:

- `code` — the public part of the URL. Grants **spectator** access.
- `blueToken`, `redToken` — one per side, handed out via the join panel. Grant
  the right to act for that side.

The join panel is the only place a token is claimed, and it is claimed by opening
`/draft/<code>?as=<token>`. A drafter link is a capability: whoever holds it can
draft for that side. This matches how scrim links are actually passed around
(Discord DM to the opposing coach) and avoids forcing accounts on people.

Spectators may watch the board and the timer. They do **not** see either team's
Intelligence panel until the game is complete.

Series expire 7 days after creation and are pruned by the existing cleanup cron.

---

## 5. Timing

- Default 30 s per action, settable 15–120 s at creation, or `0` for untimed.
- The server stores `turnStartedAt`; clients derive the countdown locally
  (ADR-016).
- On expiry the turn auto-locks. Bans auto-lock to *no ban*; picks auto-lock to
  the highest-win-rate legal champion for the role still missing. This is a pure
  function of stored state, so every observer resolves it identically.

---

## 6. Surfaces

| Route | Purpose |
|---|---|
| `/draft` | Create form — team names, mode, game count, timer, disabled champions |
| `/draft/[code]` | The room. `?game=N` selects a game, `?as=<token>` claims a side |
| `/api/draft` | `POST` create |
| `/api/draft/[code]` | `GET` state |
| `/api/draft/[code]/ready` | `POST` toggle ready for a side |
| `/api/draft/[code]/action` | `POST` lock a ban or pick |
| `/api/draft/[code]/undo` | `POST` step back one action (both sides must consent) |
| `/api/draft/[code]/result` | `POST` record the winner of a completed game |

The finished draft links out to
`/tools/draft-analyzer?blue=…&red=…`, which already renders the full evaluation.
