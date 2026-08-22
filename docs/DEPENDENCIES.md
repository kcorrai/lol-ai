# Dependencies

This document records every production and development dependency added after the initial project scaffold, including the rationale and the alternatives considered.

---

## Scaffold Dependencies

Arrived with `create-next-app` and `prisma init` rather than being chosen against alternatives.
Listed for completeness (TASK-275) — where a real decision exists, it lives in an ADR.

| Package | Version | Role |
|---|---|---|
| `next` | 14.2.35 | App Router framework. Pinned exactly, not caret-ranged, because the framework major gates the React major (see #12 in the scored backlog). |
| `react-dom` | ^18.3.1 | Renderer. Held on the React 18 line — ADR-009 pins R3F/drei to React-18-compatible versions. |
| `prisma` / `@prisma/client` | ^5.22.0 | ORM and generated client. Major version choice recorded in **ADR-001**. |
| `next-auth` | ^4.24.14 | Session and OAuth. Library choice recorded in **ADR-003**. |
| `@next-auth/prisma-adapter` | ^1.0.7 | Persists NextAuth sessions and accounts through Prisma, so auth state lives in the same database as everything else rather than a second store. |

---

## Production Dependencies

### `zod` (v4.x)

**Purpose:** Runtime schema validation — API request bodies, and parsing the op.gg feed.  
**Why needed:** TypeScript types vanish at runtime, so every trust boundary needs an actual check.
Used at both: route handlers parse bodies with `safeParse` before anything touches the database, and
`src/domains/meta/` validates the third-party op.gg payload, which is an undocumented feed that can
change shape without warning.  
**Why this, not io-ts/yup/joi:** it infers the TypeScript type from the schema, so the validator and
the type cannot drift apart — with the alternatives you maintain both and they eventually disagree.

### `react-hook-form` (v7.x) + `@hookform/resolvers` (v5.x)

**Purpose:** Form state and validation wiring.  
**Why this, not controlled `useState` forms:** it keeps inputs uncontrolled, so typing in one field
does not re-render the whole form. `@hookform/resolvers` is the adapter that lets the same `zod`
schema validate a form on the client and the request on the server — one definition, two
enforcement points.

### `@upstash/redis` (v1.x) + `@upstash/ratelimit` (v2.x)

**Purpose:** The rate-limit backend behind `src/lib/api/rateLimit.ts`.  
**Why needed:** Vercel functions are short-lived and horizontally scaled, so an in-process counter
limits one instance rather than one user.  
**Why this, not node-redis/ioredis:** it speaks HTTP/REST rather than the Redis wire protocol, which
is what makes it usable from a serverless function without connection pooling. Note the consequence,
recorded because it has already caused confusion: the `redis` service in `docker-compose.yml` is
**unusable** by this app — `localhost:6379` speaks the wrong protocol. When the env vars are absent,
`checkInMemory` takes over as a single-instance fallback.

### `@sentry/nextjs` (v10.x)

**Purpose:** Error and exception tracking across server, edge and client.  
**Why needed:** `withAuth` reports unhandled route errors here, and `src/lib/db/prisma.ts` tags
connection-pool exhaustion (`P2024`/`P1001`) specifically — the failure mode that matters most on a
pooled serverless database and the one least visible in logs.

### `resend` (v6.x)

**Purpose:** Transactional email — verification, weekly reports, activation.  
**Why this, not SendGrid/SES:** the React Email templating fits how the rest of the app is written,
and it needs no separate domain-verification infrastructure to start sending.

### `@lemonsqueezy/lemonsqueezy.js` (v4.x)

**Purpose:** Checkout URLs and subscription lookups for the active billing provider.  
**Why this, not Stripe:** LemonSqueezy acts as merchant of record and handles VAT/sales-tax
registration, which for a solo-operated product is the entire reason to accept a higher fee. The
migration is recorded in **ADR-004** / TASK-112, and the last Stripe remnant was removed in
TASK-276.

### `clsx` (v2.x) + `tailwind-merge` (v3.x) + `class-variance-authority` (v0.7.x)

**Purpose:** The `cn()` helper in `src/lib/utils.ts`, and typed component variants.  
**Why all three:** they solve three different halves of the same problem. `clsx` joins conditional
class names; `tailwind-merge` resolves *conflicts* between them, so a `className` prop can actually
override a component's default (`px-4` passed to a `px-2` button wins instead of both landing in the
attribute and CSS order deciding); `class-variance-authority` turns variant props into class sets
with real types, which is what `button.tsx` and `badge.tsx` are built on. Adopted together, and only
meaningful together.

