# LoL AI Coach

AI-powered League of Legends coaching platform.

## Prerequisites

- Node.js ≥ 20
- Docker Desktop (for local PostgreSQL + Redis)
- A Riot Games Developer API key

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd lol-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `RIOT_API_KEY` — from https://developer.riotgames.com
- `AI_PROVIDER` and corresponding API key (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)
- Stripe keys (optional for local dev — required for subscription features)

### 3. Start local services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 4. Set up the database

```bash
npx prisma migrate dev     # runs migrations (after TASK-003)
npx prisma db seed         # seeds dev data (after TASK-003)
```

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS |
| UI Components | shadcn/ui |
| Database | PostgreSQL via Prisma |
| Cache | Redis (Upstash in production) |
| Auth | NextAuth.js |
| Payments | Stripe |
| AI | OpenAI / Anthropic (provider-abstracted) |
| Deploy | Vercel |

## Project Structure

See `docs/PROJECT_STRUCTURE.md` for the complete directory layout and rules.

## Architecture

See `docs/ARCHITECTURE.md` for system design decisions.

## Development Process

See `EXECUTION_PLAN.md` for the controlled development workflow.

## Project Rules

See `CLAUDE.md` for coding standards, architecture rules, and AI assistant guidelines.
