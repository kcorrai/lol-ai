# TASK-012 — Dashboard & App Shell

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 2 days

---

## Objective

Build the authenticated application shell (sidebar, topbar, layout) and the main dashboard page. This is the first screen users see after login and sets the tone for the entire product experience.

---

## Acceptance Criteria

- [ ] App shell renders: sidebar (left), topbar (top), content area (right)
- [ ] Sidebar has navigation links: Dashboard, Matches, Coaching, Champions, Climb Roadmap, Settings
- [ ] Active page is highlighted in sidebar
- [ ] Sidebar is collapsible to icon-only mode (persisted in localStorage)
- [ ] Topbar shows: product logo, active Riot account selector, notification bell, user avatar menu
- [ ] Riot account selector shows connected accounts, allows switching primary view account
- [ ] Notification bell shows unread count badge
- [ ] User avatar menu: Profile link, Settings link, Logout
- [ ] Dashboard page shows: ranked standing card, recent matches (last 5), coaching report CTA
- [ ] If no Riot account connected: dashboard shows "Connect your Riot account" onboarding card
- [ ] Mobile: sidebar collapses to bottom navigation bar
- [ ] All navigation links work and route to correct pages

---

## Technical Requirements

### App Shell Layout

`app/(app)/layout.tsx` — Server Component wrapper
- Fetches session (via `getServerSession`)
- Fetches user's connected accounts (for account selector)
- Passes data to client `AppShell` component

`src/components/layout/AppShell.tsx` — Client Component
- Manages sidebar collapsed state (Zustand `useUIStore`)
- Renders `Sidebar`, `TopBar`, and `{children}` content

### Zustand UI Store

`src/lib/stores/uiStore.ts`:
```typescript
interface UIStore {
  sidebarCollapsed: boolean;
  activeRiotAccountId: string | null;
  setSidebarCollapsed: (v: boolean) => void;
  setActiveRiotAccountId: (id: string) => void;
}
```
Persist `sidebarCollapsed` to localStorage via Zustand persist middleware.

### Dashboard Page

`app/(app)/dashboard/page.tsx` — Server Component:
- If no riot accounts: render `OnboardingEmptyState`
- If accounts exist: render dashboard with ranked card + recent matches + report CTA

---

## Components to Build

`src/components/layout/`:
- `AppShell.tsx`
- `Sidebar.tsx`
- `SidebarNavItem.tsx`
- `TopBar.tsx`
- `RiotAccountSelector.tsx`
- `NotificationBell.tsx`
- `UserMenu.tsx`

`src/domains/dashboard/components/` (create this domain):
- `DashboardWelcomeCard.tsx` — personalized greeting with rank
- `RecentMatchesSummary.tsx` — last 5 matches mini-list
- `CoachingReportCTA.tsx` — CTA card if no recent report
- `OnboardingEmptyState.tsx` — shown when no Riot account connected

---

## Design Notes

- Sidebar background: `#0F1629` (surface)
- Topbar: `#0A0E1A` with bottom border `#2A3550`
- Active nav item: left border accent `#C89B3C` (LoL gold) + text bright
- Collapsed sidebar shows only icons (tooltips on hover)
- Mobile bottom nav: 5 icons (Dashboard, Matches, Coaching, Champions, Settings)

---

## Dependencies

- TASK-002 (auth — layout requires session)
- TASK-004 (riot accounts — for account selector)
- TASK-010 (ranked data — for dashboard card)
- TASK-006 (match data — for recent matches summary)

Can be built with placeholder/loading states while dependencies are in progress.

---

## Notes

The dashboard does not need charts in MVP — just the data cards. Chart-heavy dashboard enhancements are V2. Keep it clean and focused on the "wow moment" entry point: the coaching report CTA.