### `lucide-react` (v1.x)

**Purpose:** Icon set.  
**Why this, not react-icons:** icons are individual named exports, so only the ones actually
imported reach the bundle. `react-icons` ships whole families and relies on tree-shaking working
perfectly to avoid shipping thousands of unused components.

### `recharts` (v2.x)

**Added in:** TASK-156
**Purpose:** Team stats trend charts — win rate over time (line chart) and per-member sparklines on the team dashboard. Composable React components with SSR-safe rendering.
**Why this, not alternatives:**
- Chart.js / react-chartjs-2: imperative API, less idiomatic in React, heavier bundle.
- Visx: low-level primitives, too much boilerplate for simple line/area charts.
- Tremor: opinionated design system that would conflict with the project's custom Tailwind theme.
- Native SVG: viable but time-consuming to build accessible, responsive charts from scratch.

**Scope:** `src/domains/teams/components/TeamWinRateTrend.tsx` and `TeamStatsPanel.tsx` only.

---

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

### `otplib` (v12.x) + `qrcode` + `@types/qrcode`

**Added in:** TASK-136
**Purpose:** TOTP 2FA implementation. `otplib` generates TOTP secrets, verifies time-based tokens, and generates `otpauth://` URIs. `qrcode` converts the URI to a PNG data URL for display in the browser. `bcryptjs` (already present) hashes the 8 backup codes.
**Why this, not alternatives:**
- `speakeasy`: unmaintained, last released 2017, known security issues.
- `@otplib/preset-default`: older API — `otplib` v12 uses direct exports (`generateSecret`, `verifySync`).
- Manual HMAC-SHA1: correct but adds ~100 lines of crypto code when a maintained library is available.
- Google Authenticator API: requires an external call; TOTP is a local operation.

**Scope:** `src/lib/auth/totpService.ts`, `app/api/auth/2fa/` routes.

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

### `@radix-ui/react-dialog` (v1.x)

**Added in:** TASK-271  
**Purpose:** Accessible dialog primitive behind `ConfirmDialog` and `UpgradeModal`.  
**Why needed:** Both were plain `<div>` overlays with no `role`, no `aria-*`, no Escape handler and
no focus management — focus stayed on the trigger *behind* the overlay and tabbing walked into the
still-interactive page underneath. `ConfirmDialog` guards destructive actions, so that is a real
defect rather than a nit.  
**Why this, not hand-rolled:** focus trapping, focus restoration, `aria-modal`, scroll locking and
making background content inert are individually small and collectively easy to get subtly wrong;
the failure mode is silent and only affects keyboard and screen-reader users. Same family as
`@radix-ui/react-slot`, already a dependency, so no new vendor.

---

## Toolchain

Compiler, linter, formatter, styling pipeline and type stubs. These came with the scaffold or are
the unremarkable companion of something that did; none was chosen against a real alternative, so
they get a line rather than a rationale (TASK-275).

