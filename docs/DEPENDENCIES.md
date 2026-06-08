# Dependencies

This document records every production and development dependency added after the initial project scaffold, including the rationale and the alternatives considered.

---

## Production Dependencies

### `posthog-js` + `posthog-node` (v1.x / v5.x)

**Added in:** TASK-114
**Purpose:** Product analytics — custom event tracking (report_generated, upgrade_clicked, Riot connect), user identification, and funnel analysis. `posthog-js` powers the client-side React provider; `posthog-node` enables server-side event capture from Inngest workers and API routes.
**Why this, not alternatives:**
- Vercel Analytics (`@vercel/analytics`): already present but only captures page views — no custom events, no user identification, no funnels.
- Mixpanel: higher price point; no self-host option for EU data-residency compliance.
- Amplitude: complex SDK, event schema management overhead.
- Segment: adds a routing layer with no benefit at this stage.

**Scope:** `src/lib/analytics/` — `posthog.ts` (server client singleton) and `PostHogProvider.tsx` (client React provider). Both are opt-in: missing `NEXT_PUBLIC_POSTHOG_KEY` disables all capture silently.

---

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

### `web-push` + `@types/web-push` (v3.x)

**Added in:** TASK-135
**Purpose:** Server-side VAPID authentication and AES-128-GCM encrypted push notification delivery. Used by `src/lib/push/pushService.ts` to send notifications to browsers that have subscribed via the Web Push API. Also handles stale subscription cleanup (HTTP 404/410 responses).
**Why this, not alternatives:**
- Manual ECDH + AES-128-GCM: implementing the Web Push Protocol from scratch is ~400 lines of crypto; `web-push` is the canonical Node.js implementation.
- Firebase Cloud Messaging: requires Firebase SDK, introduces vendor lock-in, and requires users to have a Google account — unnecessary given our direct VAPID support.
- Pusher / Ably: real-time channels, not needed here — we only push event-driven alerts.

**Scope:** Used exclusively in `src/lib/push/pushService.ts`.

---

### `fflate` (transitive, v0.8.x)

**Added in:** TASK-132
**Purpose:** ZIP archive creation for GDPR data export. The `gdprExport` Inngest function uses `zipSync` and `strToU8` to bundle multiple JSON files (profile, matches, reports, achievements, plans, audit log) into a single ZIP buffer attached to an email.
**Why this, not alternatives:**
- `jszip`: would require a new direct dependency install; fflate is already present as a transitive dependency of other packages.
- `archiver`/`adm-zip`: server-only packages that require a new direct install.
- Raw ZIP construction: building the ZIP binary format by hand is error-prone and not worth the lines.
- JSON tar: the task spec requires ZIP format.

**Scope:** Used exclusively in `src/inngest/functions/gdprExport.ts`. Import path: `fflate`.

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
