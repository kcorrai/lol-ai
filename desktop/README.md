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

**Phase 2 of 5.** The Rust core is in place, so the app can now actually read the game.
`live_client_get` fetches Riot's Live Client Data API over a connection that trusts Riot's
certificate authority and *no other* — the built-in root store is switched off, so a
process that grabbed port 2999 before League did cannot impersonate it. The device token
lives in the OS credential store and never crosses into the webview.

Pairing itself is next: there is nowhere yet to get a code from. Everything that needs it
says so rather than pretending.

| Phase | | Needs Rust | Changes the schema |
|---|---|---|---|
| 1 | Shell, LaneIQ chrome, Live Client reader | no | no |
| 2 | Tauri core, IPC surface, OS keychain | yes | no |
| 3 | Pairing — `DesktopDevice`, `/api/desktop/*` | yes | yes |
| 4 | Live dashboard — matchup, game plan | yes | no |
| 5 | Post-game handoff, tray, signed updates | yes | no |

### The IPC surface

| Command | Answers |
|---|---|
| `live_client_get(path)` | One Live Client Data API path, or `null` when no game is running. The path is checked against a fixed allowlist, so the webview cannot aim the privileged client somewhere it should not go. |
| `device_status()` | Whether this machine holds a token. Never the token. |
| `clear_device_token()` | Forgets it locally. |

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

No input sent to the game, no automation of any kind, no process memory reads, no packet
inspection, no modification of any game file. No enemy ability cooldown tracking, which
Riot prohibits outright. The LCU API — champion select — sits behind a capability that
ships disabled, because Riot does not support it for third-party applications and requires
per-release approval for it; see ADR-038.

LoL AI Coach isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot
Games or anyone officially involved in producing or managing Riot Games properties.
