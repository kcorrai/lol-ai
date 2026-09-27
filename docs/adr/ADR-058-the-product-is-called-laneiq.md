# ADR-058: The product is called LaneIQ

## Status: Accepted

## Context

The product had two names. The wordmark, page titles, emails, share cards, the PDF report and
the desktop app said "LoL AI Coach". The visual system (ADR-015), the daily game ("LaneIQ
Daily"), the Academy, the Draft Room titles, the coach rank badge ("Checked by LaneIQ"), the
Discord bot and the quiz share link (laneiq.gg) said "LaneIQ". A first-time visitor could not
tell they were one product.

"LoL AI Coach" also described only one of the six things the product does, and it leaned on
"LoL", which is Riot's mark rather than ours.

## Decision

The product is LaneIQ. Kaan made the call on 2026-09-27.

Every name a person sees now reads LaneIQ: page titles and metadata, the wordmark (set as
Lane/IQ with the accent on IQ), emails, OG and share cards, the PDF report, Discord bot text,
the authenticator label, push notifications, and the desktop app's windows, tray, errors and
shortcut.

These are deliberately unchanged:

- **Domains.** `lolaicoach.gg` is still the site URL, sender address and canonical host in
  about seventy places. Moving to `laneiq.gg` depends on which domain is actually registered
  and verified for mail, and is its own change.
- **Identifiers.** The desktop bundle identifier `gg.lolaicoach.desktop` (changing it orphans
  paired installs and their stored tokens), the `lol-ai-desktop` crate and package names that
  the launcher runs by path, and the `/lolai` Discord command, which users type.
- **History.** ADRs and the retired `docs/tasks/` files keep the name they were written under.

## Consequences

- Authenticator entries added before the rename keep the old label until a player re-enrols.
  The codes still work.
- The Discord command descriptions change only after the commands are re-registered.
- Anyone matching the desktop window by title (see the screenshot scripts) should look for
  "LaneIQ".
