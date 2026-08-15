# Esports Section — Master Plan

**Status:** Planned
**Decisions:** [ADR-016](./adr/ADR-016-esports-data-source.md) (data source),
[ADR-017](./adr/ADR-017-esports-url-structure.md) (URLs and indexation)
**Tasks:** TASK-297 → TASK-314

---

## 1. Why build this

LaneIQ ranks today for champion-intent queries (builds, counters, tier lists).
Esports intent is a second, larger, and almost entirely separate demand pool that
the same audience searches — schedules, standings, rosters, results, "what did the
pros pick" — and it recurs on a weekly competitive calendar rather than a patch
cycle. It is also the cheapest traffic we can serve: the data is free (ADR-016)
and the pages are static.

The strategic point is not the traffic itself but where it lands. Someone reading
"Chovy's Azir build at Worlds" is one click from `/builds/azir`, and one more from
"see how *your* Azir compares." The esports section is a funnel with a
scoreboard attached — which is why the cross-linking task (TASK-310) and the
you-vs-pro task (TASK-311) are not optional garnish.

## 2. Demand map

Ordered by how much of the section's value each cluster carries.

| Cluster | Representative queries | Pages | Refresh |
|---|---|---|---|
| Schedule & live | "lol esports schedule", "who is playing today", live scores | Hub, `/schedule` | 15 min / 30 s |
| Standings | "lec standings", "lck standings 2026" | League + tournament pages | 1 h |
| Teams & rosters | "t1 roster", "g2 lineup", "[team] next match" | `/teams/[slug]` | 24 h |
| Players | "faker stats", "[player] champion pool" | `/players/[slug]` | 24 h |
| Results & drafts | "[a] vs [b] result", "worlds final draft" | `/matches/[id]` | immutable |
| Pro meta | "worlds pick ban stats", "most picked champions pro play" | `/champions` | 1 h |
| Pro builds | "faker azir build", "pro build [champion]" | `/champions/[champion]` | 24 h |

The last two clusters are the ones that connect to the existing product surface,
and they are also the ones no schedule aggregator does well.

## 3. Architecture at a glance

```
src/domains/esports/                    new bounded context, isolated like riot/ and meta/
├── index.ts                            the ONLY import surface for the rest of the app
├── types.ts                            our types, not the feed's
├── services/
│   ├── esportsApi.ts                   fetch + zod + fresh/last-good cache helper
│   ├── leagueService.ts                leagues, tournaments
│   ├── scheduleService.ts              upcoming / live / completed events
│   ├── standingsService.ts             standings + bracket normalisation
│   ├── teamService.ts                  teams, rosters
│   ├── playerService.ts                player index + profiles
│   ├── matchService.ts                 event details, series → games
│   ├── gameStatsService.ts             livestats window/details → scoreboard, draft, gold
│   ├── proMetaService.ts               pick/ban/win aggregation per tournament
│   └── proBuildService.ts              items + runes per champion from completed games
└── components/                         section-specific UI

app/(esports)/esports/...               ISR pages, public, marketing/app chrome by session
app/api/esports/live/route.ts           the one polled endpoint (rate limited)
src/hooks/useLiveEsports.ts             React Query hook for the live island
```

Rules this obeys: no Riot/esports fetching outside the domain, no cross-domain
imports except through `index.ts`, no component fetching directly, no business
logic in the route handler, services under 250 lines, components under 200.

## 4. Task sequence

Each task is one commit. Tasks 297–304 are the spine and ship in order; 305–314
are independently shippable once the spine exists.

| Task | Title | Ships |
|---|---|---|
| TASK-297 | Esports domain foundation — API client, leagues, schedule | data layer, no UI |
| TASK-298 | `/esports` hub, section chrome, nav, image/CSP hosts | first public page |
| TASK-299 | `/esports/schedule` | schedule cluster |
| TASK-300 | Leagues + standings | standings cluster |
| TASK-301 | Team index and team pages | teams cluster |
| TASK-302 | Player pages | players cluster |
| TASK-303 | Match pages with drafts and scoreboards | results cluster |
| TASK-304 | Live scoreboard (API route + hook + polling island) | live surface |
| TASK-305 | Cache warming and revalidation on the match calendar | freshness |
| TASK-306 | Tournament pages and brackets | tournament cluster |
| TASK-307 | Pro pick/ban meta table | pro meta cluster |
| TASK-308 | Champion-in-pro-play pages with pro builds | pro builds cluster |
| TASK-309 | SEO layer — JSON-LD, OG cards, sitemap, canonicals | indexation |
| TASK-310 | Cross-linking into builds, champions, tier lists | funnel |
| TASK-311 | "You vs the pros" comparison | conversion |
| TASK-312 | AI match previews and recaps (cached, top leagues) | content depth |
| TASK-313 | Follow teams and match reminders — **needs schema approval** | retention |
| TASK-314 | E2E coverage, docs, launch checklist | done |

## 5. Non-goals for this section

- **No paywall on esports data.** The section is acquisition; gating it defeats
  the purpose and worsens the licensing position (ADR-016).
- **No live-game predictions or betting-adjacent content.** Wrong audience, and
  it drags the domain into a category we do not want to be classified in.
- **No VOD hosting or embedding beyond the official links** the feed provides.
- **No writing esports data into Postgres** before TASK-313 is approved. Phase 1
  is a cache over a feed; keeping it that way is what makes it cheap.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Upstream feed changes shape or blocks us | Zod boundary + never-expiring last-good snapshots; pages degrade to schedule-only rather than 500 (ADR-016) |
| Thin auto-generated pages get filtered | No-content pages are `noindex` and excluded from the sitemap (ADR-017 §4) |
| Live polling costs run away | One route, one hook, polling only while something is live; rate limited like the other public endpoints (TASK-278) |
| Section cannibalises champion-cluster rankings | Distinct intent, distinct canonicals, and deliberate one-directional linking into `/builds` and `/champions` (TASK-310) |
| AI recaps become a per-view cost | Generated once per match, cached permanently, top-tier leagues only (TASK-312) |

## 7. Definition of done for the section

- All spine tasks (297–304) shipped, plus 305–310 and 314.
- Every esports page renders with the feed unreachable (last-good or empty state),
  verified by forcing a fetch failure.
- Sitemap contains only pages with real content; no filtered URL is indexable.
- Lighthouse LCP under 3 s on `/esports` and a team page, mobile.
- Zero cross-domain imports that bypass `src/domains/esports/index.ts`.
