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

Pairing (phase 3) is what makes that possible. This machine holds its own long-lived token
— exchanged by the Rust core, written to the OS credential store, and never passed to the
webview. Revoking the device on the website cuts it off, mid-game included: the app finds
out on its next call and forgets the token locally.

**Nothing is typed to get it** ([ADR-048](../docs/adr/ADR-048-the-app-asks-to-be-paired-and-the-browser-approves.md)).
The app asks the website to open a pairing request, opens the player's browser on the page
that approves it, and claims the token when they press the button — about two seconds later,
without them coming back to this window. It used to be five steps ending in eight characters
read off one screen and typed into another, which is transcription work the software was
asking a person to do on its behalf, in the minute they have least patience for it.

The secret is what claims the token, and the request id is not. The id is in a URL — address
bar, history, referrer — so it is deliberately not enough on its own; the app generates
thirty-two random bytes, sends only their SHA-256, and presents the bytes at the claim. That
secret never enters this webview, under the same rule the device token lives under.

The code still works, behind a disclosure on the setup screen. It is the answer when the
browser this app can open is not the one the player is signed in on — a work machine, a
second profile, an account they are only signed in to on a phone.

When a game ends, the app tells the website — and that is the one thing it can say that
the website could not have worked out. A server pulls an account when somebody opens the
dashboard and the data is half an hour stale, because nothing on it knows a match is over.
This window does, to the second.

The "Game over" panel then draws the game itself — the result, the champion, the scoreline,
the creeps and the vision — and still offers the full report, which is the `/matches` screen
in this window: it used to open a browser on a page this app draws itself (ADR-047). It waits to be sure first: the pull is asynchronous and
nothing tells this window it finished, so the archive is read until the match is actually in
it, for a bounded minute, and the panel keeps its "on its way" sentence until then. Telling a
player their game is ready and handing them a list that does not have it yet is worse than
telling them it is coming. The competitors all put a breakdown on screen the moment a match
ends; what took this one longer is that it would not claim a game was there before it was.

The tray is built. Closing the window no longer ends the process — it hides it, and the
app keeps watching for a game; the tray icon brings it back and its menu is the only way
out. Launching on start-up is offered in Settings and ships **off**, because putting
itself in somebody's start-up list uninvited is the thing the competitors' reviews
complain about. A second copy of the app hands its request to the first and exits, rather
than polling `2999` twice.

There is also an overlay now: a second window, frameless and transparent, that draws the
same panels over the top of the game. `Ctrl+Alt+L` shows and hides it, and so does the
tray menu. It never takes focus — a companion that pulls the keyboard out of a running
game is worse than no companion — and it is toggled rather than pinned, because an overlay
that cannot be dismissed is the complaint the competitors' reviews open with. Windows will
not draw anything over a game running in exclusive full screen, so League has to be in
borderless; the app says so in Settings rather than claiming a detection it cannot perform.

**And it is the player's now.** Settings changes the shortcut, the screen it sits on, the
corner of that screen and the margin from it, which panels it draws, and how solid they are.
Every competitor has offered this and this app offered none of it; the shortcut in particular
was a real gap rather than a decision, since a player whose own bindings collide with
Ctrl+Alt+L had no way out of it.

What is deliberately absent is dragging the window. That is how all of them move an overlay,
and it costs them a window that takes focus — clicking a window activates it, and the click
is on top of a running game. A corner and a margin reach the same place without asking the
player to take their hands off the match. The shortcut and the placement live in the core,
in `settings.rs`, and are written to one small JSON file in the app's config directory; the
panel list and the opacity are drawing decisions and stay in the webview's own storage. The
webview gains no permission from any of it — `capabilities/default.json` is unchanged.

What remains of phase 5 is signed updates with an update channel. Signing needs a
certificate and a release pipeline that do not exist yet, and Riot registration has to be
in flight before any of it ships (ADR-038). Everything that needs a backend feature not
yet built still says so rather than pretending.

### Before the game

Champion select is where every competitor's advice lands, and it is the one moment this app
cannot see: it is only reachable through the League Client API, which ships compiled out
(ADR-038). `/pregame` is the part of it that does not need that interface. The player names
the two champions and the lane, presses a button, and gets the same lane reading, build and
game plan the live dashboard would have shown them a minute later — `live_context` takes its
request from the webview and has never required a running game.

