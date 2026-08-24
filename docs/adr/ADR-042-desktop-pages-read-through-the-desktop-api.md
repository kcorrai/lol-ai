# ADR-042: Desktop pages read through `/api/desktop/*`

## Status: Accepted

## Context

The desktop companion has three screens — Game, Pairing, Settings. The website has 108
pages. The companion is running on the player's machine for the length of a match and has
nothing for them to read between games, which is the difference between an app people keep
installed and one they uninstall.

The competitor worth measuring is Mobalytics, and it was measured rather than guessed at
(2026-08-24, on Kaan's machine):

```
Mobalytics.exe          202 MB   ← Chromium runtime
resources\app.asar      547 MB   ← the application itself
owutility.dll                    ← Overwolf
total install           856 MB
```

Running: 15 processes, 9 renderers, ~1.6 GB of memory. The process arguments name
`--standard-schemes=owepm,app` and `--secure-schemes=app,sentry-ipc`, and the payload is an
`app.asar`. That is ow-electron — Overwolf's fork of Electron — serving its interface from
the `app://` scheme, which means **from a bundle inside the installation**. It has eight
remote connections, for data and for advertising, but the pages are local.

So "native application or website in a window" was the wrong question. Nobody in this
category writes native: they all ship a web application inside Electron. This product
already does the same thing at 38 MB, because Tauri uses the WebView2 runtime Windows
already has instead of carrying a copy of Chromium. The architecture is not the thing that
needs deciding.

What needs deciding is where a new page's data comes from. Three options were live:

1. Point the webview at the website's own pages in an iframe or a second window.
2. Give the webview the device token and let it call the website directly.
3. Add endpoints under `/api/desktop/*`, fetched by the Rust core, rendered by the webview.

## Decision

**Option 3.** Every page in the companion is a screen in the bundled webview, fed by an
endpoint under `/api/desktop/*` that the Rust core calls on its behalf.

**Not the website's pages in a window.** ADR-038 already rules out this window becoming a
browser, and the content policy the app ships with — `img-src 'self' data:`,
`connect-src 'self' ipc:` — exists to keep a compromised renderer from reaching anything. A
frame pointed at the public site would undo both, and it would put a session-authenticated
page inside a process that deliberately holds no session.

**Not the token in the webview.** ADR-038's central constraint: the device token goes from
the pairing exchange to the OS credential store without existing in a browser context. A
page that fetched for itself would need it. So a page is always three pieces — a Next route,
a `#[tauri::command]`, and a hook — and that cost is the constraint being honoured rather
than an accident of the design.

**Device-authenticated even where the data is public.** The first pages are the champion
browser, and nothing on them belongs to one account. They still require the device token, so
that every endpoint under `/api/desktop/*` has one authentication story and so the rate limit
has a device to key on — the only identity a caller with no cookie jar has.

**Server-side rendering of names, not ids.** The content policy forbids remote images, so
item and champion ids are resolved to words on the server. This is not a workaround; it is
why `LiveBuild` already carries names, and the champion browser reuses that shape rather
than inventing a second one.

**One service per feed.** `championBrowserService` makes exactly two calls into
`@/domains/meta` and is the whole of the app's exposure to op.gg for these screens.

## Consequences

**Gained.** The companion becomes somewhere to spend the time between games, on the one
screen a player already has open, without the 800 MB the category charges for it. Each new
page reuses a reading the website already computes; nothing here is a second implementation
of anything.

**Cost.** Three pieces per page, in two languages, with the wire contract mirrored by hand
in Rust — the same tax ADR-038 already accepted, now paid per page instead of once. The
mirror is held honest by tests on both sides, as it is for `contract.ts`.

**Risk carried, not solved.** Every number on these pages comes from the op.gg feed. LA-70
exists to leave that feed, and these pages widen the surface it would have to be led away
from. Kaan's call (2026-08-24) was to build the pages first and keep the feed behind one
service, so that LA-70 changes that service and not the screens. That is a deferral with a
name on it, not an oversight.

**Not decided here.** Whether these windows carry advertising. Riot banned in-game
advertising on 2025-05-29, so an overlay cannot; Riot's general policy does allow it in
application windows ("advertisements are acceptable within a free tier of access"). The
current model is subscription (F-008), and "38 MB, no ads" is currently an argument this
product makes against the category. Adding advertising would be a change to the business
model, a network to choose and a consent flow to build — a separate decision.
