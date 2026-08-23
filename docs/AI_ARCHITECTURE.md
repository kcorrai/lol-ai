# AI Architecture — LoL AI Coach

**Version:** 1.0  
**This is the product's core differentiator. Read every section.**

---

## 1. Philosophy

The AI system is not a chatbot wrapper. It is a structured coaching engine.

Core principles:

1. **Structured input, structured output.** The AI receives clean, contextual data and returns validated JSON, not free-form prose that we then parse.
2. **The AI is the coach, not the data.** All statistical analysis is done by our code. The AI's job is to interpret those statistics with coaching expertise.
3. **Cache aggressively.** AI calls are expensive. Identical or near-identical inputs must hit cache, not the API.
4. **Provider independence.** No OpenAI or Anthropic SDK is imported outside of `src/lib/ai/providers/`. Swap providers without touching business logic.
5. **Hallucination prevention first.** Every prompt is constrained. The AI never makes up data. All factual claims come from structured inputs we provide.

---

## 2. AI Pipeline Overview

```
                      ┌──────────────────────────────┐
                      │      CoachingService          │
                      │  (orchestrator, entry point)  │
                      └───────────────┬───────────────┘
                                      │
                      ┌───────────────▼───────────────┐
                      │      DataPreparator           │
                      │  - Fetch raw match records    │
                      │  - Clean & normalize          │
                      │  - Compute derived metrics    │
                      │  - Add context (rank, history)│
                      └───────────────┬───────────────┘
                                      │
                      ┌───────────────▼───────────────┐
                      │      ContextBuilder           │
                      │  - Player profile             │
                      │  - Historical trends          │
                      │  - Champion proficiency       │
                      │  - Rank context               │
                      └───────────────┬───────────────┘
                                      │
                      ┌───────────────▼───────────────┐
                      │      PromptBuilder            │
                      │  - Select prompt template     │
                      │  - Inject structured data     │
                      │  - Set analysis focus         │
                      │  - Format for provider        │
                      └───────────────┬───────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │     Cache Layer          │
                         │  (Redis, input hash)     │
                         └────────┬──────┬──────────┘
                         MISS     │      │ HIT
                                  │      └──────────────────────┐
                      ┌───────────▼───────────────┐             │
                      │      AIClient              │             │
                      │  (provider-abstracted)     │             │
                      │  - Retry logic             │             │
                      │  - Timeout handling        │             │
                      │  - Cost tracking           │             │
                      └───────────┬───────────────┘             │
                                  │                             │
                      ┌───────────▼───────────────┐             │
                      │      ResponseParser        │◄────────────┘
                      │  - Validate JSON schema    │
                      │  - Sanitize content        │
                      │  - Fallback on malformed   │
                      └───────────┬───────────────┘
                                  │
                      ┌───────────▼───────────────┐
                      │      ReportAssembler       │
                      │  - Merge AI + stats        │
                      │  - Build final report      │
                      │  - Persist to DB           │
                      └───────────────────────────┘
```

---

## 3. Data Preparation

### 3.1 What Goes Into the AI

The AI receives a structured JSON payload, never raw Riot API responses. The `DataPreparator` module is responsible for:

1. **Filtering:** Only include relevant matches (same queue type, last N games)
2. **Normalizing:** Convert all stats to consistent units (cs/min, gold/min, etc.)
3. **Enriching:** Add contextual stats (compared to rank average)
4. **Summarizing:** Pre-aggregate to reduce token count

### 3.2 Input Payload Schema

```typescript
interface CoachingInput {
  player: {
    riotId: string;
    region: string;
    currentRank: { tier: string; rank: string; lp: number };
    roles: string[];
    accountAgeDays: number;
  };
  analysisContext: {
    periodGames: number;
    queueType: string;
    focusArea?: string;
  };
  matches: MatchSummary[];
  aggregateStats: AggregateStats;
  rankBenchmarks: RankBenchmarks;
  championPool: ChampionSummary[];
}

interface MatchSummary {
  matchNumber: number;
  champion: string;
  position: string;
  result: "win" | "loss";
  durationMinutes: number;
  kda: { kills: number; deaths: number; assists: number };
  csPerMinute: number;
  visionScore: number;
  goldPerMinute: number;
  damageShare: number;
  notableEvents: string[];
}

interface AggregateStats {
  winRate: number;
  avgKDA: number;
  avgCSPerMinute: number;
  avgVisionScore: number;
  avgDeathsPerGame: number;
  deathCluster: "early_game" | "mid_game" | "late_game" | "spread";
  csConsistency: "high" | "medium" | "low";
  visionConsistency: "high" | "medium" | "low";
  mostPlayedChampions: string[];
}

interface RankBenchmarks {
  tier: string;
  avgCSPerMinute: number;
  avgVisionScore: number;
  avgKDA: number;
  avgWinRate: number;
}
```

