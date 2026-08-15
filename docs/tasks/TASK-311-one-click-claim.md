# TASK-311 — Claim a profile in one click

Depends on [TASK-310](./TASK-310-public-profile-on-laneiq.md). Closes the friction track that
[TASK-308](./TASK-308-player-search-index.md) opened.

## Goal

Delete the last stretch of setup. A player looking at their own public profile has already told
us their Riot ID; pressing one button should be the entire remaining distance to a syncing
account.

## The problem being fixed

The path was: find yourself → sign up → find `/settings/accounts` in the sidebar → **retype the
Riot ID you just searched for** → pick the region again → wait. Every step after "sign up" was
asking for information the product already had on screen.

## Change

- `src/lib/riot/claim.ts` — `claimQuery` / `parseClaim` / `isAlreadyConnected`.
- `app/(marketing)/s/components/ClaimProfileButton.tsx` — "This is me — track it" on the public
  profile. Signed in it connects from there; signed out it carries the Riot ID into sign-up.
- `src/domains/identity/components/RegisterForm.tsx` — forwards a claim through the login callback
  URL, and says which account will connect while the visitor fills the form.
- `src/components/dashboard/ClaimAccountOnArrival.tsx` — finishes the claim on arrival, mounted in
  both dashboard branches.

## Three params, not one

Riot IDs allow spaces and punctuation, so `claim=region:name:tag` is a parsing bug waiting for the
right name. `claimRegion` / `claimName` / `claimTag` cannot be ambiguous, and `URLSearchParams`
does the escaping. A test covers `the: real #1 guy`.

## Where it does nothing

- **No claim in the URL** — the component renders nothing and issues no request.
- **Account already connected** — recognised before the request, case-insensitively and per
  platform, so returning to your own profile does not re-POST.
- **Connected in another tab** — the API's "already connected" conflict is treated as success,
  because the goal the player asked for is met.
- **The account list is still loading** — it waits rather than deciding against unknown state.

Only a genuine failure surfaces, and it points at `/settings/accounts` rather than leaving a
dashboard that silently has no account on it.

The claim is stripped from the URL *before* the request, not after: a refresh mid-connect would
otherwise start it over.

No change was needed to guided onboarding — its "go to accounts" step already carries
`satisfiedGate: "hasAccount"`, so a claimed account fast-forwards past it.

## Tests

`claim.test.ts` — round trip including a name with a colon and a hash, platform lowercased while
the name's casing survives, null unless all three parts are present, and connected-detection that
is case-insensitive but platform- and tag-sensitive.

`ClaimAccountOnArrival.test.tsx` — connects on arrival, clears the URL, does nothing without a
claim, skips an account already connected, waits for the account list, stays quiet on the
"already connected" conflict, and points at manual setup on a real failure.

`PageClient.test.tsx` mocks the new component — it reads the app router, which that test does not
mount.

## Verified in a browser

Signed out, the profile CTA renders `This is me — track it` linking to
`/register?claimRegion=tr1&claimName=kaanproak0&claimTag=TR1`, and that page confirms which
account will connect. Neither is visible to `curl`: both are client-rendered, one behind the auth
status and one behind a Suspense boundary.

The full search path was checked the same way — typing `ka` on the landing page returns eight
real accounts, `ArrowDown` sets `aria-activedescendant`, and `Enter` lands on
`/s/tr1/kaanproak0/TR1`.

**Found this way:** every dropdown row was invisible to the accessibility tree.
`getByRole("option")` returned nothing while the rows were plainly on screen, because the options
sat inside per-section sub-lists instead of being owned by the `listbox`. The list is now flat
with `role="presentation"` headings, and a test asserts on the role so it cannot regress.

refs TASK-311
