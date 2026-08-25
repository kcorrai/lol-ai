# LoL AI Coach — desktop companion

Reads Riot's **Live Client Data API** on the player's own machine. That API listens on
`https://127.0.0.1:2999` and nothing running on a server can reach it — which is the whole
reason this application exists (`docs/adr/ADR-005-live-client-api.md`,
`docs/adr/ADR-038-desktop-companion-architecture.md`).

It is a separate application: its own `package.json`, its own dependencies, its own build.
It takes no part in the website's build, test run or type check. It lives in this
repository so the design system stays reachable by relative path
(`docs/adr/ADR-039-desktop-design-system-sharing.md`); `git subtree split --prefix=desktop`
extracts it with its history whenever a separate repository is wanted.

## Status

**Phase 5 of 5, in part.** The two halves are joined and the loop closes. The app
reads the game on this machine and asks the website what it knows about the account
playing it, and the game screen shows both: the scoreboard it can see for itself, the lane
read and the game plan it cannot work out alone.

Pairing (phase 3) is what makes that possible. The player generates a code at Settings →
Desktop app on the website and types it here; this machine then holds its own long-lived
token — exchanged by the Rust core, written to the OS credential store, and never passed to
the webview. Revoking the device on the website cuts it off, mid-game included: the app
finds out on its next call and forgets the token locally.

When a game ends, the app tells the website — and that is the one thing it can say that
the website could not have worked out. A server pulls an account when somebody opens the
dashboard and the data is half an hour stale, because nothing on it knows a match is over.
This window does, to the second. A "Game over" panel then offers the match list, opened in
the player's own browser rather than inside this one.

The tray is built. Closing the window no longer ends the process — it hides it, and the
app keeps watching for a game; the tray icon brings it back and its menu is the only way
out. Launching on start-up is offered in Settings and ships **off**, because putting
itself in somebody's start-up list uninvited is the thing the competitors' reviews
complain about. A second copy of the app hands its request to the first and exits, rather
than polling `2999` twice.

There is also an overlay now: a second window, frameless and transparent, that draws the
same two panels over the top of the game. `Ctrl+Alt+L` shows and hides it, and so does the
tray menu. It never takes focus — a companion that pulls the keyboard out of a running
game is worse than no companion — and it is toggled rather than pinned, because an overlay
that cannot be dismissed is the complaint the competitors' reviews open with. Windows will
not draw anything over a game running in exclusive full screen, so League has to be in
borderless; the app says so in Settings rather than claiming a detection it cannot perform.

What remains of phase 5 is signed updates with an update channel. Signing needs a
certificate and a release pipeline that do not exist yet, and Riot registration has to be
in flight before any of it ships (ADR-038). Everything that needs a backend feature not
yet built still says so rather than pretending.

### What the live dashboard shows

**This lane** — how the matchup goes for everyone on this patch, and how it has gone for
this account. The two are kept apart: a patch-wide win rate is a fact about the matchup and
a personal one is a fact about the player, and averaging them would produce a number that
is true of nobody. A personal record always carries its sample size, because over three
games a win rate is a story about three games.

**Game plan** — how the matchup is played, and what this player keeps doing wrong
regardless of it. Both are readings the website already produced. **Nothing on this path
calls a model**: a round trip at the start of every match would cost the player time in the
one minute they cannot spare, and a deterministic reading is one that can be checked
against the data behind it.

The lane is derived from what is already on the player's own screen — the active player
matched against the scoreboard, the enemy in the same position. Every case that cannot be
resolved answers with nothing and says so, because a confident wrong reading is worse than
an empty panel. The website is asked **once per matchup**, not once per poll: the game is
read about once a second and this answer changes when a game starts and not once more.

| Phase |                                             | Needs Rust | Changes the schema |
| ----- | ------------------------------------------- | ---------- | ------------------ |
| 1     | Shell, LaneIQ chrome, Live Client reader    | no         | no                 |
| 2     | Tauri core, IPC surface, OS keychain        | yes        | no                 |
| 3     | Pairing — `DesktopDevice`, `/api/desktop/*` | yes        | yes                |
| 4     | Live dashboard — matchup, game plan         | yes        | no                 |
| 5a    | Post-game handoff                           | yes        | no                 |
| 5b    | Tray, launch on start-up                    | yes        | no                 |
| 5c    | Overlay window                              | yes        | no                 |
| 5d    | Signed updates and an update channel        | yes        | no                 |

### The IPC surface

