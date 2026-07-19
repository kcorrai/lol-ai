# TASK-234 — Onboarding covers Champions, Coach Chat, OTP, Invite-a-friend, Discord webhook

## Status: In Progress

## Problem

The forced first-journey skips several sections. The user wants the tour to also visit Champions,
Coach Chat, OTP Assistant, the Profile *Invite a friend*, and the Discord *webhook*, and point the
user at the key control on each.

## Fix

- Sidebar `tourId`s (`src/components/layout/Sidebar.tsx`): `nav-champions`, `nav-coach-chat`,
  `nav-otp`, `nav-profile`, `nav-discord`.
- Anchors: `champion-pool-grid` (wrap `<ChampionPoolGrid>`), `chat-input`
  (`CoachingChatView` textarea), `otp-recommendations` (TASK-235), `invite-friend`
  (`ReferralWidget` copy control), `discord-webhook` (webhook URL input).
- Guide steps appended after `leaderboard-inside`, before `finish`: `go-champions → champions-inside`,
  `go-coach-chat → coach-chat-try`, `go-otp → otp-inside`, `go-profile → invite-friend`,
  `go-discord → discord-webhook`. Each `go-*` is a route step with `goTo`; the inside step is a
  manual spotlight (reuses TASK-220 non-blocking + TASK-231 `skipIfMissing` for conditional
  sections: otp recommendations, discord webhook). Bubble stays on-screen via TASK-230.
- `guideSteps.test.ts`: `KNOWN_ANCHORS` += the new anchors.

## Deliverables

- `Sidebar.tsx`, `champion-pool/PageClient.tsx`, `CoachingChatView.tsx`, `ReferralWidget.tsx`,
  `settings/discord/PageClient.tsx`, `guideSteps.ts`, `guideSteps.test.ts`.

## Verification

Playwright: each new step navigates + spotlights its control; conditional sections (otp/discord)
skip when absent; bubble in viewport.
