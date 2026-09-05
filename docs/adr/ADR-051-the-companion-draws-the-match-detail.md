# ADR-051: The companion draws the match detail

## Status: Accepted

Extends ADR-044's covered list by one screen and ADR-043's mechanism by one thing it could not
do before: a route with an id in it. ADR-038's rule about what a device token may reach is
unchanged, and ADR-047's rule — a link the window cannot draw is followed in the browser —
is unchanged. What changes is which links that rule applies to.

## Context

On 2026-09-05 Kaan, using the app, said that clicking a match sends you to the website and that
it should be shown in the app.

ADR-047 had already settled the principle and, in the same document, recorded one place where
the principle had produced the wrong outcome: the "Game over" panel opened `{base}/matches` in
the player's browser for a screen this window draws itself. That was called a plain mistake
rather than a trade-off, and it was fixed by making the button a navigation.

The match detail is the same mistake at a larger scale, and it was not visible from the sidebar
because it is not a sidebar row. Five of the covered screens are lists of matches, and every
row on them is a link to `/match/<id>`:

- the dashboard's last game (`LastGameColumn`),
- the match archive's rows (`ArchiveResultRow`) — the screen whose whole purpose is finding a
  match to look at,
- the coaching report's rail (`ReportRail`),
- the heat map's recent list (`RecentMatchList`),
- the career timeline's records (`careerEventBuilders`).

`/match` was not in the route table, so `goTo` did what ADR-047 tells it to do with an address
this window cannot draw: it handed the path to the browser. The single most-clicked link on the
covered screens was the one that ended the session in the app — and unlike the sidebar rows
ADR-047 deleted, this one gives no warning before the click, because it is a row of data rather
than a row labelled "on the website".

Lifting it costs nothing that ADR-047 priced. The four pages it could not lift were server
components, credential screens, a token stream and a page with its own shell. `/match/[matchId]`
is none of those: it is `"use client"` top to bottom, so there is no server half to split off,
and its four reads are ordinary owner-scoped `GET`s.

One thing had to be built rather than listed. Every lifted screen so far reads its data from a
query string or from nothing; this is the first that reads an id out of its own address. The
`useParams` shim was written for that day and never finished — it read a module variable that
the route table was supposed to write on each match, and nothing ever wrote it. It returned `{}`
at every address, and no test failed, because no screen here had ever asked.

## Decision

**The covered list gains `/match/<id>`.** One row in `routes.tsx`, rendering the website's own
`app/(app)/match/[matchId]/page.tsx`. It is `inRail: false` — the first row that is not in the
sidebar. A detail screen is a destination, not a section: nothing navigates to `/match` itself,
and there is nothing to draw there. ADR-047's "a row in the table is a screen" survives intact;
what it did not say, and now says, is that a screen need not be a button.

**The route table names its dynamic segments.** A route may carry `params: ["matchId"]`, and
`routeParams(path)` reads the segments back off the address. `useParams` derives its answer from
that rather than from a variable someone has to remember to write — there is no write to forget,
which is the property the old shim lacked. A route that named no segments has none, so
`/matches/<id>` — the archive answering for its own subtree — is unaffected.

**Four paths are added to `proxy.rs`, and the four routes take `deviceAccess: true`.** The
detail itself and the three panels that read alongside it: `lane-phase`, `story` and
`build-explanation`. All four are reads of one match the caller played. `build-explanation` is
the only one that can reach a model, and it is bounded the way ADR-041 bounds the others:
ownership of the participant, a Pro plan, an hourly rate limit, and a cached answer for a match
that has already been played.

## Consequences

The click works. A player looking at their games in the companion stays in the companion, which
is the whole of what was asked.

**The allowlist has its first trailing wildcard.** `/api/match/*` is one segment, but that
segment is the last one — so unlike `/api/riot/*/performance`, where the wildcard is fenced in
by a name on both sides, this entry covers every single-segment route under `/api/match/`. Two
exist today and both are meant to be here. A third would be swept in by being written rather
than by a decision, which is the cost of putting an id at the end of a path, and it is why the
entry is not the cheaper `/api/match/`. The alternative — a fourth pattern form that constrains
the shape of an id — buys little against a route named by this project's own developers.

**The match detail brings its own header.** The page draws a sticky bar with "← Dashboard" and,
where a report exists, a link to it. On the website that bar sits under the app shell; here it
sits under this window's frame, so there are two. It is the website's own component rendered
unchanged, which is ADR-043's bargain, and both of its links now stay in the window.

Walking this back means putting a link back that leaves the app for a page the app can draw.
