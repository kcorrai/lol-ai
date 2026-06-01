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
