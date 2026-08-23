# ADR-038: Desktop companion architecture

## Status: Accepted

## Context

ADR-005 evaluated Riot's Live Client Data API in 2026 and returned "Conditional Go —
Deferred". Its blocker has not moved: the API listens on `127.0.0.1:2999` on the player's
own machine, and a Vercel function has no route to it. The 2026-07-20 addendum recovered
part of the value from the server — Spectator-v5 sees a game once it has _started_, which
is enough to prefill the draft analyzer — and concentrated the rest on the two things only
a local process can do: advice during picks and bans, and live in-game events.

LA-25 hit the same wall from the browser while building the streamer overlay and reached
the same conclusion: the competitors' overlays are desktop applications, because nothing
else can read `2999`.

So the remaining work is a desktop client. This ADR settles how it is built, where it
lives, what it is allowed to read, and how it authenticates.

## Decision

### Stack

**Tauri 2.11.5** (current stable, 2026-07-01) with a Rust core and a React + Vite frontend.

Electron was rejected on the requirement that made this app worth building: it runs while
League is running. The player is already spending their CPU and RAM on the game, and a
companion that competes with it for either will be closed and not reopened. Tauri renders
through the OS webview — WebView2 on Windows, already present on every supported machine —
instead of shipping a second browser.

The frontend is Vite rather than Next.js. There is no server in this process, so App
Router, RSC and the Next build pipeline buy nothing and cost startup time.

### Location: `desktop/`, inside this repository

The app is a self-contained project with its own `package.json` and its own Cargo
workspace. It does not participate in the web app's build, its test run, or its
type check.

It nonetheless lives in this repository rather than beside it. Work in a sibling directory
is work no one commits: this project's agents commit the repository they are checked out
in, and untracked files outside it have been stranded and lost before. Keeping the app
under `desktop/` also keeps the design system reachable by relative path (ADR-039), which
is the mechanism that stops the two products drifting apart visually.

Nothing about the layout depends on staying here. `git subtree split --prefix=desktop`
extracts it, with its history, whenever a separate repository is actually wanted.

### What it is allowed to read

Two local sources, deliberately unequal.

**Live Client Data API — `https://127.0.0.1:2999/liveclientdata/*`.** Riot documents these
endpoints, publishes an OpenAPI schema for them, and states they are available to native
applications running on the same machine. This is the app's core, and every feature that
matters is built on it alone.

The certificate is self-signed. The Rust client validates against Riot's published root
certificate rather than disabling verification, so a hostile local process cannot
impersonate the game by binding the port first.

**LCU API — behind a capability gate that ships disabled.** Riot's own documentation says
the League Client API "is not officially supported for use with third party applications",
and the January 2019 policy change added three conditions: pre-release approval for every
release and update, an approved-endpoint allowlist, and a ban on applications using it for
players in Korea.

Champion select — the moment advice is worth the most — is only reachable through it. So
the capability exists in the architecture, and ships switched off. It turns on for a build
that has been through Riot's approval, and never for a Korean client. No feature that the
product promises may depend on it.

**Implemented as a Cargo feature, `lcu`, absent from `default`.** A compile-time gate
rather than a runtime setting, because the property worth having is that a shipped binary
*cannot* call the API rather than that it chooses not to. `desktop/src-tauri/src/lcu.rs`
holds it: two endpoints named by an enum — the champion select session, and writing one
rune page — so no string from the webview reaches the client at all. A test asserts a
default build both reports itself disabled and refuses.

The cost of enabling it early is not confined to this application: Riot deactivating an
API key over an unapproved LCU integration takes the website with it. That makes turning
the feature on a release decision, and it is deliberately not one anybody can take by
editing a config file.

### What it will never do

Not deferred, not gated — absent. No input injection or automation of any kind: no
auto-accept, no auto-pick, no auto-ban. No process memory reads, no packet inspection, no
anti-cheat interaction, no modification of any game file.

No enemy ability or summoner spell cooldown tracking. Riot's current wording is broader
than the 2025-03-13 ultimate-timer ban this ADR first cited: the prohibition covers
"tracking of enemy ability cooldowns, or facilitating players tracking these with timers"
and the same sentence again for summoner spells. Teammate timers are a different thing and
are not prohibited; this product does not ship them either, because they are not what it
is for.

No notification that dictates player action from the current game state. Riot's example is
"enemy champion is underleveled, go gank top lane", and it is the constraint that shapes
every live panel here: this product describes and never instructs. "Your CS is 6.2 a
minute and your average is 7.1" is a fact about the player. "Go gank top" is a decision
taken away from them. The same line rules out power-spike alerts, which Riot names
separately.

No information about a game session that the player could not already see, and nothing
that de-anonymises a champion-select player outside their own party — Riot requires
non-party summoner names in ranked champion select to be replaced with "Ally 1", "Ally 2"
and so on.

### How it authenticates

The desktop client never holds a password and never holds a web session cookie.

The player, signed in on the web, generates a one-time pairing code. The desktop client
exchanges that code once for a long-lived device token, and the token goes to the OS
keychain — DPAPI on Windows, Keychain on macOS, Secret Service on Linux — through the
Rust layer. It is never passed to the webview, never written to the config file, and
never logged.

This is the pattern the product already uses twice for clients that cannot carry a
session: `CreatorProfile.overlayKey` for OBS and Nightbot (ADR-026) and
`DraftSeries.blueToken` for a draft room guest. `src/domains/creator/overlayKey.ts` —
base64url generation and `timingSafeEqual` comparison — is reused rather than rewritten.

## Consequences

**Gained.** Champion select and live in-game state become reachable at all, which no
amount of server-side work could achieve. The one thing every competitor has and this
product does not.

**Paid.** A second platform, a second language, and a release pipeline with code signing
and an update channel — none of which the web product needed. Riot requires every product
to be registered and audited through the Developer Portal, and the desktop client is a
separate product from the website; charging for it additionally requires Approved or
Acknowledged status and a free tier. That application has to be in flight before this
ships, not after.

**Deferred.** The pairing endpoints and the `DesktopDevice` model are a later phase: they
change `prisma/schema.prisma`, and in this repository a schema change red-lines every
other worktree's type check until each regenerates its client. The first phase is
therefore the shell and the Live Client reader, neither of which touches the database.

**Rejected.** Shipping champion select as a headline feature was rejected: it rests on an
unsupported API behind an approval this project does not yet have, and a promise that
cannot be kept in Korea at all is not a promise worth printing.
