# ADR-043: Desktop pages are the website's own client components

## Status: Accepted

Amends ADR-042 (mechanism, not decision) and ADR-038 §K6. Neither is superseded.

## Context

ADR-042 settled where a desktop page's data comes from: an endpoint under `/api/desktop/*`,
fetched by the Rust core, rendered by the webview. It also priced the answer honestly —
"three pieces per page, in two languages, with the wire contract mirrored by hand in Rust."

That price was paid twice, for the champion browser. It cost `desktop/src-tauri/src/champions.rs`,
323 lines of Rust whose entire job is to re-declare types that already exist in TypeScript.
`live_context.rs` is another 380. The website has **108 pages**. Multiplying out, full
coverage is on the order of 17,000 lines of hand-mirrored Rust, ~100 endpoints, and ~100
commands — not a phase of work, a second product.

The mirror is not only expensive, it is unsafe in a specific way this project has already
been bitten by: a field added to `contract.ts` and not to the Rust struct does not fail. serde
fills it with `None`, and the panel that reads it renders blank with nothing in any log to
say why.

Kaan asked (2026-08-24) for the desktop app to cover every page the website hosts, and chose
to stay on ADR-042's architecture rather than put the website in a webview. So the question
this ADR answers is not *where the data comes from* — ADR-042 settled that and it stands —
but **what a page is made of**.

Three facts made a cheaper answer available, and all three were measured rather than assumed:

1. **`live_client_get` already had the scalable shape.** It takes a path from the webview,
   checks it against a fixed allowlist, and returns raw `serde_json::Value`. No mirrored
   structs. The per-page Rust tax was a choice `champions.rs` made, not one ADR-042 imposed.

2. **The website is already a client application.** Of its 108 pages, 44 are client-rendered
   — 12 with `"use client"` on the page itself, 32 delegating to a `PageClient.tsx` — and
   every hook behind them calls a bare `fetch("/api/...")` and reads the `{ data, error }`
   envelope back. 105 hooks over 196 routes.

3. **The two trees do not collide.** No module path exists under both `desktop/src` (43
   files) and `src` (1089), so `@/` can resolve against one and fall back to the other.

## Decision

**A desktop page is the website's own client component, rendered unchanged.**

Adding one is now: a line in `desktop/src/routes.tsx`, an entry in `proxy.rs`'s allowlist,
and `deviceAccess: true` on the routes behind it. No new endpoint, no new command, no Rust.

Four pieces make that true.

**One proxy command instead of one per page.** `desktop_fetch(path, method, body)` —
`desktop/src-tauri/src/proxy.rs` — sends any allowlisted `/api/*` request with the device
token attached and returns the response unparsed. Deliberately shaped like `live_client_get`.
The envelope is *not* unwrapped, unlike `api::read`: the website's hooks expect it and take
their error messages out of it.

**`withAuth` accepts a device token where a route opts in.** `deviceAccess: true`, off by
default. ADR-038's rule is unchanged and is the reason for the default — a route that opts in
must never do anything a stolen device token should not. Both ends have to agree: a path
missing from `proxy.rs` is never sent, and a route missing the flag answers 401.

**A `fetch` bridge, not a network permission.** `desktop/src/lib/apiBridge.ts` intercepts
relative `/api/*` calls and routes them over IPC. The content policy is untouched and still
literally true — `connect-src 'self' ipc:` — because the webview still opens no socket. The
token still never enters a browser context. Anything that is *not* a same-origin `/api/*`
call is left alone to be refused by the policy, which is the point: a bridge that proxied
everything would be a way around the policy rather than a way of honouring it.

**Five shims for the framework this app does not have.** `desktop/src/compat/` stands in for
`next/link`, `next/image`, `next/navigation`, `next/dynamic` and `next-auth/react` — the
only Next surface the website's client components touch, across 192, 69, 73, 2 and 22 files.
`useSession` is backed by the pairing rather than a session, because ADR-038 is explicit that
this app holds no session cookie; a pairing names the account, which is all `useSession` is
ever asked for.

### What this does not change

ADR-042's decision stands in full. The core still fetches, the token still never reaches the
webview, and pages are still device-authenticated even where the data is public. ADR-038's
security posture is unchanged. `champions.rs` and `live_context.rs` keep their mirrors —
they work, and rewriting them is not this task.

### What it costs

**A wider `img-src`.** The policy now allows the four image hosts the website's own policy
trusts (`next.config.mjs`). ADR-042 resolved ids to names on the server *because* remote
images were forbidden; that constraint is narrowed, not removed, and `connect-src` stays
shut — so those four hosts are reachable by `<img>` and by nothing else.

**A larger stylesheet.** ADR-039 kept the desktop's Tailwind `content` globs narrow so the
website's ~300 components stayed out of the denominator. They are in it now, because Tailwind
purges per build and a class this app renders but does not scan for is silently not emitted.
Correct and larger beats small and missing, on a file read from local disk.

**Two `node_modules`, deduped by hand.** The website's packages resolve from the repository
root and this app's from `desktop/`, so `vite.config.ts` dedupes `react`, `react-dom`,
`@tanstack/react-query`, `zustand` and `lucide-react`. Without it the bundle carries two
Reacts — an "Invalid hook call" on first render. Not solved by installing them here: the root
`node_modules` is a junction shared by every worktree, and an install at either end has
detached one before.

**A guarded alias.** `@/` resolving against two roots is safe only while they do not collide.
`desktop/src/lib/aliasCollisions.test.ts` asserts that, because a collision would hand a
website component this app's file with no error at all.

### Coverage, honestly

This does not make 108 pages free. It makes 60 of them nearly free and leaves 48 at close to
ADR-042's original price:

| Kind | Count | Cost per page |
| --- | --- | --- |
| Client-rendered | 44 | A line in the route table |
| Sync server component wrapping a client child | 16 | Lift the client child |
| **Async server component** — esports, academy, marketing, some tools | **48** | **A new endpoint each**: they call domain services directly and no API route exists |

The 48 are where the remaining work is, and they are the ones ADR-042 was really pricing.
Nothing here makes them cheaper; this ADR is about not paying that price 108 times.

## Consequences

**Gained.** The companion can cover the website without becoming a second implementation of
it. A page edited on the website is edited in the desktop app, because it is the same file —
which is the same argument ADR-039 made for the stylesheet, applied one layer up.

**Paid.** The two applications are now coupled at the component level, not just the token
and the stylesheet. A website component that starts using a Next feature with no shim breaks
the desktop build. That is a real constraint and it is the intended one: it fails loudly at
`npm run typecheck` rather than quietly at run time, which is more than the Rust mirror ever
did.

**Risk carried.** Every website component now runs in a window that also holds a keychain
handle and a poll against the game client. The webview's capability set is unchanged — it has
no filesystem, no shell, no arbitrary HTTP — so the blast radius is what it was. What is new
is the amount of code inside the blast radius.
