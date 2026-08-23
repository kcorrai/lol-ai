# TASK-228 — Query match data by puuid so shared accounts see their matches

## Status: In Progress

## Problem

TASK-222 lets multiple app users link the same Riot account, but match data is owned by a single
`matchParticipant.riotAccountId`. All analysis queries filter by `riotAccountId`, so the first user
to sync "owns" the participant rows and a second user linking the same Riot ID sees an empty
dashboard/coaching. (Confirmed: same puuid → two `riotAccount` rows; only the syncing account's row
returns matches.)

## Fix

Read **match data** (`matchParticipant`) by the account's **puuid** instead of `riotAccountId`.
For a single-user account this returns the exact same rows (that account owns its puuid's
participant rows), so **no regression**; for a shared account, every linking user sees the same
matches.

- Per-account _record_ tables stay keyed by `riotAccountId` (each user keeps their own):
  `ChampionStat`, `RankedHistory`, `CoachingReport`, `ImprovementPlan`, `PlayerHabit`, `TiltAlert`,
  `Achievement`/`UserAchievement`, `Challenge`, and `MatchDeathEvent` (has no puuid; each account
  generates its own via its timeline sync). Their _computation_ now reads matches by puuid.
- Helper `getAccountPuuid(riotAccountId)` (`src/domains/riot/services/accountLookup.ts`).

## Scope (matchParticipant read sites → puuid)

~38 sites across analysis + champions + coaching services (matchAnalysisService, championCacheService,
tiltService, warmupService, achievementService, challenge\*, heatmapService, teamfightService,
recapService, retentionService, milestoneService, matchupService, patchService,
performanceSnapshotService, proComparisonService, rankBenchmarkService, rankUpService,
championDeepDive/StatsService, counterPickService, masteryScoreService, cardDataBuilders,
monthlyMilestoneService). `matchDeathEvent` queries stay on riotAccountId.

## Verification

Unit: existing service tests still pass (single-user rows unchanged). tsc + lint. E2E: connect the
same Riot ID on a second app account → its dashboard shows the same matches/stats.