### 3.3 Token Budget

Target input token range per report type:

| Report Type              | Target Tokens | Max Tokens |
| ------------------------ | ------------- | ---------- |
| Session Review (5 games) | 1,500–2,000   | 3,000      |
| Champion Focus           | 1,000–1,500   | 2,500      |
| Climb Roadmap            | 800–1,200     | 2,000      |
| Full Season Analysis     | 3,000–4,000   | 6,000      |

If input exceeds budget, `DataPreparator` applies compression:

1. Reduce per-match detail (keep only aggregate)
2. Truncate notable events to top 3 per match
3. Summarize champion pool to top 5

---

## 4. Prompt Design System

### 4.1 System Prompt Architecture

Every AI call consists of three layers:

```
┌─────────────────────────────────────────┐
│  SYSTEM PROMPT                          │
│  - Persona definition (the "coach")     │
│  - Behavioral constraints               │
│  - Output format specification          │
│  - Anti-hallucination instructions      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  CONTEXT INJECTION                      │
│  - Rank-specific coaching context       │
│  - Meta context (current patch)         │
│  - Focus area instructions              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  DATA PAYLOAD                           │
│  - Structured player data (JSON)        │
│  - Match summaries                      │
│  - Benchmarks                           │
└─────────────────────────────────────────┘
```

### 4.2 System Prompt (Core)

```
You are an elite League of Legends performance coach with 10 years of
high-elo experience. You specialize in diagnosing player mistakes and
providing actionable, specific, evidence-based coaching.

BEHAVIORAL RULES:
- Only reference data explicitly provided to you. Never invent statistics.
- Be direct and specific. "Your CS is low" is useless. "Your CS averaged
  5.1/min, which is 1.4 below Gold average (6.5/min)" is coaching.
- Prioritize by impact. A player who dies 8 times per game does not need
  vision advice first.
- Match your tone to rank. Silver players need fundamentals.
  Diamond players need edge refinement.
- End every report with exactly 3 prioritized action items.
- Do not apologize, hedge, or caveat excessively.

OUTPUT FORMAT:
You must respond with valid JSON matching the schema provided.
No markdown, no extra text before or after the JSON.
```

### 4.3 Report Type Prompts

**Session Review Prompt Focus:**

```
Analyze the last [N] games as a session.
Identify: (1) the most consistent mistake pattern,
(2) what the player does well,
(3) the single highest-impact change they can make.
```

**Champion Focus Prompt Focus:**

```
Analyze the player's performance specifically on [Champion].
Compare to their performance on other champions.
Identify champion-specific weaknesses (mechanics, matchup knowledge, build paths).
```

**Climb Roadmap Prompt Focus:**

```
Given the player's current stats, rank, and champion pool,
create a structured climb plan.
Define: what rank they can realistically reach,
which champion they should focus on,
and what 3 habits to build over the next 50 games.
```

### 4.4 Output Schema (Session Review)

```typescript
interface CoachingReportOutput {
  summary: string; // 2-3 sentences, high-level
  strengths: Array<{
    area: string;
    description: string;
    evidence: string; // Must cite specific data from input
  }>;
  weaknesses: Array<{
    area: string;
    description: string;
    priority: "high" | "medium" | "low";
    evidence: string;
    rootCause?: string;
  }>;
  actionItems: Array<{
    priority: number; // 1, 2, 3
    action: string;
    howTo: string;
    expectedImpact: string;
    timeframe: string; // "next 10 games", "this week"
  }>;
  coachPersonaResponse: string; // Natural language coaching paragraph
  estimatedRankPotential: string; // e.g., "PLATINUM I" — only if confident
  championRecommendations?: Array<{
    championName: string;
    reason: string;
    priority: "high" | "medium";
  }>;
}
```

---

## 5. Provider Abstraction Layer

### 5.1 AIClient Interface

```typescript
interface AIClient {
  complete(request: AIRequest): Promise<AIResponse>;
}

interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  outputSchema: ZodSchema;
  maxTokens: number;
  temperature: number; // 0.3 for analysis (consistency), 0.7 for coaching persona
}

interface AIResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}
```

### 5.2 Provider Implementations

```
src/lib/ai/
├── client.ts               → AIClient factory (reads AI_PROVIDER env var)
├── providers/
│   ├── openai.ts           → OpenAI implementation
│   └── anthropic.ts        → Anthropic implementation
└── types.ts
```

The factory selects the provider at startup based on `AI_PROVIDER` env var. Switching providers requires zero code changes — only an env var change.

### 5.3 Structured Output Strategy

| Provider  | Method                                                             |
| --------- | ------------------------------------------------------------------ |
| OpenAI    | `response_format: { type: 'json_object' }` + JSON schema in prompt |
| Anthropic | Prefill technique: `assistant: "{"` + JSON schema in prompt        |
| Fallback  | Parse JSON from response text with recovery heuristics             |

