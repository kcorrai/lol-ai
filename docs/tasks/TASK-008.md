# TASK-008 — AI Provider Abstraction Layer

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 1 day

---

## Objective

Build the provider-agnostic AI client layer. This is infrastructure work that all AI coaching features depend on. It must be built and tested before any AI feature is implemented.

---

## Acceptance Criteria

- [ ] `AIClient` interface defined with `complete(request)` method
- [ ] OpenAI provider implementation: calls `gpt-4o` by default
- [ ] Anthropic provider implementation: calls `claude-sonnet-4-6` by default
- [ ] Provider selected via `AI_PROVIDER` env var (`openai` or `anthropic`)
- [ ] Structured output (JSON) works for both providers
- [ ] Retry logic: 3 retries with exponential backoff on transient errors (429, 503)
- [ ] Timeout: requests exceeding 60 seconds are aborted
- [ ] Usage (tokens, cost) logged to `ai_analyses` table after each call
- [ ] Cache layer: check Redis for `input_hash` before calling API
- [ ] Cache hit/miss logged correctly
- [ ] Unit tests pass with mocked HTTP calls for both providers

---

## Technical Requirements

### File Structure

```
src/lib/ai/
├── client.ts               → factory function, returns AIClient for current provider
├── providers/
│   ├── openai.ts           → OpenAIClient implements AIClient
│   └── anthropic.ts        → AnthropicClient implements AIClient
├── cache.ts                → Redis cache wrapper for AI responses
└── types.ts                → AIClient, AIRequest, AIResponse interfaces
```

### AIClient Interface

```typescript
interface AIClient {
  complete(request: AIRequest): Promise<AIResponse>;
}

interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
  outputFormat: 'json' | 'text';
}

interface AIResponse {
  content: string;
  model: string;
  provider: 'openai' | 'anthropic';
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  cacheHit: boolean;
}
```

### Structured Output

- OpenAI: use `response_format: { type: 'json_object' }` when `outputFormat === 'json'`
- Anthropic: use prefill `"{"` in assistant role, instruct JSON in prompt

### Cache Key

```typescript
function buildCacheKey(request: AIRequest): string {
  return sha256(JSON.stringify({
    systemPrompt: request.systemPrompt,
    userMessage: request.userMessage,
  }));
}
```

TTL: 24 hours in Redis.

### Cost Tracking

After each API call (not cache hits), insert a row into `ai_analyses`:
- `input_hash`, `provider`, `model`, `prompt_tokens`, `completion_tokens`, `total_tokens`
- Estimated cost: calculate from current per-token pricing constants
- `cache_hit: false`

For cache hits: insert row with `cache_hit: true`, `prompt_tokens: 0`, `cost_usd: 0`.

---

## Environment Variables Required

```
AI_PROVIDER=openai           # or: anthropic
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Testing Requirements

- Mock HTTP calls (do not make real API calls in tests)
- Test: cache miss → API called → response cached
- Test: cache hit → API not called → cached response returned
- Test: 429 → retry after backoff → eventual success
- Test: timeout after 60s → throws `AITimeoutError`
- Test: malformed JSON response → throws `AIParseError`

---

## Dependencies

- TASK-001 (project setup)
- TASK-003 (ai_analyses table)
- Redis configured (via docker-compose for local dev)

---

## Notes

No feature prompt engineering in this task. Only the transport layer. Prompts live in `src/domains/coaching/prompts/`. This task is purely infrastructure.
