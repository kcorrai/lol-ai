# ADR-047: The companion lists only what it draws

## Status: Accepted

Amends ADR-044. Which screens the companion covers is unchanged; how it treats the rest of
the site is not. ADR-038, ADR-042 and ADR-043 are untouched.

## Context

ADR-044 settled that the companion covers a subset of the website and hands back the rest,
and it drew a conclusion from that which looked kind at the time: if the app covers a subset,
the player should at least be able to *see* the whole product from it. So the sidebar carried
every section of the website's own nav, and the nineteen rows the window could not draw
rendered `OnTheWebsite` — a panel whose entire content was the sentence "this page lives on
the website" and a button that opened a browser. `routes.test.ts` locked it in: a row of the
website's sidebar missing from this table failed the suite.

On 2026-08-27 Kaan, using the app, said those parts were pointless: they should either not be
there or be in the app.

He is right, and the measurement is in the numbers. Nineteen of the thirty-nine sidebar rows
— very nearly half — led to no screen. A player reading that sidebar cannot tell the halves
apart before clicking, and the small external-link mark added to the rows was an admission of
that rather than a fix. What they got for the click was a screen that spent its whole surface
explaining that it was not a screen, and then asked them to leave.

The other half of what he asked — put them in the app — was priced before this was written,
because it is the better answer wherever it is available. It is available for none of them:

- **The tools, Esports, Academy and Find a coach** are `async` server components that call
  domain services directly and carry `revalidate`. ADR-043 lifts a page only if the website
  renders it on the client. Converting them would cost the website the ISR and the search
  ranking those public pages exist to earn — a real bill, paid by the product that brings the
  traffic, to save a click in the one that sits beside a game.
- **`/settings/*`** must not be lifted, and this is not a cost but a rule: `proxy.rs` carries
  the device token to nothing that changes a credential (ADR-038). A token sitting in a
  credential store on a machine that may be shared or resold must not be able to change a
  password or spend money.
- **`/coaching/chat`** answers `text/plain` as a stream and the bridge to the core carries a
  JSON body; the screen is a stream of tokens, so it would arrive all at once or not at all.
- **`/teams`** has its own shell on the website, and a lifted screen answers for everything
  under its path — lifting the list would draw the list at `/teams/abc`.

One of the nineteen was a plain mistake rather than a trade-off, and it was not in the
sidebar. The "Game over" panel's button called `open_report`, which opened `{base}/matches`
in the player's browser. `/matches` is a screen in this window. The app was handing the player
to another program to read a page it draws itself.

## Decision

**A row in the table is a screen.** `routesOnWebsite.ts` and `OnTheWebsite.tsx` are deleted,
along with the `onWebsite` field and the sidebar's external-link marks. The rail lists
eighteen rows, every one of which this window draws. `routes.test.ts` now asserts that
directly — `rendersHere` is true for every row — in place of the test that required the
website's whole nav to be present.

**A link out of a lifted page is followed, not answered with a screen.** The website's own
components link across the whole site, so a path this window cannot draw is still reachable
by an ordinary click. `goTo` in `lib/router.ts` is what every link and every `useRouter` call
goes through now: it navigates when `rendersHere`, and otherwise hands the path to
`open_on_website` and leaves the window where it was. Nothing appears if the browser will not
start — there is no longer a surface to say it on, and a swallowed click is a smaller failure
than a dead screen kept alive to report one.

**The post-game report is a navigation.** The panel's button goes to `/matches` in this
window. `open_report`, `post_game::report_url` and the IPC command are removed; `postGame.ts`
loses `openReport` and the hook loses the error state that existed because opening a browser
can fail. Navigating cannot.

**`open_on_website` stays.** It is the mechanism, and it is now the only one: one Rust
command, host still built from the compiled-in base, `website::is_page` still refusing a path
that could name a host or reach `/api/`. What is gone is the screen that used to be built
around it.

## Consequences

The sidebar is honest and about half as long. A player looking at it is looking at what this
window does, which is what a companion's nav should be — and the app stops advertising a
product tour it cannot give.

The rest of the site is no longer discoverable from the app. That is the deliberate half of
this: those pages are discoverable from the website, which is where the player already is
when they want them, and a companion to a running game is not a table of contents. ADR-044's
handoff survives exactly where it is not a dead end — under a link the player chose to click.

The two tables can now drift without a test noticing. ADR-044's suite failed when the
website's nav gained a row this one lacked; that check is gone, because a row this window
does not draw is now the expected state rather than a gap. What is still locked is stronger
per row: the screens the two have in common must agree on label, section and icon.

Walking this back means restoring a table of rows that are not screens. If ADR-043's
mechanism ever grows the covered list to most of the site, the question does not arise —
there is nothing left to list separately.
