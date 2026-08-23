# Claude Design brief — LaneIQ landing page redesign

Design a single, full-length landing page artboard (desktop, 1440px wide) for
**LaneIQ / LoL AI Coach**. This is a redesign of a page that already ships, so it
is a _recomposition_, not a blank page: the visual system is fixed, the content
inventory is fixed, the arrangement and the impact are yours.

---

## 1. The product

A League of Legends coaching site. A player pastes their Riot ID; we parse their
last 20 ranked games with full timelines and hand back **one habit to fix**, not a
stat dump. Around that sits a set of free, no-login tools (counter picker, tier
list, draft analyzer, builds, ARAM tier list, patch meta report) that run on live
ranked data, plus a daily quiz.

Audience: ranked players, Iron to Diamond, who already use op.gg and u.gg and find
them cluttered and non-prescriptive. They are 16–30, game-literate, and allergic to
marketing language. The tone is a **field instrument**, not a SaaS brochure: blunt,
numeric, confident. Copy is short and declarative — "Paste your Riot ID. We read
your last 20 games and name the one to fix."

The single competitive claim: **everyone else shows you numbers; we tell you what
to do next.**

---

## 2. The visual system — LOCKED (do not invent a new one)

This system is product-wide, not marketing-only. A player crossing from this page
into the app must not experience a brand change. Use these exact values.

### Palette — dark only, no light mode

```
Ink (grounds, darkest to lightest)
  ink-1000  #050706    ink-900  #080B0A   <- page background
  ink-800   #0C1110    <- surface         ink-700  #111817
  ink-600   #17201F    <- raised surface  ink-500  #1E2A28    ink-400  #283634

Lines / borders
  line-1  #20302D      line-2  #2E4340    line-3  #456460

Foreground
  fg-1  #E9F5EE  headings      fg-2  #A7BCB5  body
  fg-3  #6C817B  muted         fg-4  #485954  faint

Accent — acid lime, ONE accent, rationed
  acid-500  #C6FF3D  <- the accent     acid-400  #D4FF6A     acid-600  #A9E01B

Data semantics only — never a second brand colour
  danger #FF5A5A     warning #FFC24B     info #3FE0C8     blue #4C8FFF
```

**The rationing rule is the most important rule in this system.** Acid lime marks
_the one thing that matters on a given screen_ — a single accent word in a
headline, the primary CTA, the one plan being recommended, a delta that moved. If
two things on a screen are lime, the screen is wrong. Everything else lives on the
ink ground and the fg ramp. No lime gradients, no lime washes, no lime headlines.

### Shape: chamfers, not radius

Border-radius is effectively zero everywhere (4px maximum; fully round survives
only for avatars and meter bars). Shape comes from a notch — corners cut at 45° on
the top-left and bottom-right of a panel (14px standard, 8px small, 22px large).
Tags and buttons use a smaller angled cut. This chamfer is the brand's silhouette:
use it deliberately on the panels that matter, not on every box.

### Typography

- Display / headings: **Orbitron**, black or extra-bold, UPPERCASE, tight tracking
- Body / UI: **Chakra Petch**
- Every numeral, stat and micro-label: **JetBrains Mono**. This is a data product
  and its columns must line up.
- Micro-labels ("hud labels") are mono, uppercase, 11px, 0.16em letter-spacing,
  in fg-3.

### Texture

The ground is layered, never flat: a faint grid, a 1px-on-3px scanline overlay, and
a soft accent glow (`0 0 24px rgba(198,255,61,.18)`) on the one raised element that
earns it. Tactical HUD and broadcast overlay — not neon cyberpunk.

### Imagery

Riot champion splash art (1215×717) is the only photography this brand has. Use it
full-bleed and heavily darkened, with an ink-wash gradient over it. Never inside a
rounded card, and never behind a translucent capsule sitting under headline text —
text sits directly on the wash.

### Motion

Reveal on scroll is a 6px rise plus fade, easing `cubic-bezier(.16,.84,.44,1)`.
Nothing bounces except deliberate scoreboard events. Restrained.

### Where you have free rein

**The hero is yours.** Everything below the hero stays inside the system above, but
for the hero and the strip immediately beneath it you may be radical: a different
compositional idea, 3D, layered depth, motion, an unexpected crop or scale
relationship, type used as image. It must still be built from the locked palette,
the locked typefaces and the chamfer language — but its _composition_ need not
resemble what ships today (splash washed from the left, headline bottom-left, form
under it), which is a competent default and reads as one. Push it. The job is to
make the first screen unforgettable while still looking like the same product two
scrolls down.

---

## 3. Content inventory — every one of these must appear

This is a redesign of a live page. **Do not drop a section because the composition
would be tidier without it.** You may merge, reorder, resize or re-rank them, but
every piece of content below has to survive somewhere on the page. If you merge
two, annotate it.

