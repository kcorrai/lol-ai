# Esports section — launch checklist

TASK-314. What has to be true before the section is announced, and what is known
to be untrue today. The section itself is built (`docs/ESPORTS_PLAN.md`,
ADR-016, ADR-017); this is the gate in front of it.

The general deploy steps are in `DEPLOYMENT_CHECKLIST.md` and are not repeated
here — only what is specific to this section.

---

## 1. Blocking

Each of these has been verified as stated, or is named as not yet done.

| #   | Check                                                                                                  | State                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Every page renders with the feed unreachable and nothing cached — 200 with an empty state, never a 500 | **Verified.** Covered by `tests/e2e/esports.spec.ts`, which replays a feed that answers 503 for everything it has no fixture for                                    |
| 1.2 | Sitemap contains only pages with real content; no filtered URL is indexable                            | **Verified** at TASK-309, retested by the thin-page assertion in the spec                                                                                           |
| 1.3 | The live island makes zero browser requests to any Riot host                                           | **Verified** at TASK-304                                                                                                                                            |
| 1.4 | Nothing in the section sits behind the paywall                                                         | **Verified** — every route is under `(esports)` with the public chrome branch                                                                                       |
| 1.5 | Cache warming runs and the pro sample is warm before a reader arrives                                  | **Verified** at TASK-305 (`377cd6e`); the Inngest cron must be confirmed live in the target environment                                                             |
| 1.6 | A Data Dragon outage cannot take a page down                                                           | **Verified.** Fixed at LA-13 / ADR-034: third-party catalogues no longer go through the framework fetch cache, so there is no deferred revalidation left to reject  |
| 1.7 | `NEXT_PUBLIC_APP_URL` matches the deployed host                                                        | Check at deploy. Twitch refuses to play in an iframe whose `parent` does not match; a wrong value degrades to the link the reader had before, not a break (ADR-018) |
| 1.8 | `LOLESPORTS_API_KEY` set in the environment, or the pinned public web key still accepted               | Check at deploy. The key is public and not a credential (ADR-016), but it is repointable for the day Riot rotates it                                                |

## 2. Cost, as measured

| Read                                                        | Cold                                        | Cached  | Notes                                                                  |
| ----------------------------------------------------------- | ------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| Pro sample (hub rail, `/esports/champions`, `ProPlayStrip`) | ~220 feed requests                          | 1 h     | Was ~150 before each game also yielded its length. Warmed every 45 min |
| One game's gold curve                                       | 9 requests at 4-min sampling, ceiling 24    | 30 days | Fetched only for the game being looked at                              |
| One completed game's stats                                  | 3 requests (window, details, opening frame) | 30 days | Immutable once the game ends                                           |
| Cold hub build, no cache at all                             | ~4 minutes in dev                           | —       | Which is what §1.5 exists to prevent a reader ever seeing              |

## 3. Known, not blocking, filed

### 3.1 A Data Dragon outage 500s the esports hub — fixed

Found while building the E2E for this task, with Data Dragon unreachable from
the machine running it.

`fetchItems()` and `getLatestDdragonVersion()` fetch with
`next: { revalidate: … }`. When the cached entry is stale, Next refreshes it in
the background and **destroys the in-flight response if that refresh rejects** —
`Error: failed to pipe response`. Every call site already wraps these in a
`catch`, and it makes no difference: the rejection does not happen at the call
site.

Reproduced on `/esports`, which 500s. The other pages in the section survive
because they do not build the pro sample. This is not specific to the esports
section — anything on a `next: { revalidate }` path over a third-party host has
the same exposure — which is why it wants its own task rather than a patch here.

E2E does not hit it: both functions short-circuit under `E2E_MOCK`.

**Fixed (LA-13, ADR-034).** Every third-party catalogue read now goes through
`fetchJsonLastGood()`, which owns its TTL, its timeout and its last-good copy and
never rejects; `opggFetch` and the quiz asset route keep their shape but drop the
framework cache for `cache: "no-store"` plus a timeout. There is no deferred
revalidation left anywhere over a host we do not operate — `grep -rn "next: {
revalidate" src app` matches only the comments that say why.

### 3.2 Match pages carry two `<h1>` elements

One per team, in the score header. Two top-level headings on a page built for
search is worth one commit somewhere, and it is a markup change to a page the
LaneIQ design pass owns rather than something to slip into a test task.

### 3.3 Not published by either feed, so not claimed anywhere

Bans, summoner spells, item purchase order. Two earlier entries on this list
were wrong and were corrected: game duration is derivable from the opening
frame, and the details feed does publish a full end-game stat line.
`criticalChance` and `tenacity` are published and empty — zero for 100 of 100
participants sampled across ten games in five leagues — so they are not mapped
rather than rendered as a nought.

### 3.4 Still open on LA-2

TASK-312 (AI previews and recaps) is not being built — Kaan's call, 17 Aug 2026.
TASK-313 (follow teams) is built; match reminders are not — that half needs a scheduled job and a notification channel, and is not started. The tier list's pro-presence
column is built. Embedding is decided and done — ADR-018, click-to-load, with
`frame-src` opened for exactly `player.twitch.tv` and `www.youtube-nocookie.com`.

## 4. E2E, and how to keep it alive

`tests/e2e/esports.spec.ts`, Playwright project `esports`. Public, no auth, no
seeded row — the section is stateless.

The feeds are replayed from `tests/e2e/fixtures/esports/` so the run reaches no
network, which CLAUDE.md 5.4 requires and which also makes the run deterministic
rather than dependent on whether a match happened to be playing.

- **Refresh the fixtures:** `node scripts/capture-esports-fixtures.mjs`. It talks
  to the live feed on purpose and is not run by CI. Commit what it writes.
- **When to refresh:** when a mapper stops finding a field, when a schema is
  widened, or when the captured split is old enough that its league is gone.
  `manifest.json` records what was captured and every test reads its ids from
  there, so a refresh moves the tests with it.
- **What the replay does not carry:** a live match (nothing is ever live in a
  run, by construction), the ranked meta snapshot, and the Data Dragon
  catalogues. Uncaptured endpoints answer 503, which is the same shape as the
  feed being down — so adding a page that reads something new will surface as an
  empty state in the test rather than a silent pass.