| Command                             | Answers                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `live_client_get(path)`             | One Live Client Data API path, or `null` when no game is running. The path is checked against a fixed allowlist, so the webview cannot aim the privileged client somewhere it should not go.                                                                                                                                                           |
| `pair_device(code)`                 | Exchanges a pairing code for this machine's token. The token goes to the credential store here; what comes back is the account it belongs to.                                                                                                                                                                                                          |
| `device_account()`                  | Who this machine is acting as, asked of the website, or `null`. A 401 means the device was revoked — the token is forgotten locally and this answers `null`.                                                                                                                                                                                           |
| `device_status()`                   | Whether this machine holds a token, asked of the credential store alone. Never the token, and no network — which is what lets an app opened offline know it is still paired.                                                                                                                                                                           |
| `live_context(request)`             | What the website knows about the game on screen — the lane read and the game plan — or `null` when this machine is no longer paired. Goes through the core because the reading is personal, so the request has to carry the device token, and the token is not allowed to exist in a webview.                                                          |
| `post_game()`                       | Tells the website a game has ended so the account is pulled now, or `null` when this machine is no longer paired. Takes no argument: the account is read from the device row and what game it was is read from Riot, so all the app contributes is the timing.                                                                                         |
| `open_report()`                     | Opens the player's match list in their **own** browser. Takes no URL — the address is built in the core from the compiled-in base, so a renderer that went wrong could not choose what gets opened. Not a navigation inside this window: a companion to a running game must not turn itself into a browser.                                            |
| `desktop_fetch(path, method, body)` | One allowlisted `/api/*` path on the website, with the device token attached, returned unparsed — or `null` when this machine holds no token. The one command behind every screen lifted from the website (ADR-043). Same shape as `live_client_get`: the webview names the path, the core checks it against a fixed list.                             |
| `open_on_website(path)`             | Opens one **page** of the website in the player's own browser (ADR-044) — how a screen the companion does not cover gets reached. Takes a path where `open_report` takes nothing, because these pages are not known at build time; it does not take a host, and `website::is_page` refuses a path that could name one, or that names an `/api/` route. |
| `clear_device_token()`              | Forgets it locally.                                                                                                                                                                                                                                                                                                                                    |

### Which pages are here at all

[ADR-044](../docs/adr/ADR-044-the-companion-covers-a-subset-and-hands-back-the-rest.md): the
companion covers the screens worth having beside a running game, and the rest of the site
stays on the site. A path with no route here renders `OnTheWebsite`, which opens it in the
browser — so "not covered" is a destination rather than a dead end, and leaving a page alone
is a decision rather than a backlog item.

Read the section below as _how_ to add one, not as a queue to work through.

### Adding a page

Since [ADR-043](../docs/adr/ADR-043-desktop-pages-reuse-the-website-client.md) a page is the
website's own client component, rendered here unchanged. Three steps, no Rust:

1. **A line in `src/routes.tsx`** — the website's path, a label, an icon, and a lazy import
   of its `PageClient`. The nav rail reads the same table, so a screen cannot exist in the
   router and be missing from the rail.
2. **The API paths it reads, in `src-tauri/src/proxy.rs`.** Read them off the page rather
   than guessing — every `/api/` string reachable from its imports. A trailing slash in that
   list means "and everything under it"; without one the match is exact, which is what stops
   `/api/subscription` quietly reaching a `/cancel` somebody adds later.
3. **`deviceAccess: true` on those routes**, in the website's tree. Both ends have to agree:
   a path missing from step 2 is never sent, and a route missing the flag answers 401.

Then `npm run typecheck`. It compiles the website's tree under this app's config, which is
where a missing shim or an unresolvable import shows up first.

**This only works for a page the website renders on the client** — one with `"use client"`
or a `PageClient.tsx`. An `async` server component (most of esports, academy and marketing)
calls its domain services directly and has no API route behind it, so it needs one written
first. ADR-043 has the count: 60 pages of the website's 108 are liftable as they stand.

**What is deliberately not shimmed.** `src/compat/` covers `next/link`, `next/image`,
`next/navigation`, `next/dynamic` and `next-auth/react` — the whole Next surface the
website's client components touch. Anything else fails the typecheck rather than failing
quietly at run time, and that is the intended behaviour: the shim list is a statement about
what this app can render, and it should be edited on purpose.

### Where it points

The website's address is **compiled in**: `http://localhost:3001` for a debug build — the
port the website's own `npm run dev` serves on, not Next's default —
`https://lolaicoach.gg` for a release one, overridable at build time with `LOLAI_API_BASE`.
Deliberately not a runtime setting — this client carries the device token, and anyone who
could write to a config file could otherwise point it, and the token, at a host of their
choosing.

## Running it

```
npm install --prefix desktop
npm --prefix desktop run tauri dev     # the real app
npm --prefix desktop run dev           # browser preview on :3010, no game access
npm --prefix desktop run test          # frontend
npm --prefix desktop run test:rust     # core
```

The browser preview is useful for laying out screens, but it cannot reach the game: a
webview has no path to a certificate the public root stores do not carry. It says so on
screen instead of reporting "no game".

Prerequisites are Rust and the MSVC C++ build tools; WebView2 ships with Windows 10 1803
and later.

```
winget install --id Rustlang.Rustup -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--add Microsoft.VisualStudio.Workload.VCTools"
```

## The app icon

`src-tauri/icons/_source.png` is the master; the rest are generated from it with
`npx tauri icon src-tauri/icons/_source.png`. The mark is the design system's chamfer —
cut at top-left and bottom-right only — as a ring, with a rising lane through it.

Note that the repository root ignores `*.png` to keep stray screenshots out of commits;
`desktop/.gitignore` exempts these back in, because they are build inputs and the bundle
will not build without them.

## What it will never do

No input sent to the game, no automation of any kind — no auto-accept, no auto-pick, no
auto-ban — no process memory reads, no packet inspection, no modification of any game
file. No enemy ability or summoner spell cooldown tracking, both of which Riot prohibits
outright. No notification that tells the player what to do from the state of the running
game, which Riot prohibits as well: every live panel here describes and none instructs.

The LCU API — champion select, and writing a rune page — is built, and sits behind the
Cargo feature `lcu`, which is **not** in `default`. Riot does not support that API for
third-party applications and requires pre-release approval for every release and every
update, and bans its use for players in Korea. Building with it before that approval
exists risks the Riot API key for the whole product, the website included.

```
cargo build --features lcu     # only for a build that has been through Riot's approval
```

LoL AI Coach isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot
Games or anyone officially involved in producing or managing Riot Games properties.