| Package | Role |
|---|---|
| `typescript` | Compiler. `strict: true`, no weakening flags. |
| `eslint` + `eslint-config-next` | Linting, Next.js rule set. |
| `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` | Lets ESLint understand TypeScript syntax and type-aware rules. |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting; the plugin sorts Tailwind classes so class order stops appearing in diffs. |
| `tailwindcss` + `postcss` + `autoprefixer` | The styling pipeline. CLAUDE.md §3.2 mandates Tailwind utilities, so this is load-bearing rather than optional. |
| `@playwright/test` | E2E runner. Excluded from vitest in `vitest.config.ts` — the two runners both define `test`/`expect` and would otherwise collide. |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/bcryptjs` | Type stubs for untyped or partially typed packages. |

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

### `jsdom` (v29.x)

**Added in:** TASK-261  
**Purpose:** DOM implementation for the `dom` Vitest project, so `.test.tsx` files can render
components.  
**Why needed:** `vitest.config.ts` ran a single `environment: "node"` project, which meant component
tests could not run at all — the repo had 0 `.test.tsx` files as a direct consequence. The node
project keeps `environment: "node"`, so the 590 existing tests pay nothing for this.  
**Why this, not happy-dom:** happy-dom is faster but implements less of the spec; accessibility
assertions (roles, focus, ARIA) are the main reason we want component tests here (TASK-259/271), and
that is exactly where the gaps show up.

### `@testing-library/react` + `@testing-library/dom` (v16.x / v10.x)

**Added in:** TASK-261  
**Purpose:** Render components and query the resulting DOM.  
**Why this, not enzyme/react-test-renderer:** queries are role- and text-based, so tests assert what
a user (and a screen reader) perceives rather than the component's internal tree. That makes them
survive refactors and doubles as accessibility pressure. `@testing-library/dom` is a peer dependency
of the React package and is declared explicitly rather than relied on transitively.

### `@testing-library/jest-dom` (v6.x)

**Added in:** TASK-261  
**Purpose:** DOM matchers (`toBeInTheDocument`, `toBeDisabled`, `toHaveAccessibleName`).  
**Why needed:** Without it, assertions degrade to manual attribute checks that pass for the wrong
reasons — e.g. `disabled` present on a wrapper rather than the button. Imported via the
`/vitest` entry point in `vitest.setup.ts`, which registers against `expect` from vitest.

### `@testing-library/user-event` (v14.x)

**Added in:** TASK-261  
**Purpose:** Simulate real user interaction (click, type, tab).  
**Why this, not `fireEvent`:** `fireEvent.click` dispatches a single event and will happily "click" a
disabled button. `user-event` reproduces the full browser sequence, so a test that asserts a disabled
control ignores input is actually testing that.

### `patch-package` (v8.x)

**Added in:** LA-41  
**Purpose:** Applies `patches/next+14.2.35.patch` on every install (`postinstall`) — a 3-line fix
inside Next's own bundled `@vercel/og`, which every card/OG route depends on through `next/og`.  
**Why needed:** `next/dist/compiled/@vercel/og/index.node.js` loads its bundled Noto font, `yoga.wasm`
and `resvg.wasm` with `path.join(import.meta.url, "../file.ext")` before calling `fileURLToPath`. On
POSIX, `join` on a `file:///…` URL collapses the doubled `/` back into something `fileURLToPath`
tolerates by accident; on Windows `path.win32.join` treats it as a relative path and produces
`.\file:\C:\…`, which `fileURLToPath` rejects — `TypeError [ERR_INVALID_URL]`. The crash happens at
module import, before `ImageResponse` is even constructed, so no app-level option (`fonts`, custom
loaders) can route around it — every OG image route 500s in local Windows dev. Next fixed this
upstream in 15.5.23 (`fileURLToPath(new URL(...))`), but the smallest version with the fix requires
Next 15 (async `params`/`searchParams` — a migration far outside this bug's scope; tracked
separately). The patch applies that same one-line-per-file fix to the 14.2.35 we're pinned to.  
**Why this, not swapping to the standalone `@vercel/og` npm package:** that package also carries the
fix, but its current release (1.0.1) ships a different default font (Geist, not Noto) and would
change every card's rendered typography in production, not just fix Windows dev — out of scope for a
platform-path bug.  
**Consequence:** `patches/` must ship with `next` version-pinned in its filename; bumping `next`
requires regenerating the patch (`npx patch-package next`) or dropping it once the LA-41-tracked
Next 15 migration lands.

---

## External Data Sources (no npm package)

### OP.GG public ranked feed

**Added in:** TASK-166
**Endpoint:** `https://lol-api-champion.op.gg/api/global/champions/ranked`
**Purpose:** Zero-cost, patch-current global champion stats (win/pick/ban rate, tier, per-lane counters) powering the public free tools. One request returns all champions.
**Integration:** Isolated behind `src/domains/meta/` with a 12h fresh cache plus a never-expiring last-good snapshot fallback. See `docs/adr/ADR-008-meta-stats-source.md`.
**Note:** Unofficial endpoint — no API key, no npm dependency, fetched server-side only. Fallback and swap-in interface documented in the ADR.

---

## Landing Dependencies

### `three`, `@react-three/fiber`, `@react-three/drei` — REMOVED (TASK-210)

**Removed in:** TASK-210. The 3D hextech hero looked poor and shipped a heavy
WebGL bundle (`three` + R3F + drei). Replaced with a static `HeroShowcase`
(champion splash + a floating AI-insight card) — no client 3D, no extra deps.
ADR-009 is superseded.

