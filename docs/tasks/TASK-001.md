# TASK-001 — Project Bootstrap & Development Environment

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 1 day

---

## Objective

Initialize the Next.js project with the full technology stack configured and verified. A new engineer should be able to clone the repo and have a working local environment within 15 minutes.

---

## Acceptance Criteria

- [x] Next.js 14 project created with App Router and TypeScript strict mode
- [x] TailwindCSS configured with custom design tokens (colors, fonts from `FRONTEND_ARCHITECTURE.md`)
- [x] shadcn/ui initialized with base components (Button, Card, Input, Badge)
- [x] Prisma configured with PostgreSQL connection (local dev via Docker)
- [x] `docker-compose.yml` spins up PostgreSQL and Redis locally
- [x] ESLint + Prettier configured and passing
- [x] `tsconfig.json` has strict mode, path aliases (`@/` → `src/`)
- [x] `.env.example` populated with all required env vars
- [x] `README.md` contains local setup instructions
- [x] CI pipeline (GitHub Actions) runs lint + type check on every PR
- [x] Deployed to Vercel preview environment successfully

---

## Technical Requirements

- Node.js ≥ 20
- `"strict": true` in tsconfig.json
- Path alias: `@/*` maps to `src/*`
- Tailwind config includes custom color palette from design system
- Docker Compose services: `postgres:16`, `redis:7`
- GitHub Actions workflow: `ci.yml` with jobs: `lint`, `typecheck`
- Vercel project linked via `vercel.json`

---

## Folder Structure to Create

Following `docs/PROJECT_STRUCTURE.md`:

```
src/
├── domains/
├── components/ui/
├── lib/
├── hooks/
├── types/
└── styles/globals.css
app/
├── (marketing)/
├── (auth)/
└── (app)/
prisma/
└── schema.prisma   ← empty schema, just datasource block
```

---

## Dependencies

None — this is the first task.

---

## Notes

Do not add any feature code in this task. Only infrastructure and configuration. If tempted to add a feature, create a new task instead.
