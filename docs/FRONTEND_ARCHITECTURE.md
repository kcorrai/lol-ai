# Frontend Architecture — LoL AI Coach

**Version:** 1.0

---

## 1. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR/SSG, file-based routing, React Server Components |
| Language | TypeScript (strict) | Type safety across the board |
| Styling | TailwindCSS | Utility-first, design system compatible |
| Components | shadcn/ui | Headless, accessible primitives, fully owned |
| Server State | TanStack Query (React Query) | Caching, deduplication, background refetch |
| Client State | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Performance, co-located validation |
| Charts | Recharts | Composable, React-native |
| Animations | Framer Motion | Declarative, smooth transitions |
| Icons | Lucide React | Consistent, tree-shakeable |

---

## 2. Route Structure

Using Next.js App Router route groups:

```
app/
├── (marketing)/                → Public, no auth required
│   ├── page.tsx                → / (Landing)
│   ├── pricing/page.tsx        → /pricing
│   └── layout.tsx              → Marketing header/footer
│
├── (auth)/                     → Auth pages, redirect if logged in
│   ├── login/page.tsx          → /login
│   ├── register/page.tsx       → /register
│   └── layout.tsx              → Centered card layout
│
└── (app)/                      → Protected, requires session
    ├── layout.tsx              → App shell (sidebar + topbar)
    ├── dashboard/page.tsx      → /dashboard
    │
    ├── matches/
    │   ├── page.tsx            → /matches
    │   └── [matchId]/page.tsx  → /matches/:id
    │
    ├── coaching/
    │   ├── page.tsx            → /coaching
    │   └── [reportId]/page.tsx → /coaching/:id
    │
    ├── champions/
    │   ├── page.tsx            → /champions
    │   └── [championId]/
    │       └── page.tsx        → /champions/:id
    │
    ├── roadmap/page.tsx        → /roadmap
    │
    └── settings/
        ├── page.tsx            → /settings
        ├── accounts/page.tsx   → /settings/accounts
        └── subscription/
            └── page.tsx        → /settings/subscription
```

---

## 3. Layout System

### 3.1 App Shell Layout

The authenticated app uses a persistent shell:

```
┌─────────────────────────────────────────────────────┐
│  TopBar: [Logo] [Riot Account Selector] [Notif] [User] │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  Sidebar     │         Page Content                  │
│  (collapsible│         (scrollable)                  │
│  on mobile)  │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

**Sidebar navigation items:**
- Dashboard
- Match History
- AI Coaching
- Champion Pool
- Climb Roadmap
- Settings

### 3.2 Marketing Layout

Separate layout with marketing header (logo, nav links, CTA) and footer.

### 3.3 Page Content Patterns

All authenticated pages follow a consistent pattern:

```tsx
<PageHeader title="Match History" subtitle="Your last 87 ranked games" />
<PageContent>
  <FilterBar />
  <DataGrid />
  <Pagination />
</PageContent>
```

---

## 4. Component Architecture

### 4.1 Component Hierarchy

```
Design System Primitives (src/components/ui/)
        ↑
Shared Domain-Agnostic Components (src/components/shared/)
        ↑
Domain Feature Components (src/domains/<domain>/components/)
        ↑
