# Product Requirements Document — LoL AI Coach

**Version:** 1.0  
**Status:** Draft  
**Owner:** Product & Engineering

---

## 1. Executive Summary

LoL AI Coach is an AI-powered performance analytics and coaching platform for League of Legends players. The product bridges the gap between raw match data and actionable coaching insights by applying large language models on top of structured Riot API data. The result is a personalized, conversational coaching experience that makes every player feel like they have a high-elo analyst reviewing their games.

---

## 2. Vision

> "Every League of Legends player, at every skill level, deserves access to the kind of feedback that only high-elo coaches currently provide."

The long-term vision is to build the most intelligent, personalized, and trusted coaching platform in competitive gaming — starting with League of Legends and designed to expand across titles.

---

## 3. Problem Definition

### 3.1 The Core Problem

Millions of players are stuck in rank stagnation. They play consistently but do not improve because:

- They lack awareness of their specific mistakes (not generic ones).
- Human coaches are expensive ($50–$200/hour) and inaccessible.
- Existing tools (op.gg, u.gg) show statistics but do not explain what to do differently.
- Watching pro players and streamers provides general knowledge but not personalized feedback.
- Players cannot objectively evaluate their own games (cognitive bias, tilt).

### 3.2 User Pain Points

| Pain Point | Severity | Frequency |
|---|---|---|
| "I don't know why I'm hardstuck" | Critical | Daily |
| "I don't know which champion to main" | High | Weekly |
| "I keep making the same mistakes" | Critical | Daily |
| "I don't know my champion pool weaknesses" | High | Weekly |
| "I can't afford a human coach" | High | Persistent |
| "Stats tools don't tell me HOW to fix things" | High | Daily |

---

## 4. Target User Audience

### 4.1 Primary Segment — The Hardstuck Climber

- **Age:** 16–28
- **Rank:** Silver to Platinum (largest population)
- **Behavior:** Plays 5–15 games per week, actively wants to improve, watches educational content
- **Frustration:** Sees stats but cannot translate them to improvement
- **Willingness to pay:** Medium — $10–$20/month for clear improvement

### 4.2 Secondary Segment — The Competitive Grinder

- **Age:** 18–25
- **Rank:** Gold to Diamond
- **Behavior:** Plays 20+ games/week, reviews VODs, follows pro meta
- **Frustration:** Needs very specific, granular feedback
- **Willingness to pay:** High — $20–$40/month for edge

### 4.3 Tertiary Segment — The Casual Improver

- **Age:** 14–35
- **Rank:** Iron to Bronze, or unranked
- **Behavior:** Plays for fun but would like to understand the game better
- **Frustration:** Overwhelmed by complexity
- **Willingness to pay:** Low — free tier or $5/month

### 4.4 Future Segment — Semi-Pro & Esports Aspirants

- **Age:** 17–22
- **Rank:** Diamond to Challenger
- **Behavior:** Competing in amateur leagues, building portfolio
- **Frustration:** No structured performance tracking
- **Willingness to pay:** High — $50+/month

---

## 5. Market Analysis

### 5.1 Total Addressable Market

- League of Legends has approximately **150 million registered accounts** globally.
- Monthly Active Players: estimated **30–40 million**.
- Of these, approximately **40%** (12–16M) are classified as "improvement-motivated" players.
- The online coaching market for gaming is valued at **~$1.5B** (2024) and growing 20% YoY.
- Direct AI coaching / analytics tools segment: estimated **$150–300M** TAM.

### 5.2 Serviceable Addressable Market

- English-speaking markets (NA, EUW, OCE, LAN): ~8M monthly active improvement-motivated players.
- Of those, estimated **5–10%** would pay for a premium AI coaching tool = **400K–800K** potential subscribers.
- At $15/month average: **$72M–$144M ARR** ceiling in English markets.

### 5.3 Growth Vectors

- Expansion to Korean (KR), Turkish (TR), and Brazilian (BR) servers
- Expansion to other titles: VALORANT, TFT, Teamfight Tactics
- B2B: esports organizations, coaching academies

---

## 6. Competitor Analysis

### 6.1 Direct Competitors

| Product | Strengths | Weaknesses | Pricing |
|---|---|---|---|
| **op.gg** | Brand recognition, large user base, clean UI | Data display only, no actionable coaching, shallow insights | Free (ads) |
| **u.gg** | Tier lists, champion stats, fast | No personalized analysis, no AI, purely informational | Free + $5/mo Pro |
| **Mobalytics** | GPI score, improvement tracking, coach marketplace | AI insights are shallow, coaching marketplace is expensive, not truly personalized | Free + $12.99/mo |
| **Blitz.gg** | In-game overlay, champion suggestions | Overlay focus, limited post-game depth | Free + $9.99/mo |
| **Porofessor** | Live game data, counter pick | No coaching depth, dated design | Free (ads) |

### 6.2 Competitive Positioning

LoL AI Coach differentiates by:

1. **Depth of AI analysis** — not summaries of stats but genuine narrative feedback with specific recommendations
2. **Personalization** — adapts to playstyle, champion pool, and rank progression
3. **Actionable output** — every report ends with a prioritized action list, not just numbers
4. **Coaching voice** — feels like a coach, not a dashboard
5. **Longitudinal tracking** — monitors improvement over time, detects regression and plateau

