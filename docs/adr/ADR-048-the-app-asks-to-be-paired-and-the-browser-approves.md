# ADR-048: The app asks to be paired, and the browser approves it

## Status: Accepted

## Context

Pairing a machine took five steps and one of them was typing (ADR-038):

1. Open a browser and sign in on the website — with two-factor, which gates every route.
2. Find Settings → Desktop app.
3. Press a button to mint an eight-character code, good once and for ten minutes.
4. Read the code off the screen.
5. Type it into the app.

Every one of those is a place to stop. The code is the worst of them: it is transcription
work the player does on behalf of the software, in the one minute they have least patience
for it, and its ten-minute expiry means a player who is interrupted comes back to a code
that no longer works and has to start at step 3.

The step exists for a real reason. The app is a native process with no session and no way
to get one — a webview that could hold the player's credentials is the thing ADR-038 refuses
to build — so *something* has to carry authority from a signed-in browser to an unsigned
process. A short code is the classic answer when those two are on different machines.

But they are not on different machines. The app is running on the computer whose browser
the player is signed in on, and it can open that browser itself. The code is carrying
authority across a gap that is one process call wide.

## Decision

The app asks to be paired; the browser approves it. This is OAuth 2.0's Device Authorization
Grant (RFC 8628) with the user code removed, which is exactly the part that grant includes
for devices that *cannot* open a browser — a television, a CLI on a remote host. This one
can.

1. The app generates a secret and posts a pairing request: its machine label, its platform,
   its version, and the hash of that secret. It gets back a request id. **No session** — the
   request asserts nothing and is worth nothing on its own.
2. The app opens the player's browser at the approval page for that request id.
3. The page — behind the ordinary session, like any other settings page — names the machine
   asking, when it asked, and what approving it grants. The player presses Approve, which is
   a POST.
4. Approval mints the device and its token, exactly as redeeming a code does.
5. The app polls a claim endpoint with the secret it generated in step 1 and receives the
   token once.

**The secret, not the request id, is what claims the token.** The id travels in a URL — it
is in the browser's address bar, its history, and any referrer — and treating it as a
bearer of authority would mean a request id read over somebody's shoulder pairs the reader's
machine instead. The secret never leaves the two ends that need it: the app holds it in
memory, the website holds only its SHA-256.

**Approval is a POST from an authenticated session, and never a side effect of the GET.** A
link that pairs a machine by being visited is a link that can be sent to somebody.

**The request expires in ten minutes and is claimed once.** The same window the code had,
for the same reason, and the claim is a conditional update rather than a read followed by a
write, so two claims race to one winner.

The code flow is **kept**, behind a disclosure on the setup screen. It is the answer when
the browser this app can open is not the one the player is signed in on — a work machine, a
second profile, a phone — and it is already built and tested. What changes is which one the
player meets first.

## Consequences

- **A new table**, `desktop_pairing_requests`. It holds no token: approval creates a
  `DesktopDevice` the way redeeming a code does, and the claim reads the token off that row.
  One place mints device tokens, still.
- **A request row exists before any account does.** Its `userId` is null until approval,
  which is the difference from `DesktopPairingCode` — that one is minted *by* a signed-in
  player and has never had a nullable owner. The two could not share a table without making
  the existing one's ownership optional, which would weaken a column that is currently a
  guarantee.
- **An unapproved request is an unauthenticated write.** Rate limited per IP and ten minutes
  to live, indexed on `expiresAt` — which is the same treatment the pairing code table gets,
  and it is worth saying plainly that neither of them has a sweep job yet. This adds a second
  table that wants one.
- **The app polls.** Roughly every two seconds while the setup screen is open, and never
  otherwise; the claim endpoint is rate limited per request id, and a request that has
  expired answers the same "not yet" as one still waiting, so polling cannot be used to
  enumerate.
- **Two ways in to maintain.** Accepted deliberately: the fallback is the one that works
  when the assumption behind the fast path — that this machine's browser is the player's —
  does not hold.

## Alternatives considered

**A custom URI scheme** (`lolaicoach://pair?code=…`), so the approval page hands the code
back to the app directly. No new table, no polling. Rejected: it needs a registry entry per
machine, which an unsigned development build does not reliably get; browsers show their own
"allow this site to open an application?" prompt, which is a step *back* into the flow; and
a scheme any process can claim is a place to send a code to the wrong application.

**A local HTTP listener in the app**, with the approval page posting the token to
`127.0.0.1`. Rejected outright for production: the site is served over HTTPS, and a page on
`https://lolaicoach.gg` cannot post to `http://127.0.0.1` without the browser blocking it as
mixed content.
