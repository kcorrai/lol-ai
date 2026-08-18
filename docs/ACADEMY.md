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
  actually have), `order` (put the steps in sequence), `map` (click the spot on a schematic of
  the Rift) or `wave-sim` (drive a wave into a named state, one decision per cycle). Every
  option carries its own explanation: a wrong answer has to teach, not just be wrong. `map` is
  graded as a choice — a click is only a nicer way of naming one of the authored options —
  while `wave-sim` is replayed through the pure reducer in `drills/waveSim.ts` and judged on
  where the wave ended up.
- **Field assignment** — Proof of Practice. Written as a *movement* ("0.5 more CS per minute
  over 3 games"), never an absolute, and resolved against the player's own baseline so a
  Bronze and a Diamond player reading the same lesson get the same instruction and different
  numbers. See below — this is the half that makes the Academy more than a course.

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

**Vision & Map** — lesson 1 free, rest Pro, 6 lessons. Knowing what is not on your screen.

1. Where the Ward Actually Goes
2. Denial: The Sweeper and the Control Ward
3. The Minimap Rhythm
4. The Danger Triangle
5. Vision Is Not the Support's Job
6. Thirty Seconds Before the Objective

**Macro** — lesson 1 free, rest Pro, 6 lessons. Being somewhere else, on purpose.

1. Tempo and Priority
2. Setting Up an Objective Without Saying a Word
3. Who Goes to the Side Lane
4. Trading Objectives
5. Plates, Turrets and the Map They Open
6. Closing a Won Game

**Teamfighting** — lesson 1 free, rest Pro, 6 lessons. Decided before anyone presses anything.

1. Where You Stand Before Anything Happens
2. Who You Actually Press
3. The Three Cooldowns Worth Counting
4. Who Starts It, and When You Leave
5. The Peel Decision
6. Fighting Around a Pit

**Mental & Consistency** — lesson 1 free, rest Pro, 6 lessons. The games around the game.

1. What Tilt Actually Costs
2. The Dodge Decision
3. The First Game of the Session
4. Playing From Behind Without Making It Worse
5. Pings, Chat and the Mute Button
6. How Long to Play, and When to Stop

Planned: Role Paths, Champion Mastery.

All six `LeakTag` values now have lessons behind them — `curriculum.test.ts` enforces it.

## Proof of Practice

Finishing the drills completes a lesson. **Mastering** it takes a real game.

When a lesson is completed, the Academy opens an assignment pinned to the player's own numbers,
then judges it from their matches — nothing is self-reported.

| | Rule | Why |
|---|---|---|
| **Baseline** | Mean over the last 20 ranked games **in the player's main role** | Must match the population the verdict is read from |
| **Target** | Baseline ± the lesson's delta, floored at zero | A movement, not an absolute — same lesson, different numbers per player |
| **Counted games** | The **first** N ranked games in that role after the lesson was finished | First N, not best N — that is what makes it a commitment |
| **Verdict** | Mean of those games vs the target; landing exactly on it passes | Averaging matches how the baseline was built |
| **Expiry** | 14 days without collecting N games | An assignment that never resolves is worse than none |
| **Pass** | `academy_progress.status → mastered` | The only thing in the product that can set `mastered` |
| **Fail** | Lesson stays `completed`; the player can restart with a fresh baseline | A miss is not a punishment |

Both filters were learned against real data and both matter:

- **Ranked only.** An ARAM-inclusive baseline against a ranked-only verdict is unreachable for
  some players and free for others.
- **One role.** An account averaged 4.1 CS/min across its last twenty ranked games (a mix of mid
  and support) while the three games that would have judged the assignment were all support, at
  0.85. CS per minute is not comparable across roles, so the role is measured at open time and
  stored on the row — a player's main role can shift before the verdict lands.

Fewer than 3 ranked games in the main role means no assignment is opened at all. The lesson still
completes; a target guessed from one game is worse than no target.

The checker runs off `academy/check-assignments`, fired by `matchSyncService` after any sync that
brought in new matches — so a verdict lands the moment the games do.

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
| Assignment judging | `src/domains/academy/verification.ts` |
| Assignment lifecycle (Prisma) | `src/domains/academy/services/assignmentService.ts` |
| Post-sync checker | `src/inngest/functions/academyAssignmentChecker.ts` |
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
   assignment present, every `map` spot inside the map, and every `wave-sim` puzzle solvable
   in the cycles it gives the player — that last one is brute-forced, so an unwinnable drill
   cannot ship.

### Adding a drill kind

A member of the `Drill` union in `types.ts`, a scoring branch in `drills/scoring.ts` with its
test, and a body component wired into `DrillCard.tsx`. The answer serialises as `string[]` and
grading stays pure and total — the body decides nothing, which is why the same reducer can
animate a wave and judge it. Do not add a kind before a lesson uses it.

The route, the sitemap entry and the track page all derive from the registry — there is
nothing else to register.

## Not built yet

- **Spaced repetition.** `review` status exists; nothing demotes a mastered lesson when the
  metric slips back.
- Certificates/transcript and Academy XP.
