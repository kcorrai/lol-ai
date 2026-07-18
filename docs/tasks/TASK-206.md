# TASK-206: Amplify the referral loop (one-tap share + dashboard surfacing)

## Status: Done

## Context (verified)
The referral system is already fully built and working — do NOT rebuild it:
- `referralService` (code/apply/complete/stats), API routes `/api/referral/{code,apply,stats}`,
  `useReferralStats` hook, `ReferralWidget`, and register capture (`RegisterForm`
  reads `?ref=`, applies it, shows the "Referral code active" banner; both parties
  get a 7-day Pro trial on Riot connect).

The only real gaps for growth are **visibility** and **share friction**:
- `ReferralWidget` is mounted only on `/settings/profile` (buried).
- It offers copy-to-clipboard only — no one-tap sharing.

## Scope
- `ReferralWidget.tsx`: add one-tap share buttons — X/Twitter, WhatsApp, Reddit
  (intent URLs, `target="_blank"`) and a native Web Share button (shown when
  `navigator.share` exists) with a compelling prewritten message. Keep the copy
  field. Stays a self-contained client component under 200 lines.
- Dashboard: surface `ReferralWidget` on `app/(app)/dashboard/PageClient.tsx`
  (left column) so the loop is visible where users actually are. Minimal insertion.

Note: dashboard PageClient is already 225 lines (pre-existing >200; not introduced
here) — insertion kept to the minimum; a future task can split it.

## Tests
tsc + lint + vitest green. Share intent URLs are plain external links (no CSP
media/connect impact; top-level navigations aren't blocked by the CSP).

## Commit
`feat(referral): one-tap share buttons + surface referral card on dashboard`
