# ADR-044: The companion covers a subset of the site and hands back the rest

## Status: Accepted

Amends ADR-043's premise. Its mechanism stands unchanged, and ADR-038 and ADR-042 are
untouched.

## Context

ADR-043 was written to answer a request from Kaan on 2026-08-24: that the desktop app cover
every page the website hosts. It answered it well — a desktop page became the website's own
client component rendered unchanged, and the per-page cost fell from "three pieces in two
languages" to a line in `routes.tsx`, a prefix in `proxy.rs` and a flag on the routes behind
it. The expensive part of that — the five `next/*` shims, `apiBridge`, the router, the alias
layer — is built and paid for.

On 2026-08-25 Kaan asked whether to stop porting pages and put the website in a webview
instead, on the grounds that writing the pages ourselves had not worked and looked like too
much work.

The first half of that was out of date by a day: since ADR-043 we do not write the pages. The
desktop Dashboard is `app/(app)/dashboard/PageClient.tsx`, unmodified. The estimate that made
it look like too much work — months, ~300 hand-mirrored pieces — was ADR-042's price, and
ADR-043 is what removed it.

The second half was still a fair question, and embedding was priced properly rather than
dismissed:

- **The pairing model would go.** Today the device token lives in the operating system's
  credential store, the webview never sees one, and the content policy `connect-src 'self'
ipc:` is literally true because the window opens no socket. A webview pointed at the site
  holds a session cookie and talks to the network itself. ADR-038's central property, and
  the work behind LA-59, would be spent.
- **The core would need remote IPC.** Reading the live game on 2999 and driving the overlay
  are the reasons this process exists, and a remote origin cannot `invoke` without
  `dangerousRemoteDomainIpcAccess`. The flag is named after its own review.
- **It would fail at the moment it is for.** Game and overlay work today with the website
  unreachable. Embedded, a player mid-match gets a browser error page.

But the question exposed a real mistake in ADR-043's premise, which neither embedding nor
lifting fixes: **covering all 108 pages was never the right goal.** `/pricing`, `/terms`,
`/coaches`, `/admin/*`, the esports and academy trees — none of them belong in a narrow
window beside a running game. Chasing full coverage means paying, per page, for pages nobody
wants there.

`post_game.rs` had already written the principle down, for a different reason: _"this window
is a companion to a running game and must not become a browser."_

## Decision

**The companion covers the screens that belong beside a game. Everything else opens on the
website, in the player's own browser.**

Neither lifted nor embedded — handed back.

Three consequences:

**Uncovered is a destination, not a gap.** A path with no desktop route used to render one
sentence with no way to act on it — "That screen is not in the desktop app yet. Open it on
the website." — reachable by an ordinary click on any link a lifted screen draws to the rest
of the site. It is now `OnTheWebsite`, which names the page and opens it. The word "yet" is
gone from the copy deliberately: this is where those pages live.

**Opening a page is a Rust command, not a webview permission.** `open_on_website(path)` joins
`open_report`. The opener plugin's own commands are still not granted to the renderer — the
capability is still `core:default` plus `autostart:default` — so every address this app can
open is still built in Rust on the compiled-in base. `open_report` takes no path because its
address is a constant; this one takes a path because the pages are not known at build time,
and `website::is_page` refuses any path that could name a host instead of a route. It applies
`proxy::is_allowed`'s discipline for `proxy::is_allowed`'s reason, and additionally refuses
`/api/` — nothing under it is a page.

**Which screens are covered is a product decision, recorded on the board.** It is a list, not
a race to 108. Adding one is still ADR-043's three edits; the change here is that not adding
one is now a decision rather than a backlog item.

## Consequences

Full coverage of the website stops being a goal, so the tail costs nothing to leave alone,
and ADR-043's per-page mechanism is spent only where it earns its keep.

The player crosses an application boundary to reach the rest of the site, and lands in a
browser session rather than the pairing — they may have to sign in there. That is the honest
cost of ADR-038's rule that this app holds no session cookie, and it is the same boundary
`open_report` has always crossed.

`website::is_page` allows any page-shaped path on our own host, not an allowlist of known
pages. An allowlist of ~100 tail routes would go stale against the site it mirrors and buy
little: the renderer is our own bundled code, and the widest thing a wrong path reaches is a
different page of our own site, opened in a browser the player controls.

Nothing here is hard to walk back. If the covered list grows to most of the site, ADR-043's
mechanism is what grows it, and this ADR simply stops applying.