### 6.3 Moat Strategy

- Proprietary prompt engineering and analysis pipeline
- User performance history and improvement tracking (data flywheel)
- Habit formation through coaching plans (switching cost)
- Community and social proof (leaderboards of coached players)

---

## 7. MVP Scope

### 7.1 MVP Definition

The MVP must deliver a complete "wow moment" for a single user journey: connect Riot account → view match history → receive an AI coaching report on their last 5 games → see a personalized improvement tip.

### 7.2 MVP Features

| Feature | Priority | Rationale |
|---|---|---|
| Riot account connection (OAuth / Riot ID) | P0 | Gateway to all data |
| Match history display (last 20 games) | P0 | Core data surface |
| Champion performance summary | P0 | Most requested by players |
| AI coaching report (per session, last 5 games) | P0 | Core value proposition |
| Ranked history & LP tracking | P1 | Progress visualization |
| Specific mistake detection (death analysis, positioning notes) | P1 | Proof of intelligence |
| Champion pool recommendation | P1 | High perceived value |
| User account & authentication | P0 | Required for persistence |
| Basic subscription / paywall (freemium gating) | P1 | Revenue |

### 7.3 Out of MVP Scope

- Replay analysis
- Live game coaching
- Voice coaching
- Team analysis
- Draft coach
- Pro player comparison
- Mobile app

---

## 8. Success Metrics (KPIs)

### 8.1 Acquisition

| Metric | MVP Target (Month 3) | Year 1 Target |
|---|---|---|
| Registered Users | 5,000 | 50,000 |
| Riot Accounts Connected | 3,500 | 35,000 |
| Monthly Active Users (MAU) | 2,000 | 25,000 |

### 8.2 Engagement

| Metric | Target |
|---|---|
| Session Frequency (per user/week) | ≥ 2 |
| AI Reports Generated per User/Month | ≥ 4 |
| Report Completion Rate (viewed in full) | ≥ 60% |
| 30-Day Retention | ≥ 35% |
| 90-Day Retention | ≥ 20% |

### 8.3 Revenue

| Metric | Target |
|---|---|
| Free → Paid Conversion Rate | ≥ 5% |
| Monthly Paying Users (Month 6) | 500 |
| MRR (Month 6) | $7,500 |
| Churn Rate (Monthly) | ≤ 8% |

### 8.4 Product Quality

| Metric | Target |
|---|---|
| AI Report User Rating (1–5) | ≥ 4.0 |
| "This helped me improve" response rate | ≥ 70% |
| NPS Score | ≥ 40 |

---

## 9. Revenue Model

### 9.1 Freemium Tier (Free)

- 1 Riot account connection
- Match history (last 10 games display)
- Basic champion stats
- 1 AI coaching report per week (limited depth)
- No historical tracking

### 9.2 Pro Tier ($14.99/month or $99/year)

- Unlimited AI coaching reports
- Full match history analysis (last 100 games)
- Champion pool deep analysis
- Session review (per-session coaching)
- Climb roadmap
- Tilt detection alerts
- Priority AI processing
- Export reports to PDF

### 9.3 Elite Tier ($29.99/month or $199/year)

- Everything in Pro
- Pro player comparison analysis
- Counter pick database with personalized recommendations
- Draft coach
- Advanced training plans
- Early access to new features
- Monthly AI "performance review" report

### 9.4 Future Revenue Vectors

- Human coaching marketplace (revenue share)
- Team / organization accounts (B2B)
- API access for third-party tools
- Esports analytics reports (one-time purchase)

---

## 10. Long-Term Product Roadmap (High-Level)

| Phase | Timeline | Theme |
|---|---|---|
| Phase 1 | Months 1–3 | MVP: Core analysis loop |
| Phase 2 | Months 4–6 | AI depth & personalization |
| Phase 3 | Months 7–12 | Advanced features & retention |
| Phase 4 | Year 2 | Scale & expansion |
| Phase 5 | Year 2–3 | AI coaching platform |

See `ROADMAP.md` for detailed phase breakdown.

---

## 11. Feature Prioritization Framework

Priority is assigned using the **RICE score**: Reach × Impact × Confidence / Effort.

| Feature | Reach | Impact | Confidence | Effort | RICE |
|---|---|---|---|---|---|
| AI Coaching Report | 10 | 10 | 9 | 5 | 180 |
| Champion Pool Analysis | 9 | 8 | 9 | 3 | 216 |
| Climb Roadmap | 8 | 9 | 7 | 5 | 100 |
| Tilt Detection | 7 | 8 | 6 | 4 | 84 |
| Draft Coach | 6 | 7 | 7 | 6 | 49 |
| Replay Analysis | 4 | 10 | 5 | 9 | 22 |
| Voice Coaching | 3 | 9 | 4 | 9 | 12 |

---

## 12. Assumptions & Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Riot API rate limiting at scale | Medium | High | Caching layer, request queuing |
| Riot ToS / API policy changes | Low | Critical | Stay compliant, monitor policy |
| AI cost overruns at scale | Medium | High | Caching, tiered analysis depth |
| Low conversion from free to paid | Medium | High | Improve "wow moment" in free tier |
| Competitor copies AI coaching | Medium | Medium | Move fast, build data moat |
| AI hallucination in coaching reports | Medium | High | Structured prompts, validation layer |
