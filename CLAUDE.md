# CLAUDE.md — LoL AI Coach Project Rules

This file defines the rules for AI-assisted development on this project. Every rule here exists for a reason. Read before writing a single line of code.

---

## 1. Non-Negotiable Principles

1. **Architecture first.** No code is written that is not consistent with `docs/ARCHITECTURE.md`. When in doubt, read the architecture doc.
2. **Small, focused changes.** Every PR/commit does exactly one thing. No bundled refactors with feature work.
3. **No code without a task.** Every change must trace back to a card on the project board. No improvised features. The `docs/tasks/` markdown files are historical — read them for context on past work, but do not add new ones.
4. **Tests are not optional.** No feature is complete without its test.
5. **Documentation is part of the deliverable.** Code that ships without updated docs is not done.

---

## 2. Strict Prohibitions

The following are **hard stops**. Do not do these, do not suggest them, do not sneak them in.

### 2.1 Code Prohibitions

- **No unsolicited refactoring.** Do not rename, restructure, or reformat code that is not the target of the current task. If you see something that needs cleanup, file a task — do not do it inline.
- **No large file creation.** Files over 300 lines are a design smell. If you are about to create a file that large, stop and split the responsibility.
- **No architecture violations.** Domain services must not import from other domain services directly. No cross-context coupling without an interface.
- **No raw SQL.** All database access goes through Prisma. If a raw query is truly necessary, it must be reviewed and documented.
- **No `any` in TypeScript.** Ever. Use `unknown` + type narrowing, or define proper types.
- **No hardcoded secrets.** API keys, tokens, and credentials live in environment variables only.
- **No untracked dependencies.** Never `npm install` a package without updating `docs/DEPENDENCIES.md` and explaining the rationale.
- **No `console.log` in committed code.** Use the logging service.
- **No disabled ESLint rules** without a written comment explaining why.

### 2.2 Architecture Prohibitions

- **No business logic in API route handlers.** Route handlers validate, delegate, respond. Period.
- **No direct database access outside the data layer.** Only Prisma repository patterns.
- **No AI provider SDK calls outside `src/lib/ai/`.** The AI client abstraction exists to prevent vendor lock-in.
- **No Riot API calls outside `src/domains/riot/`.** All Riot integration is isolated.
- **No frontend components that fetch data directly.** Data fetching goes through React Query hooks defined in `src/hooks/`.
- **No Zustand stores for server state.** TanStack Query owns server state. Zustand is for client-only UI state.

### 2.3 Process Prohibitions

- **No force-push to `main` or `develop`.** Ever.
- **No merging without passing CI.**
- **No shipping without a tested path through the happy path.**

---

## 3. Coding Standards

### 3.1 TypeScript

- Strict mode enabled: `"strict": true` in tsconfig.
- All function parameters and return types must be explicitly typed.
- Use `interface` for object shapes, `type` for unions/intersections/primitives.
- Prefer named exports over default exports (except for Next.js page/layout files).
- No barrel files (`index.ts` that re-exports everything) — they hide dependency paths.

```typescript
// CORRECT
export function computeKDA(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(deaths, 1);
}

// WRONG — missing types, default export, no explicit return type
export default (k, d, a) => (k + a) / Math.max(d, 1);
```

### 3.2 Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `MatchCard.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useMatchHistory.ts` |
| Files (services) | camelCase with `Service` suffix | `coachingService.ts` |
| Files (utils) | camelCase | `formatKDA.ts` |
| Database tables | snake_case (Prisma convention) | `match_participants` |
| Environment variables | SCREAMING_SNAKE_CASE | `RIOT_API_KEY` |
| React components | PascalCase | `ChampionPoolCard` |
| Zustand stores | camelCase with `Store` suffix | `useUiStore` |
| API routes | kebab-case path segments | `/api/match-history` |
| CSS classes | Tailwind utilities only | — |

### 3.3 File Size Limits

| File Type | Max Lines | Action if Exceeded |
|---|---|---|
| React component | 200 | Extract sub-components |
| Service file | 250 | Split by sub-domain |
| API route handler | 80 | Move logic to service |
| Utility file | 150 | Split by purpose |
| Test file | 300 | Split by describe block |

### 3.4 Comments

- Write comments for **why**, never for **what**. Code explains what; comments explain intent.
- Complex business rules, non-obvious calculations, and workarounds must be commented.
- No commented-out code in committed files. Delete it; git history preserves it.
- No TODO comments in main branch. Convert to tasks first.

---

## 4. Folder Structure Rules

Full structure in `docs/PROJECT_STRUCTURE.md`. Key rules:

