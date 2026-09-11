# ADR-052: The account band previews a screen on hover

## Status: Accepted

## Context

`AccountBand` names ten screens an account opens — heat map, match search, career timeline,
season recap, milestone, rank roadmap, improvement, OTP assistant, leaderboard, badges — and
until now showed none of them. It was the only section of the landing page that was pure text,
and its own file comment explained why: "ten drawings would be a contact sheet, and nobody
reads a contact sheet."

That reasoning is sound for ten drawings shown at once. It says nothing about ten drawings
shown one at a time, which is a different object: the section still reads as a list of ten
names, and a reader who wants to know what one of them looks like can find out without
leaving the page.

Two components — `AccountBand.tsx` and `FreeToolsGrid.tsx` — carried comments asserting that
"ADR-015 forbids growth on hover". Neither ADR-015 nor `docs/LANDING_REDESIGN_BRIEF.md` says
that. What the brief locks (§Motion) is:

> Reveal on scroll is a 6px rise plus fade, easing `cubic-bezier(.16,.84,.44,1)`.
> Nothing bounces except deliberate scoreboard events. Restrained.

So the rule being invoked was an interpretation that had hardened into a citation. Rather than
quietly ignore it or keep the section mute, this records what the rule actually is.

## Decision

A cell may open a panel on hover to reveal something it could not otherwise carry. The panel
is bound by all of the following.

**It does not move the page.** The panel is absolutely positioned and centred on its cell, so
it opens _over_ its neighbours. A cell that expanded in flow would shove every row beneath it
down the page each time the pointer crossed a border; a section that jumps under the cursor is
worse than one that stays quiet.

**It is not a target.** `pointer-events-none`, so the link underneath stays the only hit area
in the cell and the cursor can never land on the overlay.

**It is not in the accessibility tree.** `aria-hidden`. The link already announces the screen's
name and what it does; the drawing illustrates that and would otherwise read the same cell
twice. It opens on keyboard focus as well as on hover, so a reader tabbing the section is shown
the same thing — they are simply not read it.

**It does not exist without a hovering pointer.** Gated on the `pointerenter` event's
`pointerType`, not only on a media query: a stylus reports `hover: hover` on tablets where a
finger on the same screen does not. Wiring this to tap would spend a touch reader's first tap
on a preview instead of on the link they meant to follow.

**It does not bounce.** `opacity 0→1`, `y 6→0`, `scale .985→1`, 200ms in and 140ms out, on the
brief's own `cubic-bezier(.16,.84,.44,1)`. No spring, no overshoot. Under
`prefers-reduced-motion` the panel appears and disappears with no transform and no fade.

`FreeToolsGrid`'s tiles still do not grow, and its comment stays true. What changes is that the
rule it cites is now written down and has a stated boundary.

## Consequences

**Gained.** Ten shipped screens a visitor previously had to sign up to see are now visible from
the landing page, without adding ten bands or turning the section into a contact sheet. The
drawings reuse the vocabulary `screens/` already has and the real Riot art the page already
loads — champion portraits, rank crests, and the Summoner's Rift minimap the heat map itself
draws.

**Paid.** Ten more drawings that do not update themselves when the screens they illustrate
change — the trade ADR-050 already accepted, and the reason every mark cites the file it was
read off. `AccountBand`'s cells are now a client component where they were server-rendered;
the cost is one small hook and the marks themselves stay server-rendered until a panel opens.

**Rejected.** Expanding the cell in flow, because of the reflow described above. A rail-plus-
stage layout like `ArsenalTabs`, because it would replace a scannable list of ten names with a
chooser, and the list is what tells a visitor how much is behind the account.

**Not settled here.** Whether any other section may use this. The constraints above are what
make it acceptable in a grid of equal cells with no other interaction; a section with its own
controls would need its own argument.