They type where a competitor would read, and in exchange the app never touches an interface
it is not allowed to touch. That trade is said on the screen itself rather than left for
somebody to wonder about.

Nothing is fetched as the pickers move. `/api/desktop/live-context` is rate limited per
device because it was written for a game — which asks once and then not again for forty
minutes — and two pickers that fetched as they moved would spend a match's worth of that
allowance in half a minute of clicking. One button spends one request, each answer is kept
for the life of the window under the same matchup key the live dashboard uses, and the limit
was raised from twenty to forty when this screen arrived.

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

**So far** — what has already happened: the objectives that were taken and when, the turrets
that fell, the kills, and which of them were the player's own. The event stream had been
arriving all along — `allgamedata` carries it and the poll pulls it once a second — and
nothing read it.

It counts nothing down. Every respawn interval is a game constant that moves between patches,
this repository has no verified table of them, and a confidently wrong countdown over a
running game is worse than no panel (LA-74). The event names and their fields are taken from
Riot's own published sample rather than from memory, and an event name this build has not
heard of costs a row rather than the parse.

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
| `start_pairing()`                   | Asks the website to open a pairing request and sends the player's browser to approve it (ADR-048). Grants nothing: what comes back is a request id and how long it lasts. The browser is opened from the core, so the address the player decides at is never one the renderer chose.                                                                   |
| `poll_pairing()`                    | Whether that request has been approved yet — `idle`, `waiting`, or the pairing. Called on a two-second timer by the setup screen and by nothing else. Deliberately not a command that waits for the answer: a ten-minute await holds a thread and cannot be told the player has gone somewhere else. The secret it presents stays in the core.         |
| `cancel_pairing()`                  | Stops waiting. The request is left to expire — nothing was granted, so there is nothing to revoke.                                                                                                                                                                                                                                                     |
| `device_account()`                  | Who this machine is acting as, asked of the website, or `null`. A 401 means the device was revoked — the token is forgotten locally and this answers `null`.                                                                                                                                                                                           |
| `device_status()`                   | Whether this machine holds a token, asked of the credential store alone. Never the token, and no network — which is what lets an app opened offline know it is still paired.                                                                                                                                                                           |
| `live_context(request)`             | What the website knows about the game on screen — the lane read and the game plan — or `null` when this machine is no longer paired. Goes through the core because the reading is personal, so the request has to carry the device token, and the token is not allowed to exist in a webview.                                                          |
| `post_game()`                       | Tells the website a game has ended so the account is pulled now, or `null` when this machine is no longer paired. Takes no argument: the account is read from the device row and what game it was is read from Riot, so all the app contributes is the timing.                                                                                         |
| `desktop_fetch(path, method, body)` | One allowlisted `/api/*` path on the website, with the device token attached, returned unparsed — or `null` when this machine holds no token. The one command behind every screen lifted from the website (ADR-043). Same shape as `live_client_get`: the webview names the path, the core checks it against a fixed list.                             |
| `open_on_website(path)`             | Opens one **page** of the website in the player's own browser — where a link out of a lifted screen goes (ADR-047). It takes a path because these pages are not known at build time; it does not take a host, and `website::is_page` refuses a path that could name one, or that names an `/api/` route.                                               |
| `clear_device_token()`              | Forgets it locally.                                                                                                                                                                                                                                                                                                                                    |
| `overlay_settings()`                | The shortcut, screen, corner and margins the overlay is drawn with. Read from `settings.rs` at start-up and held in memory, because every resize asks for it.                                                                                                                                                                                          |
| `set_overlay_shortcut(accelerator)` | Registers a new combination and gives up the old one — in that order, so a combination something else already holds leaves the player with the shortcut they had rather than none.                                                                                                                                                                     |
| `set_overlay_position(…)`           | Moves the overlay to a screen and a corner of it, and remembers both. Applied before it is saved: a file that would not write should not stop the window moving where it was asked.                                                                                                                                                                    |
| `list_monitors()`                   | Every attached screen, for the picker in Settings. A screen the OS does not name cannot be chosen, because the setting is stored as a name.                                                                                                                                                                                                            |

