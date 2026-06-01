# TASK-002 — Authentication System

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 2 days  
**Depends on:** TASK-003 (database schema + migration must be applied first)

---

## Objective

Implement a complete authentication system: email/password registration + login, OAuth (Google), persistent sessions, and protected route middleware.

---

## Acceptance Criteria

- [x] User can register with email + password
- [x] User can log in with email + password
- [x] User can log in with Google OAuth
- [x] Invalid credentials show user-friendly error message
- [x] Successful login redirects to `/dashboard`
- [x] Unauthenticated users accessing `/dashboard` or any `(app)/` route are redirected to `/login`
- [x] Session persists across browser refreshes
- [x] Logout clears session and redirects to `/`
- [x] `users` and `accounts` tables exist in database (see `DATABASE_SCHEMA.md`)
- [x] `profiles` table created and auto-populated on first login

---

## Technical Requirements

- Use NextAuth.js (or BetterAuth — confirm in ADR before starting)
- Middleware at `middleware.ts` protects all `(app)/` routes
- `useSession()` hook available in client components
- Passwords hashed with bcrypt (min 12 rounds)
- OAuth client IDs stored in env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Session strategy: database sessions (not JWT) for revocability
- Prisma Adapter for NextAuth to store sessions in PostgreSQL

---

## Database Migrations Required

> ⚠️ These tables are defined and migrated in **TASK-003**, not here.
> TASK-002 consumes them — it does not create them.
> Do not write any migration files in this task.

Tables that must already exist when TASK-002 begins (created by TASK-003):
- `users`
- `accounts`
- `sessions`
- `verification_tokens` (required by NextAuth Email provider)
- `profiles` — defined in TASK-003 schema, auto-populated here via `signIn` callback

---

## Pages to Build

- `/login` — email/password form + Google OAuth button
- `/register` — registration form
- `/api/auth/[...nextauth]` — NextAuth handler

---

## Components to Build

- `LoginForm` — in `src/domains/identity/components/`
- `RegisterForm` — in `src/domains/identity/components/`
- `OAuthButton` — Google sign-in button

---

## Dependencies

- TASK-001 (project bootstrap)
- TASK-003 (database schema — must be migrated before this task starts)

## Pre-conditions Checklist

Before writing a single line of auth code, verify:
```
□ docker-compose up -d is running (postgres + redis healthy)
□ .env.local has DATABASE_URL set
□ TASK-003 prisma migrate dev has been run successfully
□ psql or prisma studio confirms tables exist: users, accounts, sessions, verification_tokens
```

---

## Notes

Do not build the user profile/settings page in this task. Only authentication flows. Profile editing is a separate task.