Page Compositions (app/(app)/<page>/page.tsx)
```

### 4.2 Component Design Rules

- **Server Components by default.** Only add `'use client'` when the component needs interactivity, browser APIs, or hooks.
- **Props are explicit and typed.** No spreading unknown props onto DOM elements.
- **Components own their loading states.** Use `Suspense` + skeleton fallbacks, not global loading spinners.
- **One component = one responsibility.** If a component does two things, split it.

### 4.3 Key Component Categories

**Design System Primitives** (`src/components/ui/`):
- `Button` — variants: primary, secondary, ghost, destructive
- `Card` — with CardHeader, CardContent, CardFooter
- `Badge` — for ranks, labels, tiers
- `Avatar` — champion icons, user avatars
- `Skeleton` — loading placeholders
- `Chart` — Recharts wrapper with consistent styling
- `Tooltip`, `Dialog`, `Sheet`, `Tabs`, `Select`, `Input`

**Domain Components** (examples):
- `MatchCard` — single match row in history list
- `ChampionPoolChart` — radar chart of champion pool stats
- `ReportCard` — coaching report preview
- `RankProgressChart` — LP timeline line chart
- `KDADisplay` — colored KDA with kill participation
- `TiltMeter` — visual tilt score indicator
- `ActionItemChecklist` — prioritized improvement items

---

## 5. State Management

### 5.1 State Categories

| State Type | Tool | Where |
|---|---|---|
| Server data (fetched) | TanStack Query | Hooks in `src/hooks/` |
| Authentication | NextAuth session | `useSession()` |
| UI state (sidebar, modals) | Zustand | `src/lib/stores/uiStore.ts` |
| Form state | React Hook Form | Inside form components |
| URL state (filters, pagination) | `useSearchParams` | In page components |

### 5.2 TanStack Query Configuration

```typescript
// Query key conventions
const QUERY_KEYS = {
  matches: (accountId: string) => ['matches', accountId],
  matchDetail: (matchId: string) => ['match', matchId],
  coachingReports: (accountId: string) => ['coaching', accountId],
  championStats: (accountId: string) => ['champions', accountId],
}
```

**Stale time defaults:**
- Match history: 5 minutes (changes frequently)
- Champion stats: 30 minutes (aggregated, stable)
- Coaching reports: 10 minutes (user-triggered)
- Static data (champions): 24 hours

### 5.3 Zustand Stores

```typescript
// UI Store — manages UI-only state
interface UIStore {
  sidebarCollapsed: boolean;
  activeRiotAccountId: string | null;
  toggleSidebar: () => void;
  setActiveAccount: (id: string) => void;
}
```

---

## 6. Data Fetching Strategy

### 6.1 Server Components (RSC)

Use for initial page data that doesn't change after load:
- Match history list (first page)
- Champion pool summary
- User subscription status

```tsx
// app/(app)/matches/page.tsx
async function MatchesPage() {
  const session = await getServerSession();
  const initialMatches = await fetchMatches(session.user.primaryAccountId);
  return <MatchHistoryView initialData={initialMatches} />;
}
```

### 6.2 Client-Side Fetching (TanStack Query)

Use for:
- Paginated / infinite scroll data
- Data that changes in response to user actions
- Polling (e.g., report generation status)
- Optimistic updates

### 6.3 Report Generation Polling

When a coaching report is being generated, the client polls the status endpoint every 3 seconds until `status === 'complete'`:

```typescript
useQuery({
  queryKey: ['report-status', reportId],
  queryFn: () => fetchReportStatus(reportId),
  refetchInterval: (data) => data?.status === 'complete' ? false : 3000,
  enabled: status === 'processing',
})
```

---

## 7. Design System

### 7.1 Color Palette

The design system uses a League of Legends-inspired dark theme:

```
Background:   #0A0E1A  (deep navy)
Surface:      #0F1629  (card background)
Surface-2:    #1A2138  (elevated surface)
Border:       #2A3550  (subtle borders)
Text:         #E8F0FF  (primary text)
Text-muted:   #8899BB  (secondary text)
Accent:       #C89B3C  (LoL gold)
Accent-blue:  #4FC3F7  (info, links)
Success:      #52B788  (wins, positive)
Danger:       #E63946  (losses, negative)
Warning:      #F4A261  (warnings, medium)
```

### 7.2 Typography

```
Font family:  'Inter' (body) + 'Rajdhani' (headings/stats)
Scale:        12/14/16/18/20/24/32/40/48
Weight:       400/500/600/700
```

### 7.3 Rank Colors

Each LoL rank has a defined color constant:
```
Iron:        #8C8C8C
Bronze:      #CD7F32
Silver:      #C0C0C0
Gold:        #FFD700
Platinum:    #00C0A0
Emerald:     #50C878
Diamond:     #B9F2FF
Master:      #9B59B6
Grandmaster: #E74C3C
Challenger:  #F1C40F
```

### 7.4 Spacing & Layout

- Base unit: 4px (Tailwind `p-1` = 4px)
- Content max-width: 1280px
- Sidebar width: 240px (collapsed: 64px)
- Card border-radius: 8px (rounded-lg)

---

## 8. Performance Strategies

### 8.1 Core Web Vitals Targets

| Metric | Target |
|---|---|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTFB | < 600ms |

### 8.2 Optimization Techniques

- **Code splitting:** Next.js handles automatically per route.
- **Champion images:** Loaded from Riot's CDN with `next/image` for lazy loading + size optimization.
- **Skeleton screens:** Every data-fetching component has a skeleton fallback.
- **Virtualization:** Match history list uses `@tanstack/react-virtual` for 100+ rows.
- **Memoization:** Expensive computations in `useMemo`; stable callbacks in `useCallback` where prop drilling is deep.
- **Prefetching:** On hover over navigation items, prefetch the linked page.

---

## 9. Error Handling

### 9.1 Error Boundaries

Each major page section wraps in an `ErrorBoundary` that shows a contextual error UI rather than crashing the whole page.

### 9.2 API Error Handling

TanStack Query handles retries automatically (3 retries with backoff). Error states are surfaced in components:

```tsx
if (isError) return <ErrorMessage message="Failed to load matches" retry={refetch} />;
```

### 9.3 User-Facing Error Messages

All error messages are user-friendly. Technical details go to Sentry, not the UI.

| Internal Error | User Message |
|---|---|
| `RIOT_API_UNAVAILABLE` | "Riot's servers are having issues. Try again shortly." |
| `AI_PROVIDER_ERROR` | "Our AI coach is busy right now. Your report will be ready soon." |
| `REPORT_LIMIT_REACHED` | "You've used your free report this week. Upgrade to Pro for unlimited." |

---

## 10. Accessibility

- All interactive elements have keyboard focus states.
- Color is never the sole indicator of meaning (rank icons have text labels).
- ARIA labels on icon-only buttons.
- Screen reader tested on key flows (login, match history, coaching report).
- Min touch target: 44x44px.
