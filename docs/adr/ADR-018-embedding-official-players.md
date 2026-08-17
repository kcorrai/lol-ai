# ADR-018: Embed the official Twitch and YouTube players, click-to-load

## Status: Accepted — 17 Aug 2026

## Context

lolesports.com is, at bottom, a place to **watch**. Our esports section had
every other thing it has — schedule, standings, teams, players, match detail,
drafts, scoreboards, gold curves — and offered no way to watch anything except a
link that took the reader off the site.

`ESPORTS_PLAN.md` §5 listed embedding as a non-goal, but the reason recorded
there was not a decision about embedding: it was that an embed needs `frame-src`
opened for two third-party hosts, and CLAUDE.md puts security config behind
review. That is a reason to *ask*, not a reason to decline. Asked, the answer was
"I have no idea whether this is legal — decide on that basis", so the question is
answered here.

Three things had to be true.

### 1. Is framing someone else's video lawful?

For the EU — which is where this site's traffic is — the line is the right of
communication to the public, and the CJEU has drawn it three times:

- **Svensson (C-466/12)** and **BestWater (C-348/13)**: content already freely
  accessible with the rightsholder's authorisation reaches no *new* public when
  it is framed elsewhere. Framing it is therefore not a separate act requiring
  separate permission.
- **VG Bild-Kunst (C-392/19, 2021)** narrowed that: framing **is** infringing
  where it circumvents measures the rightsholder adopted, or required by licence,
  to prevent framing.

Using the platform's own player is exactly what stays on the right side of that
line, and not by accident: it is the mechanism through which the rightsholder
expresses the choice. Riot can disable embedding on any video, and when they do,
the official player refuses to play it. We circumvent nothing; we ask, and the
player answers.

### 2. Do the platforms allow it?

Both publish the terms, and both are satisfied by using the documented player:

- **Twitch** requires HTTPS, requires the `parent` parameter to name the domain
  the player is embedded on, and requires that the player is not obscured by
  other page elements. An embed with no `parent`, or a wrong one, is refused —
  which is why `embedParent` derives it from the app URL rather than hardcoding
  it, so a preview deployment names itself.
- **YouTube's** required minimum functionality: a viewport of at least 200×200,
  no overlays or frames in front of any part of the player, and no modifications
  beyond the documented API.

### 3. Does Riot's own policy allow it?

Riot's developer policy prohibits **repackaging** their content — "simply
ripping off or adding light commentary to existing content such as esports
matches or other players' VODs". That is a rule about *republishing*, and it is
worth being clear about which side of it we are on. We host nothing, we
re-encode nothing, and the page an embed sits on carries our own draft
breakdown, scoreboard, per-minute rates, gold curve and objective ledger. The
player is one element on a page of original analysis.

The test to keep applying: **our page with their player in it, never their
broadcast with our logo on it.** Riot's trademark rule is separate and unchanged
— no Riot logos or marks without a written licence.

### 4. The one real problem: cookies

Neither of the above is the hard part. The hard part is that a third-party
player mounted on page load sets third-party cookies before the reader has
chosen anything, and this site serves TR and EU traffic. That is a consent
question, and answering it with a banner would be answering it badly.

## Decision

Embed the official players, **click-to-load**.

- CSP gains `frame-src https://player.twitch.tv https://www.youtube-nocookie.com`
  — two exact hosts, no wildcard. `player.twitch.tv` is the embed host; the rest
  of `twitch.tv` is not. YouTube is the `-nocookie` variant.
- `WatchEmbed` renders a placeholder button. **The iframe does not exist in the
  DOM until the reader clicks it**, so nothing is requested from either platform
  for a reader who does not want to watch. No cookie is set, so there is nothing
  to consent to, so there is no banner.
- The chips that link out stay. They are how a reader reaches the other eight
  languages, and how anyone reaches a broadcast we can build no embed for. An
  embed is an upgrade on a link, never a replacement.
- `embedUrl` is the only place embed addresses are built. A watch URL and an
  embed URL are genuinely different addresses — `twitch.tv/videos/{id}` versus
  `player.twitch.tv/?video=v{id}` — and a second caller guessing would frame a
  404.

## Consequences

**Good**

- The reader watches the game on the page that explains it. That is the whole
  proposition of the section, and it was the one thing missing.
- No consent banner, and no third-party request on a page view. The click-to-load
  placeholder costs nothing until it is used, so a schedule page does not mount
  four players.
- `frame-ancestors 'none'` is untouched. Nothing about this lets anyone frame us.

**Bad, or at least a cost**

- Two third-party hosts are now in the CSP. They are exact and they are players,
  but the surface is larger than it was.
- A Twitch embed needs `NEXT_PUBLIC_APP_URL` to be right in every environment.
  Where it is not, `embedParent` returns null and the reader gets the link they
  had before — a degradation, not a break, and the reason `embedUrl` returns
  null rather than a best guess.
- The `sandbox` on the iframe is deliberately narrow. If a platform later needs
  a permission it does not have, the player will fail quietly and the attribute
  is the first place to look.
- This ADR reverses a line in `ESPORTS_PLAN.md` §5. That line has been rewritten
  rather than left to contradict this.
