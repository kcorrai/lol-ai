# TASK-002 — Authentication System

**Phase:** 1 — MVP  
**Status:** Not Started  
**Estimated Effort:** 2 days

---

## Objective

Implement a complete authentication system: email/password registration + login, OAuth (Google), persistent sessions, and protected route middleware.

---

## Acceptance Criteria

- [ ] User can register with email + password
- [ ] User can log in with email + password
- [ ] User can log in with Google OAuth
- [ ] Invalid credentials show user-friendly error message
- [ ] Successful login redirects to `/dashboard`
- [ ] Unauthenticated users accessing `/dashboard` or any `(app)/` route are redirected to `/login`
- [ ] Session persists across browser refreshes
- [ ] Logout clears session and redirects to `/`
- [ ] `users` and `accounts` tables exist in database (see `DATABASE_SCHEMA.md`)
- [ ] `profiles` table created and auto-populated on first login

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

- Create `users` table
- Create `accounts` table
- Create `sessions` table
- Create `profiles` table (auto-created on first session via `signIn` callback)

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

---

## Notes

Do not build the user profile/settings page in this task. Only authentication flows. Profile editing is a separate task.
