# Dependencies

This document records every production and development dependency added after the initial project scaffold, including the rationale and the alternatives considered.

---

## Production Dependencies

### `@react-pdf/renderer` (v4.x)

**Added in:** TASK-028
**Purpose:** Server-side PDF generation for coaching report export. Renders React component trees to PDF buffers in a Next.js API route — no headless browser required.
**Why this, not alternatives:**
- Puppeteer: requires Chromium binary (~300MB), incompatible with Vercel serverless limits.
- jsPDF + html2canvas: client-side DOM screenshot → rasterized, low quality output.
- pdfmake: no React component model, more verbose document definition.

**Scope:** Used exclusively in `src/domains/coaching/pdf/` and `app/api/coaching/reports/[reportId]/pdf/route.ts`.

---

### `@tanstack/react-query` (v5.x)

**Added in:** TASK-006  
**Purpose:** Client-side server-state management. All API data fetching in UI components goes through React Query hooks in `src/hooks/` — per architecture rule "No frontend components that fetch data directly."  
**Why this, not alternatives:**
- SWR: similar but less ergonomic for mutations and cache invalidation.
- Zustand: architecture prohibits Zustand for server state. Zustand is client-only UI state only.
- Raw fetch + useState: no caching, no deduplication, no background refresh, more boilerplate.

**Scope:** Used exclusively through `src/hooks/` hooks. No direct `useQuery`/`useMutation` calls in UI components.

---

### `openai` (v6.x)

**Added in:** TASK-005  
**Purpose:** Official OpenAI Node.js SDK for calling the GPT API.  
**Why this, not alternatives:**
- `axios` + raw API: more boilerplate, no type safety for request/response shapes.
- `@anthropic-ai/sdk`: Anthropic is a secondary provider; OpenAI is the default (`AI_PROVIDER=openai`).
- `langchain`: heavy abstraction layer we don't need — we have our own prompt builder and response parser.

**Scope:** Used exclusively in `src/lib/ai/providers/openai.ts`. No other file imports from `openai`.

---

### `zustand` (v5.x)

**Added in:** TASK-012  
**Purpose:** Client-only UI state management. Used exclusively for `sidebarCollapsed` and `activeRiotAccountId` — state that is ephemeral to the browser session and has no server-side representation.  
**Why this, not alternatives:**
- TanStack Query: architecture prohibits using React Query for non-server state.
- `useState` + prop-drilling: sidebar collapsed state is needed across sibling components (Sidebar, AppShell) — Zustand avoids threading props.
- Redux/Jotai: heavier; Zustand is the established pattern for this project (referenced in CLAUDE.md).

**Scope:** Only `src/lib/stores/uiStore.ts`. No direct Zustand imports in UI components — only the store hook is imported.

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