1. **Hero.** Champion splash, full-bleed. Headline carrying exactly one accent
   word. Subhead: "Paste your Riot ID. We read your last 20 games and name the one
   to fix." Primary action: a Riot ID input (`Name#TAG`) plus a region select plus
   an "Analyze" button. This form is the page's entire conversion — it must be the
   loudest thing on the screen.

2. **Live data strip.** Four figures proving the site is current: `Patch 26.16`,
   `Ranked games parsed 1,284,003` (counts up on load), `Last update 12m ago`, and
   `Movers` — three champion portraits with signed win-rate deltas (`+3.1` in lime,
   `−2.4` in red).

3. **Sample report** — the product's payload, shown rather than described:
   - three severity-graded insight cards: `CRITICAL / No vision before the river /
62% of crossings unwarded · 11 deaths`; `HIGH / Objectives start without prio
/ 7 of 12 drake attempts, 0 lanes pushed`; `MEDIUM / Tilt queue / Requeue
under 120s · 27% win rate`
   - four labelled meters: Clear speed 78, Gank conversion 71, Objective setup 41,
     Vision before fights 23 — the low one is the whole point, make it read as a
     wound
   - three numbered actions with LP deltas: `01 Path to the objective you can
contest, not enemy blue. +9 LP`; `02 Ward the pit 45s before spawn, not at
spawn. +6 LP`; `03 No requeue inside 5 minutes of a loss. +3 LP`

4. **Champion pool audit.** Heading "CHAMPION POOL AUDIT" with the right-aligned
   mono note "Keep three. Bench the rest." A ranked list of the player's champions
   with games played, win rate, and a keep/bench verdict.

5. **Free tools grid — "FREE TOOLS · NO LOGIN"** (with an "All tools →" link). Six
   tiles, each a champion splash crop, a name and a one-line stat: Counter picker /
   Every lane matchup · Tier list / All roles, all tiers · Draft analyzer / Both
   sides graded · Champion builds / Runes, items, skills · ARAM tier list / Howling
   Abyss only · Patch meta report / Data Dragon 15.x. These are the SEO front door
   and a large share of traffic — do not shrink them into an afterthought row.

6. **LaneIQ Daily** — "LANEIQ DAILY · NEW EVERY DAY". A playable one-question quiz
   teaser: a matchup or build question, four answers, a streak counter.

7. **Tier list preview** — "TIER LIST · PATCH 26.16". A compact S/A/B tier table
   with champion portraits and win rate, pick rate and delta columns. Mono
   numerals, aligned columns.

8. **How it works.** Three steps reading as one divided instrument panel:
   `01 Paste your Riot ID / Read-only. No password.` ·
   `02 20 games parsed / Full timelines. ~90 seconds.` ·
   `03 Fix one habit / Tracked over your next three games.`

9. **Product demo** — "From Riot ID to a climb plan" / "Watch how one session turns
   into specific, personal coaching." A stepped walkthrough of the flow.

10. **Features** — "Your coach never sleeps": AI coach chat, tilt detection, climb
    roadmap, matchup prep.

11. **Team plan** — a B2B block for teams and academies.

12. **Testimonials** — social proof from ranked players, each with a rank badge.

13. **Pricing.** Three columns:
    - Free · $0 · All six tools, 2 reports per week, Last 20 games
    - **Pro · $9.99/mo** · Unlimited reports, Climb roadmap, Coach chat, Tilt
      detection — the single accented element in this section: lime border, soft
      glow, and nothing else on the page competing with it
    - Team · custom pricing

14. **Closing splash.** Champion splash again, headline "STOP GUESSING WHAT TO
    FIX", and the Riot ID form repeated. It submits and renders its result in
    place, so design it as a real terminal moment rather than a link back to the
    top.

Also part of the design: a marketing header (wordmark; nav to Tools, Academy,
Coaches, Pricing; sign-in; a lime "Start free" CTA) and a footer.

---

## 4. What to avoid

- Generic SaaS: purple-to-blue gradients, glassmorphism, floating 3D blobs,
  `rounded-2xl` cards, soft drop shadows, a centred hero with a browser mockup
  beneath it.
- Lime used as decoration. If you are tinting a background lime, stop.
- Champion splash art inside a rounded card, or a translucent capsule behind
  headline text.
- Proportional numerals anywhere.
- Filler copy. Every string on the artboard should be one a real player would read;
  reuse the copy above verbatim where it is given.
- Uniform density. The page should breathe: dense instrument panels (data strip,
  tier list, sample report) set against wide, quiet, image-led moments (hero,
  closing).

---

## 5. Deliverable

One artboard, 1440px wide, the full page top to bottom, at final fidelity — real
champion art, real numbers, real copy, correct type sizes. Annotate anywhere you
merged, reordered or re-ranked sections relative to the inventory above, and
anywhere you spent the lime, so the rationing is auditable at a glance.
