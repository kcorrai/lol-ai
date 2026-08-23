# ADR-026: The Streamer Kit is a browser-source overlay, not an in-game one

## Status: Accepted

## Context

We want something built for Twitch and Kick streamers. The obvious reference points are
Porofessor, Blitz, Mobalytics and iTero, all of which ship an **in-game overlay** that draws on
top of the League client. Two independent facts rule that lane out for us.

**We cannot technically reach it.** Those overlays are Overwolf desktop applications. They read
Riot's Live Client Data API, which binds to `127.0.0.1:2999` and is reachable only from the
player's own machine. A page served from our origin cannot fetch it — not through CORS, not at
all, and not without shipping a desktop client, which is a different product with a different
release process and a different support burden.

**It is also the most restricted surface Riot has.** Riot's third-party rules, as documented in
Overwolf's Riot compliance guide, prohibit tracking or timing _enemy_ abilities and summoner
spells outright, call ultimate timers "strictly forbidden", and ban power-spike notifications
and action-dictating alerts ("gank top now"). An overlay "may only provide static data available
prior to the game". Even the parts we could build would need a compliance review, and the
LeagueBroadcast project's history shows the adjacent workaround — reading game memory — is now
closed off by Vanguard. Building toward that lane means building toward a review we might lose.

Meanwhile there is a second lane that our competitors in the _stat-site_ category already
monetise and that no LoL product does well: the **OBS browser source**. OP.GG runs a Custom
Streamer Overlay at `streamer-overlay.op.gg`; Tracker.gg ships `tracker.gg/overlays` for
Valorant. The streamer picks a widget, gets a URL, pastes it into OBS as a Browser Source. No
install, no client, no game hooking.

A separate question is the chat layer — the `!rank` / `!build` / `!op.gg?` spam every LoL
streamer fields. The reference implementations there are Nightbot, StreamElements and Fossabot
custom commands.

## Decision

**The Streamer Kit is a browser-source overlay plus a chat-command layer. It reads only our own
post-match data, and it ships no desktop component.**

Four decisions follow from that.

**1. Every number comes from stored Match-V5 data, never live game state.** Rank, LP, session
record, last game, champion pool. This is the same data our dashboard already renders. Because
nothing is live and nothing describes an opponent, the whole feature sits outside Riot's
in-game-overlay restrictions — there is no enemy cooldown, no ultimate timer, no in-game
prompt. It needs no compliance review, and there is no anti-cheat surface to be closed off
later.

**2. Access is a capability key, not a session.** OBS and Nightbot cannot carry a login. Enabling
creator mode mints an unguessable `overlayKey` that scopes both the overlay pages and the chat
endpoints. This is the pattern the repo already uses twice — `DraftSeries.blueToken`/`redToken`
for login-free draft rooms, and `CoachingReport.shareToken` for shared reports — so it adds no
new security concept. The key is rotatable, and rotating it invalidates the OBS sources and the
chat commands together.

We considered Twitch OAuth instead. It is strictly more work, it requires a registered Twitch
application before anything can be built, it locks out Kick and YouTube, and it buys nothing the
key does not for a read-only stat overlay. It becomes necessary only for the features deferred
below, and the key design does not block adding it.

**3. The overlay honours the streamer's broadcast delay.** `delaySeconds` on the creator profile
makes every widget compute its numbers as of `now − delaySeconds`, server-side.

This is the part no competitor does, and it is a real defect in the alternatives. Riot's own
Streamer Mode hides a Riot ID from viewers on third-party trackers but does not hide it from
opponents in the game, so streamers add a manual OBS delay on top. Their stat overlay then
contradicts the delay: the video is ninety seconds behind while the overlay updates instantly,
so the overlay announces that a game just ended before the broadcast shows it. Applying the
delay to the data closes that gap. `streamSafe` does the matching job for identity, redacting
the Riot ID from every payload we serve.

Both are applied in the data service, not in the widget, so a redacted payload cannot leak the
real Riot ID even to someone reading the OBS source.

**4. Chat commands are plain-text HTTP, not a bot.** `/api/overlay/<key>/chat/<command>` returns
a single line of `text/plain`. Nightbot, StreamElements, Fossabot and Kick's Botrix all support
`$(urlfetch <url>)` inside a custom command, so one endpoint serves **Twitch, Kick and YouTube
on day one**.

A first-party bot was the alternative. It needs a long-lived socket per channel, which does not
fit serverless deployment, and it needs per-platform OAuth and (on Twitch) Verified Bot status
to scale. It would take much longer to reach fewer platforms. If we later want proactive
messages — "he just hit Diamond" posted without a viewer asking — that is when a bot earns its
cost, and it can reuse everything here.

## Consequences

**Good.**

- Ships without a desktop client, without a Twitch application, and without a Riot compliance
  review.
- Works on Twitch, Kick and YouTube from the first commit, because it is just a URL.
- The delay and stream-safe behaviour are a genuine differentiator, not a feature-parity item.
- Free on every plan: each overlay carries our mark on the streamer's canvas, which makes this
  an acquisition surface rather than a revenue line.

**Bad, and accepted.**

- We do not compete on the in-game overlay, so anyone comparing us feature-for-feature with
  Porofessor will find us absent there. That is the correct trade, but it is a real gap.
- The overlay is only as fresh as the last match sync, which was previously driven by dashboard
  visits. Mitigated by having the overlay endpoint request a sync when the account is stale,
  through the existing `riot/sync.requested` event, whose worker already serialises per account.
- The key is a bearer capability. Anyone who obtains it can read that creator's public-facing
  stats — which are, by construction, the numbers the streamer is displaying to their audience
  anyway. Rotation is the remedy.
- One key covers both overlays and chat, so rotating for one rotates the other. Splitting them
  would double the surface for a threat model that does not distinguish them.

**Deferred, and unblocked by this design.** Twitch OAuth and account linking; EventSub reactions
to `stream.online`; unlocking premium from a channel subscription; auto-created and
auto-resolved Twitch Predictions seeded by a win-probability model; alert popups on promotion or
win streak; a first-party chat bot.
