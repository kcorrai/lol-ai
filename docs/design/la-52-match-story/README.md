# LA-52 — Match Story timeline player

The screen for `GET /api/match/[matchId]/story` (LA-51), which reads the timeline LA-45 captures.
Open `index.html` to scrub through it. The viewer bar switches desktop/phone and the three states;
`data.js` is a fixed-seed fake payload shaped exactly like the real one, `script.js` is a
disposable plain-JS interaction layer — neither is meant to be reused in the build.

This file is the handover: what the brief asked, what the design answers, and which of those
answers you are allowed to move.

---

## Answers to the brief

**Where does this surface live?** A section inside `/match/[matchId]`, between `MatchScoreboard`
and `BuildExplanationPanel` — not a separate tab. Everything above it is an end-of-game total; a
total can say a lane was lost but never _when_. This is the first thing on the page that answers
when, so it belongs directly under the numbers it explains, while the reader still has them in
their head. A tab would hide it behind a click nobody has a reason to make.

**What does a minute look like?** The team gold difference curve is the spine of time, not the
map. Gold difference is the one series that exists for every minute of every match, reads as a
single shape (who was ahead, when it turned), and needs no legend. The map cannot be the spine:
frames carry no position, only events do, so a map alone has nothing to draw between beats. It
sits beside the curve as a second reading of the same instant.

The area is split at zero — blue above, red below — because League fixes team 100 to blue and 200
to red in every match, so the sign is stable and can be coloured without first working out which
side the viewer was on. The curve itself stays `--fg-1` so it reads against both fills.

**Events: pins, ticks, or a list?** All three, each doing what it is good at, driven by one
playhead:

- **Ticks** above the curve — _when_, at a glance, across the whole match.
- **Pins** on the Rift — _where_, for what has happened up to the playhead.
- **Feed** below — _what_, in words, because a shape cannot say "Aatrox — 3-kill".

**Crowding** is solved three ways, in this order: ticks **cluster per minute** and show `×N`
rather than stacking (a 40-minute game with 300 events becomes at most 40 marks); pins **decay**
over the ~6 minutes after their event and vanish; and the seven **filter chips** let a reader turn
off the kinds they are not reading for — wards alone can be half the events in a match.

**The scrubber: drag, play, or both?** Both, plus event stepping. Dragging is for hunting, play is
for watching it unfold, and ⏮/⏭ jump to the previous/next minute that actually has an event —
which is what someone reviewing a game reaches for, since most minutes hold nothing. Playback runs
one minute per second at 1×, with 2× and 4×.

**A match with no timeline?** Its own state, not an error. Every game synced before LA-45 lands
here and that is normal, so it gets the panel's header with `NO RECORD`, the accent hero-fade
wash, and one sentence that says what it is and that new games carry one. No error colour, no
retry button, nothing to fix.

---

## Load-bearing

Move these and the design stops working.

1. **Gold difference is the spine of time.** Every other surface is hung off the playhead, and the
   playhead is a minute on this curve. A map-first or feed-first layout is a different design.
2. **Colour is never the only carrier.** Each of the seven kinds has its own **shape** — filled
   circle, ringed circle, diamond, filled square, hollow square, filled triangle, hollow triangle
   — and the same glyph is used in the ticks, the pins, the feed rows and the chip swatches. The
   pairs that share a hue (structure/plate, ward placed/cleared) are exactly the pairs
   distinguished by filled vs hollow. Three of the seven are red/amber/acid against a dark ground,
   which is the range red-green colour blindness collapses; without the shapes this screen is
   unreadable for those readers.
3. **The split at zero, coloured by side.** Blue up / red down, from the fixed team-100/200
   convention. Do not recolour it "you vs them" — the viewer's own side is already marked in the
   feed, and a per-viewer flip makes two people looking at the same match see opposite pictures.
4. **No player paths on the map.** Frames have no position. Anything that looks like movement
   between pins would be invented. The map hint says this out loud on purpose.
5. **Future events are absent from the feed, not dimmed** (`.feed-row.is-future { display: none }`).
   The feed is the story so far. A greyed-out list of what is about to happen spoils the scrub and
   makes the current row impossible to find.
6. **The empty state is a state, not a failure.** It predates the feature; it is not broken.
7. **Keyboard reach.** The scrubber is a real `<input type="range">` so arrows and Home/End come
   free — do not rebuild it out of divs. Space toggles play from the controls. Ticks and feed rows
   are seek shortcuts, not the only way to reach a minute.

## Taste — move freely

- The 300px map pane width, the 260px feed height, and the 200px chart height.
- Playback speeds (1/2/4×) and the 1-minute-per-second base rate.
- The ~6-minute pin decay and the pulse on the newest pin.
- Which glyph belongs to which kind, as long as all seven stay visually distinct and the
  filled/hollow pairing survives.
- Chip wording (`Kill`, `Objective`, `Plate`…) and the feed's phrasing.
- Whether the chips sit above the chart or fold into a menu on phone.
- The `×N` badge position, and the `BLUE AHEAD` / `RED AHEAD` axis labels.
- The header subtitle (`34m · Victory`).

---

## Open questions for the build

1. **The chart is too small on phone.** The mockup keeps one 900×220 viewBox at every width, so at
   390px the minute labels land near 3px. Fix it in the build — either scale the type with the
   viewBox, drop to a label every 10 minutes under `sm`, or give phone its own shorter viewBox.
   This is the one thing in the mockup that is not ready to copy.
2. **Duration.** The payload has no duration field; the mockup fakes one via `data.meta`. Derive
   it from the last frame minute and the latest event minute, whichever is greater — events can
   outlive the last full frame.
3. **Number formatting.** `toLocaleString()` in the mockup renders `12.860` under a Turkish
   locale. Format the gold readout explicitly rather than by locale.
4. **`selfPuuid`** is a mockup-only field on `data.meta`. The real page already knows the viewer's
   puuid from `MatchDetail.userPuuid` — pass it in as a prop.
5. **Reduced motion.** Not drawn. At minimum, `prefers-reduced-motion` should stop the pin pulse
   and the skeleton shimmer; autoplay is user-initiated so it can stay.
6. **Screen readers.** The curve and the map are decoration over the feed — the feed is the
   content. Give the feed the live-region treatment during playback, or leave it static and let
   the scrubber's `aria-label` carry the minute. Decide in the build; the mockup does not.
