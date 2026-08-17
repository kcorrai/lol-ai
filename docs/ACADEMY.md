# LaneIQ Academy

The learning section at `/academy`. Its own route group, its own shell, its own navigation —
the same shape as Esports and the Draft Room, and deliberately not a dashboard page.

## Why it exists

The market splits in two and neither half closes the loop:

| Product | What it does | What it misses |
|---|---|---|
| Skill Capped, ProGuides | Structured video curriculum | Nobody diagnoses your actual habits |
| Mobalytics, AI coaches (RiftCoach, Meeko, Baron Buff) | Reads your games, reports on them | No curriculum — a report is not a lesson |
| MOBA Trainer | Interactive pro-authored decision puzzles | Static content, unconnected to your matches |
| LoL Dodge Game | Mechanical mini-games | Mechanics only, no macro, no progression |

We already own both halves: `habitDetectionService` finds the leak, `getPlayerPerformanceProfile`
gives the numbers, `rankBenchmarkService` gives the comparison. The Academy is the curriculum
that sits on top and closes the loop:

> **diagnose → teach → drill → apply in a real game → verify from match data → mastery**

## Structure

```
Track  →  Lesson  →  Blocks + Drills + Field assignment
```

- **Track** — a themed sequence. Lesson order is teaching order; nothing in a lesson depends
  on a lesson listed after it.
- **Lesson** — 4–6 minutes of reading, one or two drills, one measurable field assignment.
- **Drill** — `quiz` (multiple choice), `decision` (a scenario with the facts a player would
  actually have) or `order` (put the steps in sequence). Every option carries its own
  explanation: a wrong answer has to teach, not just be wrong.
- **Field assignment** — Proof of Practice. Written as a *movement* ("0.5 more CS per minute
  over 3 games"), never an absolute, and resolved against the player's own baseline so a
  Bronze and a Diamond player reading the same lesson get the same instruction and different
  numbers.

## Curriculum (v1)

**Foundations** — free, 6 lessons. What the game is actually about.

1. The Map & The Actual Win Condition
2. Minions, Gold & Why CS Beats Kills
3. The Shop & Power Spikes
4. Recall Timing
5. Vision Basics: The Three Phases
6. Objectives & Turret Plates

**Laning** — lesson 1 free, rest Pro, 6 lessons. The biggest skill gap between ranks.

1. The Four Wave States
2. Slow Push & Crash
3. Freezing — And When Not To
4. Trading Patterns
5. Jungle Tracking From Lane
6. The First Back

Planned: Vision & Map, Macro, Teamfighting, Mental & Consistency, Role Paths, Champion Mastery.

## Access

Lessons are public and indexed — they are the section's SEO surface and its funnel. A `pro`
lesson renders in full up to its `gate` block for everyone; the practical half (situations,
the costly mistake, the drills, the assignment) is behind Pro. Personalisation — placement,
leak-to-lesson mapping, assignment baselines — needs a signed-in account with synced matches.

Grading respects the gate: a free reader is scored on the drills they were shown, never on
drills behind the gate.

## Personalisation

- `placement.ts` reads four metrics off the player's last 20 games (CS/min, vision/min,
  deaths, kill participation) and returns a level, a starting track, and the leaks behind the
  verdict. Three weak readings out of four opens Foundations; anything less opens Laning.
- `recommendation.ts` picks the one lesson to show, in this order: resume something already
  open → a leak `habitDetectionService` has confirmed over several weeks → a leak placement
  raised from a single snapshot → the next lesson in the placed track → anything left.
- Every recommendation carries the reason it was made. A suggestion the player cannot trace
  back to their own games is just a table of contents.

## Where things live

| Concern | Path |
|---|---|
| Types | `src/domains/academy/types.ts` |
| Lesson content | `src/domains/academy/content/<track>/<lesson>.ts` |
| Track registry | `src/domains/academy/content/tracks.ts` |
| Lookup & gating | `src/domains/academy/curriculum.ts` |
| Drill grading | `src/domains/academy/drills/scoring.ts` |
| Placement / recommendation / assignments | `src/domains/academy/{placement,recommendation,assignments}.ts` |
| Services (Prisma) | `src/domains/academy/services/` |
| Components | `src/domains/academy/components/` |
| Routes | `app/(academy)/academy/` |
| API | `app/api/academy/progress/route.ts` |

Content decisions and the client-import rule are recorded in
`docs/adr/ADR-025-academy-content-model.md`.

## Adding a lesson

1. Write `src/domains/academy/content/<track>/<name>.ts` exporting a `Lesson`.
2. Add it to the track's `lessons` array in `content/tracks.ts`, in teaching order.
3. Run `npx vitest run src/domains/academy`. `curriculum.test.ts` checks the structure:
   unique id, every drill block resolves, exactly one correct option per choice drill, every
   option explained, a gate in every pro lesson and none in a free one, objectives and an
   assignment present.

The route, the sitemap entry and the track page all derive from the registry — there is
nothing else to register.

## Not built yet

- **Proof of Practice verification.** Assignments are created with a real baseline and shown
  to the player, but nothing yet watches the next N matches and lifts a lesson to `mastered`.
  The `academy_assignments` table and the `mastered` status exist for it.
- **Spaced repetition.** `review` status exists; nothing demotes a mastered lesson when the
  metric slips back.
- Certificates/transcript, Academy XP and streak, `map` and `wave-sim` drill types.
