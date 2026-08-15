# TASK-315 — Rebuild the auth screens on LaneIQ

Follows [TASK-310](./TASK-310-public-profile-on-laneiq.md), which did the same for the public
profile. Source of truth for the layout is the `LoL AI Coach Auth.dc.html` design in the LaneIQ
Claude Design project.

## Goal

`/login`, `/register`, `/forgot-password` and `/reset-password` were the last four surfaces the
TASK-294 rebrand never reached. They rendered a centred shadcn `Card` on a bare page — no split,
no HUD frame, no accent, no mono kickers. Make them LaneIQ, without changing what any of the four
forms actually do.

## Change

- `app/(auth)/layout.tsx` — the split from the design. Left is a full-bleed champion splash under
  the protect gradient, the scanline and the hero fade, carrying the wordmark, the headline block
  and three `StatBlock`s. Right is the form column, capped at 432px, with the mono kicker strip
  above and the free-tools line below.
- `app/(auth)/components/AuthArt.tsx` — the left panel, static and server-rendered.
- `src/domains/identity/components/AuthPanel.tsx` — the chamfered HUD panel every form sits in,
  plus `AuthTabs` (log in / sign up), `AuthError` and `AuthNotice`.
- `src/domains/identity/components/AuthControls.tsx` — `AuthField`, `AuthInput`, `PasswordField`
  (with the show/hide toggle from the design), `PasswordMeter`, `AuthSubmit`.
- `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `OAuthButton` — rebuilt
  on the above.

## What stayed exactly as it was

The rule for this task was visual only. Every schema, every fetch, every redirect and every input
`id` is untouched, because the e2e suite drives these forms by `#name` / `#email` / `#password` /
`#confirmPassword` and `button[type="submit"]`, and the claim and referral query strings ride
through `/register` into the callback URL.

Two things in the design were deliberately not built, because both would have been UI with nothing
behind it:

- **"Keep me signed in."** The NextAuth session is a JWT with a fixed 30-day `maxAge`; a working
  toggle needs the flag threaded through the credentials provider. Not a visual change.
- **The Riot ID + region fields on sign-up.** `POST /api/auth/register` takes name, email,
  password and an optional referral code. A Riot ID is connected after sign-in, in onboarding.

The design's OAuth button is "Continue with Riot". The real provider is Google, and it is only
mounted when `GOOGLE_CLIENT_ID` is set, so the button keeps its own label and caption.

## What the design added that is real

- **Tabs.** Log in and sign up are one panel in the design and two routes here, so the tabs are
  links. They carry the current query string across, which is what keeps `?ref=` and a claim alive
  when someone switches from sign-up to log in and back.
- **Password strength meter** on sign-up — client-side scoring only, no gate.
- **Terms checkbox** on sign-up, gating the submit. `/terms` and `/privacy` both exist.
- **Show / hide** on every password field.

## Copy

The design says a reset link expires in 30 minutes. `app/api/auth/forgot-password/route.ts` sets
`Date.now() + 3_600_000`, so the screen says one hour.

## Tests

`AuthControls.test.tsx` — the meter's score bands, and the show/hide toggle flipping the input
type, since that is the only behaviour these primitives carry.

refs TASK-315