### Which pages are here at all

[ADR-044](../docs/adr/ADR-044-the-companion-covers-a-subset-and-hands-back-the-rest.md): the
companion covers the screens worth having beside a running game, and the rest of the site
stays on the site. Leaving a page alone is a decision rather than a backlog item.

[ADR-047](../docs/adr/ADR-047-the-companion-lists-only-what-it-draws.md) is what the sidebar
does about that: nothing. Every row in `routes.tsx` is a screen this window draws, and the
half of the table that used to list the rest of the site — nineteen rows whose only behaviour
was a panel saying "this page lives on the website" — is gone. A link out of a lifted screen
still works: `goTo` follows a path this window cannot draw into the player's browser and
leaves the window where it was.

**And none of them before there is an account.** An unpaired window could fill three of
those rows and no coaching at all — every lifted screen reads the website through a device
token this machine does not hold yet, so each one drew the same sentence pointing at a
fourth screen, and the rail offered fourteen ways to go and read it again. A list of the
things that do not work is not a menu. Until the pairing exists the window is one screen
(`SetupFrame`), with no rail and no router; the navigation arrives with the account, and
the first screen after it is `/game`.

Only `unpaired` and `pairing` go there, which is the half of that rule worth stating: setup
has no exit except pairing, so a state that *cannot* pair would be stranded on it. The
browser preview has no credential store, and an `offline` machine already holds the token
it would be sent to fetch. `needsSetup` is where that lives, and its test is mostly about
what must not trigger it.

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

### Opening it without a terminal

`tauri dev` is a developer's way in, and it was the only way in — which meant the app could
not be opened by the person it is for. There is a shortcut now:

```
npm --prefix desktop run build
cd desktop && LOLAI_API_BASE=http://localhost:3001 npm run tauri build -- --no-bundle
powershell -ExecutionPolicy Bypass -File desktop/scripts/install-shortcuts.ps1
```

The first two produce a standalone `src-tauri/target/release/lol-ai-desktop.exe` — its
frontend is bundled, so it needs no Vite. `LOLAI_API_BASE` is there because a release build
otherwise compiles in `https://lolaicoach.gg`, which does not resolve yet; a build for a real
release drops it.

The third puts "LoL AI Coach" on the desktop and in the Start menu, pointing at
`scripts/launch.vbs` rather than at the exe. The launcher is what makes the shortcut worth
having: the coaching half of every screen goes to the website, so it starts the Postgres
cluster at `C:\pgdata\lolai` and the site's own `npm run dev` when they are not already up,
opens the app, and shuts down only what it started once the app is quit from the tray. It
refuses to start when something other than this site holds port 3001 — `desktop_fetch` sends
the device token there, and that is not a thing to send to whatever answers.

**No console window at any point.** The shortcut targets `wscript.exe` on a three-line
`launch.vbs`, which starts `launch.ps1` hidden; what the player sees instead is a small
window in the app's own colours, carrying one line about what is happening and closing once
the app's window is actually on screen rather than the moment the process starts. Aiming the
shortcut at `powershell.exe` left a black console in the taskbar for the whole session —
and closing it took the site server with it, which is not a thing a window should do
without saying so. A second click while the first launch is still working is dropped by a
named mutex rather than starting a second `npm run dev`.

One Windows detail is load-bearing here and it bites twice: a process started hidden passes
that show state to its **first** top-level window, and it passes it on to the processes it
starts as well.

- The splash. A plain `Form.Show()` in a hidden process creates a window that reports
  `Visible = true` and draws nothing. `Show-Splash` sets `WindowState` to `Minimized` and
  back to `Normal` around the `Show()` call to break the inheritance. Remove those two lines
  and the launcher goes silent again.
- The app itself, which opened **minimised** — to somebody who has just clicked a shortcut,
  not different from it failing to open. Fixed in the app rather than the launcher, because
  nothing about how the process was started should decide whether its window is on screen:
  `lib.rs` calls `show_main` on `RunEvent::Ready`. `Ready` and not `setup`, and that is the
  whole fix — `setup` runs before the window has been shown, so the state the OS applies
  afterwards wins and the call does nothing at all.

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