- Feature code lives in `src/domains/<domain>/`
- Shared UI primitives live in `src/components/ui/`
- Feature-specific components live in `src/domains/<domain>/components/`
- No cross-domain imports without going through `src/domains/<domain>/index.ts` (public API of the domain)
- Utility functions used across 2+ domains live in `src/lib/`
- Type definitions used across 2+ domains live in `src/types/`

---

## 5. Testing Requirements

### 5.1 What Must Be Tested

- All service functions (unit tests with mocked dependencies)
- All API route handlers (integration tests with mocked DB)
- All utility functions with pure logic (unit tests)
- All critical user flows (e2e with Playwright)

### 5.2 Coverage Requirements

| Layer | Minimum Coverage |
|---|---|
| Domain services | 80% |
| Utility functions | 90% |
| API route handlers | 70% |
| React components | Key interactions only |

### 5.3 Test File Organization

- Unit tests: co-located at `<file>.test.ts`
- Integration tests: `src/__tests__/integration/`
- E2E tests: `tests/e2e/`

### 5.4 Test Rules

- No test should depend on the order of other tests.
- No test should make real network calls (mock Riot API, mock AI client).
- AI pipeline tests must cover: happy path, API error, malformed data, cache hit.

---

## 6. Git Workflow

### 6.1 Branch Naming

```
feature/<task-id>-short-description    → feature/TASK-012-match-history-page
fix/<task-id>-short-description        → fix/TASK-031-riot-auth-callback
chore/<description>                    → chore/update-dependencies
docs/<description>                     → docs/update-api-design
```

### 6.2 Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <short description>

[optional body]

[optional footer: refs TASK-XXX]
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`

Examples:
```
feat(coaching): generate AI coaching report for last 5 matches
fix(riot): handle 429 rate limit response with exponential backoff
test(analysis): add unit tests for KDA computation edge cases
```

### 6.3 PR Requirements

Every PR must:
- Reference a task ID in the description
- Have a self-review checklist completed
- Have passing CI (lint, type check, tests)
- Have a clear description of what changed and why
- Not exceed 400 lines of diff (split if larger)

### 6.4 Branch Protection

- `main` — production, protected, requires PR + CI
- `develop` — integration branch, protected, requires PR + CI
- Feature branches — open, deleted after merge

---

## 7. Documentation Requirements

### 7.1 What Must Be Documented

- Every new API endpoint must be added to `docs/API_DESIGN.md`
- Every new database table or column must be added to `docs/DATABASE_SCHEMA.md`
- Every new environment variable must be added to `.env.example` with a comment
- Architecture decisions must be recorded as ADRs in `docs/adr/`

### 7.2 Architecture Decision Records (ADRs)

When making a significant technical decision (choosing a library, changing an architecture pattern, adopting a new tool), create an ADR:

```markdown
# ADR-XXX: <Title>

## Status: Proposed | Accepted | Deprecated

## Context
What situation prompted this decision?

## Decision
What was decided?

## Consequences
What are the trade-offs?
```

---

## 8. AI Assistant Usage Rules

When using AI assistants (Claude Code, Copilot, etc.) on this project:

### 8.1 Allowed

- Generating boilerplate (Prisma models, Zod schemas, test scaffolding)
- Drafting prompt templates for the AI coaching pipeline
- Explaining existing code
- Suggesting optimizations for a specific, scoped file
- Writing tests for existing functions

### 8.2 Not Allowed Without Review

- Generating entire domain service files without verifying architecture compliance
- Adding new dependencies (must be reviewed against existing alternatives)
- Modifying database schema (requires explicit discussion)
- Changing authentication or authorization logic

### 8.3 Verification Requirement

Every AI-generated code block must be reviewed for:
1. Type safety (no implicit `any`)
2. Architecture compliance (correct layer placement)
3. Security (no exposed secrets, no SQL injection surface)
4. Test coverage (does the generated code have tests?)

---

## 9. Environment Variables

Required variables are defined in `.env.example`. All variables must:
- Be prefixed by their provider/scope: `RIOT_`, `OPENAI_`, `ANTHROPIC_`, `DB_`, `AUTH_`
- Have a comment explaining what they are
- Never have default values that are real secrets (use placeholder strings)

```env
# Riot Games API
RIOT_API_KEY=your_riot_api_key_here

# AI Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
AI_PROVIDER=openai  # openai | anthropic

# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=generate_with_openssl_rand_base64_32
```

---

## 10. Performance Requirements

- API routes must respond within 2 seconds for cached data
- AI report generation is async — never block a response waiting for AI
- Match history page must load within 3 seconds (LCP)
- No N+1 queries — use Prisma includes or batch queries
- All images must use Next.js `<Image>` component
