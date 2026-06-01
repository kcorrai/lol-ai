# Dependencies

This document records every production and development dependency added after the initial project scaffold, including the rationale and the alternatives considered.

---

## Production Dependencies

### `openai` (v6.x)

**Added in:** TASK-005  
**Purpose:** Official OpenAI Node.js SDK for calling the GPT API.  
**Why this, not alternatives:**
- `axios` + raw API: more boilerplate, no type safety for request/response shapes.
- `@anthropic-ai/sdk`: Anthropic is a secondary provider; OpenAI is the default (`AI_PROVIDER=openai`).
- `langchain`: heavy abstraction layer we don't need — we have our own prompt builder and response parser.

**Scope:** Used exclusively in `src/lib/ai/providers/openai.ts`. No other file imports from `openai`.

---

## Development Dependencies

### `vitest` (v4.x)

**Added in:** TASK-005  
**Purpose:** Test runner for unit and integration tests.  
**Why this, not Jest:**
- Native ESM support without extra Babel config — matches Next.js 14 module resolution.
- Faster cold start and watch mode.
- Compatible `expect` / `vi` API, low migration cost if switching later.

### `@vitest/coverage-v8` (v4.x)

**Added in:** TASK-005  
**Purpose:** V8-based coverage provider for `vitest run --coverage`.

### `vite-tsconfig-paths` (v6.x)

**Added in:** TASK-005  
**Purpose:** Resolves `@/*` TypeScript path aliases in Vitest (which uses Vite under the hood).  
**Why needed:** Without this, Vitest cannot resolve `@/lib/...` imports in test files.
