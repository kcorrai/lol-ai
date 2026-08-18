# Features — LoL AI Coach

**Version:** 1.0

---

## Feature Notation

Each feature includes:
- **User Benefit:** What value does this deliver to the player?
- **Difficulty:** Low / Medium / High / Very High
- **Dependencies:** What must exist before this can be built?

---

## MVP Features

These must ship together to deliver the core value proposition.

---

### F-001 — Riot Account Connection

Connect a Riot account via Riot ID (GameName#TAG).

**User Benefit:** Unlocks all data-driven features. Without this, the product is nothing.  
**Difficulty:** Low  
**Dependencies:** None

---

### F-002 — Match History View

Display the player's last 20 ranked games with key stats: champion, KDA, CS/min, vision score, result, LP change.

**User Benefit:** Replaces needing to open the client. Clean, at-a-glance performance view.  
**Difficulty:** Low  
**Dependencies:** F-001, Riot API integration

---

### F-003 — Match Detail View

Full stat breakdown for a single match: items, runes, per-stat breakdown, team comparison.

**User Benefit:** Understand what happened in a specific game without watching the replay.  
**Difficulty:** Low  
**Dependencies:** F-002

---

### F-004 — Champion Performance Stats

Per-champion aggregated stats: win rate, avg KDA, avg CS/min, games played, grade. Ranked by games played.

**User Benefit:** "Which champion should I play today?" answered instantly with data.  
**Difficulty:** Low  
**Dependencies:** F-001, F-002

---

### F-005 — Ranked History & LP Tracker

LP timeline chart showing progression over days/weeks. Rank tier + division displayed with change indicators.

**User Benefit:** Visual proof of improvement (or plateau). Motivating or diagnostic.  
**Difficulty:** Low–Medium  
**Dependencies:** F-001

---

### F-006 — AI Session Review Report

AI-generated coaching analysis of the last 5 games. Includes strengths, weaknesses, and 3 prioritized action items. Written in coaching voice.

**User Benefit:** The core product. Answers "what am I doing wrong?" with specificity.  
**Difficulty:** High  
**Dependencies:** F-002, F-004, AI pipeline

---

### F-007 — User Authentication & Profiles

Email/password registration, OAuth (Google/Discord), persistent session, user profile with preferences.

**User Benefit:** Persistent experience across sessions.  
**Difficulty:** Low  
**Dependencies:** None

---

### F-008 — Freemium Subscription Gating

Free vs. Pro tier enforcement: report limits, history depth, account limits. Stripe Checkout for upgrade.

**User Benefit:** Sustainable revenue model.  
**Difficulty:** Medium  
**Dependencies:** F-007

---

## V2 Features

These extend the core product with depth and personalization.

---

### F-009 — Champion Pool Health Analysis

Analyze the player's champion pool for: role coverage, meta alignment, weakness patterns, pool depth. AI-generated recommendations for what champions to add.

**User Benefit:** Strategic guidance beyond individual game performance.  
**Difficulty:** Medium  
**Dependencies:** F-004, AI pipeline

---

### F-010 — Tilt Detection & Alerts

Monitor recent game patterns for tilt indicators: increasing deaths, decreasing CS, declining win rate over last 5 games. Send in-app alert: "Looks like you might be on tilt. Consider taking a break."

**User Benefit:** Mental health / performance intervention. Unique feature with viral potential.  
**Difficulty:** Medium  
**Dependencies:** F-002, F-005

---

### F-011 — Climb Roadmap

AI-generated personalized rank-climbing plan: target rank, recommended champion to focus, habit goals, timeline estimate based on historical improvement rate.

**User Benefit:** Transforms "hardstuck" despair into structured plan. High emotional impact.  
**Difficulty:** High  
**Dependencies:** F-004, F-005, F-006

---

### F-012 — Session Review (Per-Session Coaching)

Automatic coaching report generated at end of each play session (detected by time gap between games). No manual trigger needed.

**User Benefit:** Seamless, automatic coaching without user effort.  
**Difficulty:** Medium  
**Dependencies:** F-006, match sync system

---

### F-013 — Champion Focus Report

Deep-dive AI report on a single champion: mechanics issues, build path analysis, matchup patterns, specific advice.

**User Benefit:** "I want to master Ahri" → deep, champion-specific coaching.  
**Difficulty:** High  
**Dependencies:** F-004, F-006

---

### F-014 — Counter Pick Database

Per-champion counter recommendations with win rate data and AI explanation of why/how to execute the counter.

**User Benefit:** Draft-time utility. "What do I ban/pick into this composition?"  
**Difficulty:** Medium  
**Dependencies:** F-004, champion data pipeline

---

### F-015 — Personalized Training Plan

AI-generated 4-week training plan with specific daily tasks: game goals, video review tasks, practice tool exercises.

**User Benefit:** Structured improvement path, not just diagnosis. Creates daily engagement.  
**Difficulty:** High  
**Dependencies:** F-006, F-011

---

### F-016 — Report PDF Export

Export any coaching report to a styled PDF.

**User Benefit:** Share with a human coach. Keep offline. Satisfying artifact.  
**Difficulty:** Low  
**Dependencies:** F-006

---

## V3 Features

Advanced capabilities for competitive and highly-engaged users.

---

### F-017 — Pro Player Comparison

Compare a player's stats on a champion to available high-elo data. "Your Ahri CS/min is 5.8. Top Ahri players average 7.2. Here's how they do it."

**User Benefit:** Concrete benchmark beyond rank average.  
**Difficulty:** High  
**Dependencies:** F-004, pro player data pipeline, AI pipeline

---

### F-018 — Draft Coach

During champion select: input allied and enemy picks, receive AI-recommended champion with rationale, win conditions, and build path.

**User Benefit:** In-context decision support during draft.  
**Difficulty:** Very High  
**Dependencies:** F-014, low-latency AI pipeline

---

### F-019 — Performance Prediction

Machine learning model predicting expected win rate improvement from specific changes. "If you increase your vision score by 5, our model estimates +3% win rate."

**User Benefit:** Quantified motivation for specific improvements.  
**Difficulty:** Very High  
**Dependencies:** Large match dataset, ML pipeline

---

### F-020 — Teamfight Analysis

Timeline breakdown of teamfight performance: participation rate, damage contribution, positioning assessment from event data.

**User Benefit:** "I always die in teamfights" → specific diagnosis.  
**Difficulty:** Very High  
**Dependencies:** Advanced match timeline parsing

---

### F-021 — Oturum Özeti (Milestone Reporting)

Monthly performance review: rank change, improvement in tracked metrics, coaching plan progress, next month targets.

**User Benefit:** Long-term progress visibility. Retention driver.  
**Difficulty:** Medium  
**Dependencies:** F-006, F-015, time-series data pipeline

---

### F-022 — Warm-Up Tracker

Pre-session warm-up routine tracking. Player logs warm-up games, system analyzes performance difference in warmed-up vs. cold sessions.

**User Benefit:** Data-backed validation of warm-up habits.  
**Difficulty:** Medium  
**Dependencies:** F-002, session detection

---

## Experimental Features

High-uncertainty features. Architecture must support but not require these.

---

### F-023 — Voice Coaching Mode

Text-to-speech playback of coaching reports. "Press play and hear your coach."

**User Benefit:** Accessibility. Listen while driving or doing other things.  
**Difficulty:** Low (with TTS API)  
**Dependencies:** F-006, TTS integration (ElevenLabs or similar)

---

### F-024 — Replay Upload Analysis

Upload replay file (`.rofl`) and receive AI analysis of specific in-game events: death analysis, fight decisions, positioning.

**User Benefit:** Game-level precision coaching. "At 23:12 you should have backed instead of fighting."  
**Difficulty:** Very High  
**Dependencies:** Replay parsing library, computer vision pipeline

---

### F-025 — Social Leaderboard

Leaderboard of players using the platform ranked by improvement rate (not rank), coaching plan adherence, or total LP gained.

**User Benefit:** Community, motivation, proof that the platform works.  
**Difficulty:** Medium  
**Dependencies:** Performance tracking data

---

### F-026 — AI Coaching Chat

Conversational interface where players can ask follow-up questions about their report. "Why did you say my vision is bad? What specifically should I do?"

**User Benefit:** Interactive depth. Addresses "but what about X?" reactions.  
**Difficulty:** High  
**Dependencies:** F-006, conversational AI with report context

---

## Moonshot Features

Long-horizon, product-defining bets.

---

### F-027 — Live In-Game Coaching Overlay

Browser extension or companion app that provides real-time suggestions during the game. "Take Dragon at 5 mins," "Gank mid now — enemy jungler bottom."

**User Benefit:** Real-time coaching, not just post-game analysis.  
**Difficulty:** Extremely High  
**Dependencies:** Live client API, low-latency AI inference, compliance review

---

### F-028 — Esports Analyst Platform

B2B offering for amateur esports teams: roster analysis, scrim performance tracking, VOD review tools with AI annotations.

**User Benefit:** Professional tools accessible to amateur teams.  
**Difficulty:** Very High  
**Dependencies:** Team accounts, multi-user data, esports data partnerships

---

### F-029 — Multi-Game Expansion

Extend the platform to VALORANT, TFT, or other titles with dedicated coaching pipelines.

**User Benefit:** Serve the broader competitive gaming audience.  
**Difficulty:** Very High  
**Dependencies:** Title-specific data pipelines, champion/agent databases, position-agnostic AI prompts

---

## Esports Features

A public, free, crawlable esports section. Acquisition-first: esports intent is a
large recurring demand pool the coaching product does not otherwise reach, and the
pro-play pages hand that audience directly to the champion and build pages.

Plan: [ESPORTS_PLAN.md](./ESPORTS_PLAN.md). Decisions:
[ADR-016](./adr/ADR-016-esports-data-source.md) (data source),
[ADR-017](./adr/ADR-017-esports-url-structure.md) (URLs and indexation).
Tasks: TASK-297 → TASK-314.

---

### F-030 — Esports Schedule & Live Scores

Hub, full calendar and a live scoreboard for every league Riot publishes. Server-cached, with one polled endpoint for live state.

**User Benefit:** Know what is on, right now, without leaving the site.  
**Difficulty:** Medium  
**Dependencies:** LoL Esports feed (ADR-016)

---

### F-031 — Leagues, Standings & Brackets

League hubs and tournament pages with normalised standings tables and elimination brackets across formats.

**User Benefit:** The season's state at a glance, per region.  
**Difficulty:** Medium  
**Dependencies:** F-030, standings normalisation across formats

---

### F-032 — Teams & Player Profiles

A page per pro team (roster, form, next match, results) and per player (role, team, champion pool, recent games).

**User Benefit:** Answers the most-searched esports entities directly.  
**Difficulty:** Medium  
**Dependencies:** F-030

---

### F-033 — Match Pages with Drafts & Scoreboards

Per-series pages with per-game drafts, full scoreboards, item and rune builds, gold curves and objectives, from the livestats feed.

**User Benefit:** Post-match detail that schedule aggregators do not carry.  
**Difficulty:** High  
**Dependencies:** F-030, livestats feed coverage

---

### F-034 — Pro Meta & Pro Builds

Pick/ban/presence/win-rate tables per tournament, and a champion-in-pro-play page with the builds and runes pros actually finish with.

**User Benefit:** "What are the pros playing, and how do they build it."  
**Difficulty:** High  
**Dependencies:** F-033, aggregation over completed games

---

### F-035 — You vs the Pros

Compare a player's own stats on a champion against the pro aggregate, from the pro-play page. The section's conversion step.

**User Benefit:** Turns esports curiosity into a read on your own play.  
**Difficulty:** Medium  
**Dependencies:** F-034, existing pro comparison service (F-017)

---

### F-036 — AI Match Previews & Recaps

Generated-once, permanently cached written previews and recaps on tier-1 matches, grounded strictly in data we hold.

**User Benefit:** Original written analysis on pages that would otherwise be tables.  
**Difficulty:** Medium  
**Dependencies:** F-033, AI pipeline, hard cost gate

---

### F-037 — Follow Teams & Match Reminders

Follow pro teams and get notified before they play, through the existing push, Discord and email channels.

**User Benefit:** A reason to hold an account between coaching sessions.  
**Difficulty:** Medium  
**Dependencies:** Schema approval (TASK-313), notification preferences

---

### F-038 — Live Draft Room (shipped: TASK-297 … TASK-306)

A public, login-free tournament pick/ban room. One link runs a whole best-of-five:
the standard 20-step sequence, per-turn timers, drafter and spectator seats, and
fearless lockouts carried across every game of the series.

**What it does that the reference tool (drafter.lol) does not:**

- **Live draft intelligence.** While it is your turn, your side sees the
  champions worth taking ranked from this patch's own win rates and matchup data,
  each with its reasons — "52.1% Top · +2.4 into their picks · adds the frontline
  you are missing". Bans are ranked the same way, against what the enemy needs.
- **A comp readout that updates as you draft** — damage split, frontline, engage
  — using the same arithmetic as the post-draft evaluation, so the live view and
  the verdict cannot disagree.
- **Lane edges as matchups form**, from real head-to-head win rates.
- **A real verdict at the end**, not a screenshot: the finished comps flow into
  the existing `evaluateDraft` and out to `/tools/draft-analyzer`.
- **Unavailable champions stay visible with a reason** — "taken this game" reads
  differently from "used earlier in the series", and in a fearless Bo5 that
  difference is the strategy.
- **Three labelled share links** rather than one, so nobody joins the wrong side.

**User Benefit:** The tool a scrim already needs, with the data the team would
otherwise have open in three other tabs.
**Difficulty:** Large
**Dependencies:** Meta snapshot (F-008), counter data, Upstash Redis

---

### F-039 — Player Search (shipped: TASK-308 … TASK-311)

Type part of a Riot ID anywhere on the site, get real accounts back while typing,
click one, land on a full profile. No login, no account linking, no waiting.

**Why it needed building at all:** Riot exposes no name-search endpoint —
`account-v1` resolves only a complete, exactly-spelled `gameName` **and**
`tagLine`. Autocomplete is therefore impossible against Riot for anyone. What
made it possible for us is that every synced match already stores all ten
participants, nine of whom are nobody's connected account: the index is a
by-product of syncs we already run, and it grows every time anyone uses the
product. See [ADR-017](./adr/ADR-017-player-search-index.md).

**What it does:**

- **Suggests as you type**, with the section layout players already know —
  players, recent, favourites — and full keyboard control.
- **Never dead-ends.** A complete `Name#TAG` the index has never seen still gets
  a row, and the profile page resolves it against Riot itself.
- **Remembers without an account.** Recent and favourite players live in the
  browser, so a signed-out visitor keeps their shortcuts.
- **Ends in a profile worth reading** — rank, ten matches, champion pool, role
  split, and a rule-based read, all with no login.
- **Turns a reader into a user in one click.** "This is me" connects the account
  straight from the profile, carrying the Riot ID through sign-up when signed
  out, so `/settings/accounts` is out of the path entirely.

**User Benefit:** The thing that made the friction real — needing to know your
exact Riot ID and region before the product would show you anything — is gone.
**Difficulty:** Medium
**Dependencies:** Match sync (F-002), public preview (F-008)

---

### F-040 — Duo Panel (shipped: TASK-312 … TASK-314)

A column of the dashboard about the person you queue with, rather than about you.

**What it does:**

- **Answers the only question that matters about a duo:** your win rate together
  against your win rate in the same window without them, as one signed number.
- **Explains the number.** How your own KDA, deaths, vision and CS/min change
  with them in the game — a partner who halves your CS is a different problem
  from one who gets you killed.
- **Names the combinations that work** — champion pairings by win rate, and the
  role pairings you actually queue.
- **Sets three goals a week for the pair**, from a fixed catalogue that rotates
  by week number, with XP on completion. No AI call: duo quests are per pair, so
  generating them would scale spend with pairs rather than players.
- **Refuses to invent a verdict.** Below five shared games it says why instead of
  printing a number, and the supporting sections hide with it.

**User Benefit:** Most ranked players climb with someone. Nothing else in the
product had an opinion about that person.
**Difficulty:** Medium
**Dependencies:** Duo detection (TASK-244), match participants for all ten players

### F-041 — Personal Daily Quest (shipped: LA-35)

TODAY'S QUEST: one small personal objective, at the top of the dashboard, every day.

**What it does:**

- **Gives the day a shape.** A strip above the readiness verdict with what to do
  today, how far in the player is, and what it is worth — rather than a challenge
  card buried under the match log where nobody scrolls.
- **Asks for two things, one of them off the rift.** The in-game leg is the
  existing daily challenge, generated off the player's own weakest stat. The
  on-site leg rotates through solving the daily puzzle, finishing an Academy
  lesson, pulling a coaching report and building a share card — so a day with no
  time to queue is still a day the quest can be finished.
- **Runs a streak that means something.** A day counts when everything issued
  that day is done. Today is graded but never breaks the run; yesterday does.
- **Stores nothing** (ADR-029). The task is derived from the player and the date,
  completion is read back out of the tables each action already writes, and the
  streak replays the last 30 days over those signals. No table, no nightly job,
  and every existing player's streak is correct the day it ships.
- **Gets out of the way.** Dismissing it hides it for that day only; tomorrow's
  arrives on its own.

**User Benefit:** A reason to open the site on a day with no games in it — and a
streak that a player who only has fifteen minutes can still keep.
**Difficulty:** Medium
**Dependencies:** Daily challenge generator (challenges), quiz attempts, Academy
progress, coaching reports, shareable cards
