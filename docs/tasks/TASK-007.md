# TASK-007 — Product Polish & User Experience Completion

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 1 day

---

## Objective

Complete the product shell: sidebar navigation, auth page branding, account management UI (sync + disconnect), and route protection via middleware.

---

## Acceptance Criteria

- [x] `Sidebar` component — brand (Zap icon + "LoL AI Coach"), Dashboard + Accounts nav links, active-state highlight, user avatar + logout button
- [x] `Avatar` component — initials-based, accent-colored circle, two sizes
- [x] `app/(app)/layout.tsx` — Sidebar integrated; main content `overflow-y-auto`
- [x] `app/(auth)/layout.tsx` — "LoL AI Coach / AI-Powered League of Legends Coaching" brand heading above all auth forms
- [x] `ConnectedAccountsList` — shows connected accounts with relative lastSyncedAt time, Sync Now button (spinner + result message), two-step disconnect confirmation
- [x] `useSyncAccount` mutation — POST `/api/riot/[id]/sync`, invalidates accounts + performance-profile cache
- [x] `useDisconnectAccount` mutation — DELETE `/api/riot/[id]`, invalidates accounts cache
- [x] `app/(app)/settings/accounts/page.tsx` — "Your Accounts" section (ConnectedAccountsList) above "Add Account" (AccountConnectionForm)
- [x] `middleware.ts` — already existed with correct protection; verified covers `/dashboard`, `/coaching`, `/settings`

---

## Files Created

```
src/components/layout/Sidebar.tsx
src/components/ui/avatar.tsx
src/hooks/useSyncAccount.ts
src/hooks/useDisconnectAccount.ts
src/domains/riot/components/ConnectedAccountsList.tsx
```