### `framer-motion` (v11)

**Added in:** TASK-176
**Purpose:** Lightweight declarative UI animation for the marketing surface.
**Scope:** marketing components.

---

## Live Draft Room (TASK-297 … TASK-306)

**No new runtime dependency.** The whole feature is built on what was already
here:

| Need | Used |
|---|---|
| Persistence | Prisma / Neon Postgres |
| Read model, so polls do not hit Postgres | `@upstash/redis`, via `src/lib/cache/redisCache` |
| Rate limiting the first public write endpoints | `@upstash/ratelimit`, via `src/lib/api/rateLimit` |
| Client state and polling | `@tanstack/react-query` |
| Validation | `zod` |
| Icons | `lucide-react` |
| Champion portraits | Data Dragon, already fetched |
| Win rates, matchups, the draft verdict | `src/domains/meta`, already in place |

The one thing that *was* considered and rejected is a WebSocket transport —
`socket.io`, Pusher or Ably. ADR-016 records why: Next.js on Vercel has no
long-lived process to hold socket state, Upstash's REST client cannot subscribe,
and a version-stamped read model with a locally derived clock gets the latency
that actually matters (the countdown) to zero without any of it.

---

## Desktop companion (`desktop/`, LA-58)

A **separate dependency tree**, installed into `desktop/node_modules` by
`npm install --prefix desktop`. Nothing here is added to the website's
`package.json`, and the website's build, test run and type check do not see it
(`tsconfig.json` excludes `desktop`). ADR-038 explains why the app lives in this
repository at all.

Versions are pinned to the website's wherever a package appears in both, so the
two applications cannot disagree about React or Tailwind semantics.

| Package | Version | Why |
|---|---|---|
| `react`, `react-dom` | 18.3.1 | Same major as the website, so components and idioms port without translation. |
| `vite` | 8.2.2 | The frontend build. Next.js would buy nothing here — there is no server in this process — and would cost startup time, which is the metric this app is judged on. |
| `@vitejs/plugin-react` | 6.1.0 | JSX transform for the above. |
| `typescript` | 5.6.3 | Website's version. |
| `tailwindcss` | 3.4.14 | Website's version, and it must be: `desktop/tailwind.config.ts` re-exports the root config's theme (ADR-039). A different major would reinterpret those tokens. |
| `postcss`, `autoprefixer` | 8.4.47 / 10.4.20 | Website's versions. |
| **`postcss-import`** | 17.0.0 | **The only genuinely new package.** It inlines the website's `globals.css` into the desktop bundle *before* Tailwind runs. Without it Tailwind never sees those `@layer` and `@apply` rules and the app renders unstyled. Not needed on the web side, where Next handles CSS imports itself. |
| `zod` | 4.4.3 | Validates the Live Client Data API payload. Riot ships that API with the game client and changes it on their patch cadence; the schemas are loose so a new field is routine, and a *missing* one is a named error rather than a blank HUD. |
| `@tanstack/react-query` | 5.100.14 | Server state once pairing lands (phase 3). Present now so the seam is fixed rather than retrofitted. |
| `lucide-react` | 1.17.0 | Website's icon set. |
| `vitest` | 4.1.8 | Website's runner, its own config and its own project. |
| `@types/react`, `@types/react-dom` | 18.3.x | Types for the above. |

**Deliberately not taken.** `clsx` and `tailwind-merge`: they exist on the web to
reconcile classes arriving through props across ~300 shared components. This app
has a handful of screens that own their markup, and `src/lib/cn.ts` is a six-line
`join`. `framer-motion`: unused on the web too, and motion here comes from the
same CSS keyframes the design system already defines.

**Bundled assets, not packages.** Three font families ship as woff2 under
`desktop/public/fonts/` — 91 KB, Latin subset, all SIL Open Font License 1.1.
`next/font` does not exist in this process, and a companion has to open while the
machine is busy with a game or offline entirely; a face fetched over the network
reflows the HUD in front of the player. ADR-039 records this.

**Not yet added.** The Rust side (phase 2) brings `tauri` 2.11.x, `reqwest`,
`serde`, `keyring` and `tokio` in `desktop/src-tauri/Cargo.toml`. No Rust
toolchain is required for phase 1, and none is installed.
