# TASK-295: Rebuild the dashboard on the LaneIQ visual system

## Goal

Replace the flat 22-widget dashboard with the three-layer composition authored
against LaneIQ. See [ADR-015](../adr/ADR-015-laneiq-visual-system.md) for the system
and [TASK-294](./TASK-294-laneiq-rebrand.md) for the token layer this builds on.

## The problem being fixed

`app/(app)/dashboard/PageClient.tsx` rendered ~22 widgets at equal visual weight in
a two-column scroll. A referral widget sat at the same importance as "you are
tilting, do not queue." There was no answer to "where do I look first."

## Structure

**Layer 1 · Decision** — one panel, three columns, above the fold:

- `ReadinessVerdict` — the 0–100 score as a 56px numeral, the verdict headline, and
  Mental + Warm-up meters. This consolidates what were three separate widgets
  (`SessionReadinessWidget`, `TiltWidget`, `WarmupWidget`) into one verdict, so the
  player is not left reconciling three boxes.
- `FocusColumn` — today's single action, how-to, and its impact/timeframe stats.
- `LastGameColumn` — champion, result, four stats, and the AI insight lines.

**Layer 2 · Analysis** — under a `// ANALYSIS · LAST 20 GAMES` rule:

- `AnalysisDeltas` — win rate / KDA / CS-min / vision as **deltas first**, with
  "now X · was Y" as the footnote.
- Momentum chart + form strip, `PlaystyleProfile`, improvement plan, week summary,
  patch impact, meta picks, `ChampionPoolPanel` (pool + role split), habits, duo.

**Layer 3 · Archive** — `// MATCH LOG` rule, then the filterable match list.

`EngagementStrip` (XP, daily challenge, referral) is last on the page by rule.

## States

`NoAccountState`, `SyncingState`, `SyncErrorState`, `DashboardSkeleton` — all four
are real product states and all four are now designed rather than improvised.

## Not done

- **Free-plan habit gating** (see below) is still not implemented.

## Verified in a browser

PostgreSQL 16 is installed locally at `C:\pgdata\lolai` but not registered as a
service. Start it with:

```
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "C:\pgdata\lolai" -l "C:\pgdata\lolai\server.log" start
```

**Do not point local at the Neon URL** commented out in `.env.local` — that is
production, and local refetch intervals burn its transfer quota (TASK-282).

Signed in as `dev@lolai.test` / `test1234`, all three layers render against real
seeded data. Three defects were found and fixed this way:

1. `AnalysisDeltas` printed `now 30.0% · was 30.0%` when `profile.delta` was absent
   — an invented previous period that read as a real, flat comparison. It now shows
   the value alone with "no previous period yet".
2. `PlaystyleProfile` showed **118%** kill participation. Root cause is upstream:
   `matchAnalysisService.ts:106` computes it against `avg("kills") + 5` instead of
   real team kills, so the share exceeds 1. The panel clamps to 100%; **the
   calculation itself still needs fixing** and is not covered here.
3. `DailyChallengeWidget` rendered "Loading challenges for today…" forever when a
   player had no challenge — a loading message standing in for an empty state.
4. `TopBar` pushed the page 12px wide at 390px: the mobile logo, the Riot ID pill,
   the bell and the avatar do not fit in 358px and none of them could shrink.
5. **Two account switchers, out of sync.** `DashboardHeader` shipped its own
   switcher backed by local state while the shell's `RiotAccountSelector` writes to
   `uiStore` — so switching accounts in the top bar left the dashboard showing the
   old one. The header is now identity-only and the page reads
   `uiStore.activeRiotAccountId`.
6. **Native `<select>` controls.** Both the account switcher and the match log's
   champion filter used `<select>`, whose option list the browser paints as a white
   panel with a blue highlight — unreachable by any stylesheet and the exact
   opposite of the HUD. `RiotAccountSelector` is now a chamfered chip with a
   notched panel (click-outside + Escape + listbox roles), and the champion filter
   is chips like the role filter beside it. Zero native selects remain on the page.

Interactions were exercised by hand: the momentum metric tabs redraw the chart, and
the match-log filters narrow the list correctly (Top 2 · Mid 8 · Support 3 · all 10,
W 3 · L 7). No `undefined` / `NaN` / `[object Object]` reaches the page.

- **App shell unchanged.** The design specifies a 76px icon rail and a 56px top bar
  (`AppShell`/`Sidebar`/`TopBar`). Those still use the pre-rebrand layout; they pick
  up LaneIQ colors from the token layer but not the rail geometry.
- **Reused widgets keep their own composition.** `DailyMomentumChart`,
  `ImprovementPlanWidget`, `WeekSummaryWidget`, `PatchImpactWidget`,
  `MetaRecommendationsWidget`, `HabitDetectionCard`, `DuoWidget`,
  `WinrateTrendWidget` and `RecentMatchList` are placed into the new grid but were
  not rewritten onto the notch motif.
- **Free-plan gating on habits.** The design blurs all but the first detected habit
  for free users behind a "See all 4 habits" upsell. `HabitDetectionCard` renders
  ungated; the gate is not implemented.

## Nothing lost

The rebrand is visual only, so every widget's job still has a home:

| Removed                                                  | Replaced by                           |
| -------------------------------------------------------- | ------------------------------------- |
| `SessionReadinessWidget` + `TiltWidget` + `WarmupWidget` | `ReadinessVerdict`                    |
| `TodaysFocusCard`                                        | `FocusColumn`                         |
| `LastGameInsightCard`                                    | `LastGameColumn`                      |
| `PerformanceSummaryCards` + `RecentMatchesSummaryCard`   | `AnalysisDeltas` + `PlaystyleProfile` |
| `TopChampionsWidget` + `RoleDistributionWidget`          | `ChampionPoolPanel`                   |
| `ProgressionStrip`                                       | `EngagementStrip`                     |

`PerformanceTrendChart` had no equivalent — `DailyMomentumChart` plots days, not
matches — so it is still rendered, under the momentum chart.

The superseded files are left in place pending a delete decision.

## Acceptance

- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass
- [ ] All four states verified in a browser against a seeded account
- [ ] Mobile layout checked at 390px
