# TASK-301: Draft creation page and join panel

Spec: `docs/DRAFT_ROOM.md` §3, §4. Depends on TASK-300.

## Goal

The two screens that bracket a draft: the form that mints a series, and the panel
that assigns you a seat when you open the link.

## Deliverables

**`/draft` — create**

`app/(tools)/draft/page.tsx` (server) + `CreateDraftForm.tsx` (client).

- Team 1 / Team 2 name inputs (default "Team 1" / "Team 2").
- Mode: `Normal` · `Fearless` · `Team Fearless`, each with a one-line explanation
  of what carries between games — the reference tool leaves people guessing here.
- Games: 1 · 2 · 3 · 4 · 5.
- Timer: 15 / 30 / 60 / 90 s or Untimed.
- Disabled champions: a collapsed multi-select over `/api/champions/all`.
- Submit → `POST /api/draft` → land on `/draft/<code>?as=<blueToken>` and show a
  share sheet with three copyable links: **Blue drafter**, **Red drafter**,
  **Spectator**.

The share sheet is the part worth getting right. drafter.lol hands you one link
and leaves you to work out who joins as what; we hand out three labelled links and
say plainly that whoever holds a drafter link can draft for that side.

**`/draft/[code]` — join panel**

`JoinDraftPanel.tsx`, shown when the URL carries no `?as=` token.

- "You are watching as a spectator" plus the two drafter links if — and only if —
  the visitor arrived with a drafter token already.
- Otherwise: spectator only, with a prompt to get a drafter link from whoever
  created the draft.
- Claiming a token writes it to `sessionStorage` under `draft:<code>` so a
  refresh does not drop the seat, and strips `?as=` from the URL so a shared
  screenshot or a stream overlay never exposes it.

## Rules

- Design tokens only — `ink`/`line`/`fg`/`acid` per ADR-015. No hardcoded hex.
- Components under 200 lines; the champion multi-select is its own file.
- Data fetching goes through a React Query hook in `src/hooks/`, never inline.

## Done when

Creating a draft from `/draft` lands in a room with the blue seat claimed, the
three links copy correctly, and a second browser opening the spectator link sees
the same lobby. `CreateDraftForm.test.tsx` covers validation and the mode
descriptions.
