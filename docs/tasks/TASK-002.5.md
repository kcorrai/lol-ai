# TASK-002.5 — Auth → Domain Integration Layer Stabilization

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 0.5 day  
**Depends on:** TASK-002 (auth must be working)  
**Blocks:** TASK-004 (Riot API) — cannot safely access user context without this layer

---

## Objective

Close the gap between the working auth system and the domain layer that all
subsequent tasks (TASK-004+) will consume. Without this layer, every API route
would re-implement session lookup and ownership checks independently, creating
inconsistency and security gaps.

---

## Acceptance Criteria

- [ ] `getRequiredSession()` — server-side helper throws/returns typed session or 401
- [ ] `getDomainContext()` — returns `{ userId, user, subscription }` in one call
- [ ] `withAuth()` — route handler wrapper: injects context, returns 401 if unauthenticated
- [ ] `apiSuccess()` / `apiError()` — typed response builders matching API_DESIGN.md format
- [ ] `ApiError` class — throwable error in service layer, auto-caught by `withAuth`
- [ ] `assertOwnsRiotAccount()` — throws 403 if riotAccountId doesn't belong to userId
- [ ] `getPlanLimits()` — returns current user's plan limits, defaults to free tier
- [ ] Middleware updated: authenticated users on `/login` or `/register` → redirect `/dashboard`
- [ ] Middleware updated: unauthenticated access adds `callbackUrl` query param

---

## Files to Create

```
src/lib/auth/session.ts        → server-side session helpers
src/lib/auth/authorization.ts  → ownership checks + plan limit enforcement
src/lib/api/response.ts        → apiSuccess / apiError builders
src/lib/api/withAuth.ts        → protected route handler wrapper
src/lib/api/errors.ts          → ApiError class + error codes
```

## Files to Modify

```
middleware.ts  → add authenticated-user redirect from /login & /register
```

---

## Dependencies

- TASK-002 (auth: session, Prisma Adapter, authOptions)
- TASK-003 (schema: Subscription, RiotAccount tables)

## Blocks

- TASK-004 — all Riot API routes use `withAuth`
- TASK-005, 006, 007 — all domain API routes use `withAuth` + `assertOwnsRiotAccount`
- TASK-009 — AI pipeline uses `getDomainContext` for user context
- TASK-011 — Subscription service uses `getPlanLimits`

---

## Notes

No feature code. No new pages. No new models.
This task only creates plumbing that other tasks consume.
Total output: ~5 small utility files + 1 middleware update.
