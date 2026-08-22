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

**Phase 1 of 5.** The shell, the design system and the Live Client reader are in place.
There is no Rust core yet, so the app cannot actually reach the game client: it renders
"Unreadable" and says why, rather than pretending no game is running. Everything that
needs the backend states plainly that it is not implemented.

| Phase | | Needs Rust | Changes the schema |
|---|---|---|---|
| 1 | Shell, LaneIQ chrome, Live Client reader | no | no |
| 2 | Tauri core, IPC surface, OS keychain | yes | no |
| 3 | Pairing — `DesktopDevice`, `/api/desktop/*` | yes | yes |
| 4 | Live dashboard — matchup, game plan | yes | no |
| 5 | Post-game handoff, tray, signed updates | yes | no |

## Running it

```
npm install --prefix desktop
npm --prefix desktop run dev       # http://localhost:3010
npm --prefix desktop run test
npm --prefix desktop run typecheck
```

Phase 2 onwards additionally needs the Rust toolchain, which is **not** required for
anything above:

```
winget install --id Rustlang.Rustup -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--add Microsoft.VisualStudio.Workload.VCTools"
```

WebView2 is already present on Windows 10 1803 and later.

## What it will never do

No input sent to the game, no automation of any kind, no process memory reads, no packet
inspection, no modification of any game file. No enemy ability cooldown tracking, which
Riot prohibits outright. The LCU API — champion select — sits behind a capability that
ships disabled, because Riot does not support it for third-party applications and requires
per-release approval for it; see ADR-038.

LoL AI Coach isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot
Games or anyone officially involved in producing or managing Riot Games properties.