---

## 6. Caching Strategy

### 6.1 Cache Key Generation

The cache key is a SHA-256 hash of the normalized input payload:

```typescript
function generateCacheKey(input: CoachingInput): string {
  const normalized = {
    matchIds: input.matches.map((m) => m.riotMatchId).sort(),
    reportType: input.reportType,
    focusArea: input.focusArea ?? null,
  };
  return sha256(JSON.stringify(normalized));
}
```

This ensures:

- Same matches + same type = cache hit
- Different order of matches = same cache key (sorted)
- Different focus area = cache miss (correct)

### 6.2 Cache TTL Policy

| Cache Layer         | TTL       | Invalidation Trigger |
| ------------------- | --------- | -------------------- |
| Redis (AI response) | 24 hours  | New match synced     |
| Redis (match stats) | 1 hour    | Manual sync          |
| PostgreSQL (report) | Permanent | User deletes account |

### 6.3 Cache Hit Rate Target

Target: **>70%** cache hit rate for session reviews.

This is achievable because most users check their coaching report once per session, and a "session" (same 5 games) is fixed until new games are played.

---

## 7. Hallucination Prevention

### 7.1 Input Grounding

The prompt explicitly tells the model: _"Only reference data explicitly provided in the JSON input. If you are unsure, omit the claim."_

Every factual claim in the output must have an `evidence` field that references specific input data.

### 7.2 Output Validation

After the AI responds, `ResponseParser` validates:

1. **Schema compliance:** Zod validates the output against the expected schema.
2. **Evidence check:** Every weakness/strength object must have a non-empty `evidence` field.
3. **Rank sanity:** `estimatedRankPotential` must be a real LoL rank string or null.
4. **Action item count:** Exactly 3 action items (no more, no fewer).

### 7.3 Fallback Behavior

If AI output fails validation:

1. Log the failure with input/output for analysis.
2. Retry once with a stricter prompt ("You did not follow the output schema. Respond again with valid JSON matching this schema exactly: ...").
3. If retry fails: return a `partial` report status with only statistical data (no AI narrative).
4. Never surface AI-generated unvalidated content to users.

---

## 8. Cost Management

### 8.1 Cost Per Report (Estimated)

| Report Type    | Input Tokens | Output Tokens | Cost @ GPT-4o | Cost @ Claude Sonnet |
| -------------- | ------------ | ------------- | ------------- | -------------------- |
| Session Review | ~2,000       | ~800          | ~$0.009       | ~$0.009              |
| Champion Focus | ~1,500       | ~600          | ~$0.007       | ~$0.007              |
| Climb Roadmap  | ~1,200       | ~500          | ~$0.006       | ~$0.006              |

With 70% cache hit rate and 4 reports/user/month:

- Average cost per user/month: ~$0.011 (1.1 cents)
- At 500 paying users: ~$5.50/month AI costs
- At 10,000 paying users: ~$110/month AI costs

### 8.2 Cost Controls

- **Hard cap:** Free tier users limited to 1 AI report per week.
- **Depth tiering:** Free tier gets "lite" reports (fewer matches, shorter output).
- **Async processing:** Reports queue in off-peak hours when rate limits allow cheaper models.
- **Model routing:** Use cheaper models (GPT-4o-mini, Haiku) for lightweight tasks, expensive models for full reports.

### 8.3 Monthly Cost Monitoring

A cron job runs daily and stores AI cost aggregate in a monitoring table. Admin dashboard shows:

- Cost per day (last 30 days)
- Cost per user (to detect abuse)
- Cache hit rate trend
- Token usage by report type

---

## 9. Future AI Features (Architecture Considerations)

### 9.1 Tilt Detection

- Analyze win rate, death rate, game duration over a short rolling window (last 5 games)
- Feed to a classifier prompt: "Based on this pattern, rate tilt likelihood 1–10 and explain"
- Lightweight: uses mini model, cached per-session

### 9.2 Draft Coach

- Input: allied champion picks + banned champions
- Output: recommended champion + rationale + expected win conditions
- Latency-sensitive: must complete in < 5 seconds
- Strategy: pre-warm common draft compositions, use streaming for real-time feel

### 9.3 Pro Player Comparison

- Build statistical profiles for public high-elo players
- Compare user's stats on a champion to a pro's average
- This is a RAG (retrieval-augmented generation) use case: retrieve relevant pro stats, inject into prompt

### 9.4 Streaming Responses

Phase 2: stream the coaching report generation to the client so users see it "typing out" rather than waiting for a full response. This dramatically improves perceived latency.

Implementation: use SSE (Server-Sent Events) from the `/api/coaching/generate` endpoint when report type is `session_review`.
