# TASK-235 — OTP Assistant: rule-based "Recommended OTPs for you"

## Status: In Progress

## Problem

The OTP Assistant only analyses a champion the user picks; its analysis is generic (cached per
champion+role, not per-user). The user wants data-driven recommendations of WHICH champion to
one-trick, based on their own performance.

## Fix (rule-based, zero AI cost — confirmed with user)

- `src/domains/otp/services/otpRecommendationService.ts`: `getRecommendedOtps(riotAccountId, limit)`
  reads the account's `ChampionStat` (RANKED_SOLO, min games) + derives the most-played `position`
  per champion from `matchParticipant` (by **puuid**, TASK-228). Scores each champion by
  `games × winRate × masteryWeight` (pure `scoreOtp()` helper, unit-tested). Returns the top
  champions: `{ championId, name, position, games, winRate, avgKda }`.
- `GET /api/otp/recommendations?riotAccountId=` (withAuth + assertOwnsRiotAccount).
- `useOtpRecommendations` hook + `RecommendedOtps` component at the top of `otp/PageClient.tsx`:
  cards (icon, WR, games); clicking one `setChampion(name)` + `setRole(position)` → the existing
  `getOtpAnalysis` flow loads. Anchor `data-tour="otp-recommendations"` (used by the onboarding OTP
  step, TASK-234).

## Deliverables

- `otpRecommendationService.ts` (+ `.test.ts` for `scoreOtp`), `app/api/otp/recommendations/route.ts`,
  `src/hooks/useOtpRecommendations.ts`, `src/domains/otp/components/RecommendedOtps.tsx`,
  `otp/PageClient.tsx` wiring.

## Verification

Unit: `scoreOtp` ranks a high-WR/high-games/high-mastery champ above others. E2E: OTP page shows
"Recommended OTPs for you" from dev's ChampionStat; clicking one loads its analysis.
