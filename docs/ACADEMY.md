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

All six `LeakTag` values now have lessons behind them — `curriculum.test.ts` enforces it.

## Role paths

Everything above is the same job in every role. The five role paths are what is left once you
know where the player stands — **five lessons each, not six**, because a role path that repeats
the curriculum is padding.

**Top Path** — the island, and the two ways off it.

1. The Island
2. Teleport Is a Map Resource, Not a Recall
3. The Matchup You Cannot Win
4. Splitting Is a Trade, Not a Duel
5. You Arrive From the Side

**Jungle Path** — time is the resource, camps are the clock.

1. The Clear Is the Plan
2. Where Their Jungler Has to Be
3. A Gank Has Three Conditions
4. The Ninety Seconds Before a Pit
5. What a Stolen Camp Actually Costs

**Mid Path** — the right to leave, and what it costs.

1. Priority Is the Whole Job
2. A Roam Costs a Wave, So It Has to Buy One
3. The Most Gankable Lane on the Map
4. Coming Back to a Lane You Left
5. Mid Decides Which Objective Happens

A role path is an ordinary `Track` that carries a `role`; that one optional field is what
separates it from the curriculum (ADR-028). Consequences worth knowing:

- The hub renders `coreTracks()` in its grid and the role paths in their own section, showing
  the player's own as a card and the other four as links. `/academy/roles` is the index for all
  five and the section rail carries one **Roles** entry rather than eleven.
- **The Academy never offers a role path to a role it is not about.** `chooseNextLesson` filters
  by the player's own role — the same `primaryPosition` reading an assignment is judged with —
  and offers no role path at all when there is no role to read. Resuming and reviewing are
  exempt: those are lessons the player opened themselves.
- Progress, XP, mastery, decay, the transcript and certificates all reached role paths without a
  line of change, because a role path is a `Track` and its lessons are `Lesson`s.

Roles are named in the Academy's own vocabulary — `RoleId` is `top | jungle | mid | adc |
support`, never Prisma's `Position`, because `types.ts` is imported by client components. The
translation lives in `roles.ts`.

Planned: Champion Mastery.

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
| **Decay** | 21 days after mastery, re-measured against the **same** target; below it drops to `review` | Mastery that cannot come undone is a certificate, not a habit |

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
| Role vocabulary | `src/domains/academy/roles.ts` |
| Lookup & gating | `src/domains/academy/curriculum.ts` |
| Drill grading | `src/domains/academy/drills/scoring.ts` |
| Placement / recommendation / assignments | `src/domains/academy/{placement,recommendation,assignments}.ts` |
| Assignment judging | `src/domains/academy/verification.ts` |
| Assignment lifecycle (Prisma) | `src/domains/academy/services/assignmentService.ts` |
| Post-sync checker | `src/inngest/functions/academyAssignmentChecker.ts` |
| Services (Prisma) | `src/domains/academy/services/` |
| Components | `src/domains/academy/components/` |
| Routes | `app/(academy)/academy/` |
| Role path index | `app/(academy)/academy/roles/page.tsx` |
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

## Mastery decays, and the decay is measured

`academyDecayChecker` runs nightly at 06:00 UTC. Three weeks after a lesson was mastered — or
three weeks after the last check — it re-reads the same metric, in the same role, against the
same target the assignment already stored, using `judgeAssignment`'s comparison unchanged. Below
the target, the lesson drops to `review`. Recovery is the ordinary path: redo it, which opens a
fresh assignment, which can restore `mastered`.

Three consequences, all deliberate (ADR-027):

- **Not a spaced-repetition timer.** Duolingo fades a skill on a clock because it cannot see
  whether you still speak the language. We can see the ranked games, so a player who has held
  the habit for a year is never sent back.
- **The target is the stored one.** Re-deriving a baseline would move the goalposts every time
  the player improved, quietly making a mastery harder to keep the better they got.
- **Silence is not regression.** No ranked games in that role since the last check means the row
  is left alone — and not stamped, so tomorrow's run looks again rather than sleeping another
  three weeks.

A player can lose a status they earned. That is the point, and it is the one place the Academy
takes something away — so the wording says the measurement moved, never that the player failed.

## XP, and deliberately no streak

Lessons pay into the same XP the rest of the product uses — `awardXp` from
`@/domains/analysis`, so the level-up threshold is not duplicated. 40 for completing a lesson,
120 more for mastering it: reading is worth something, doing it in your own ranked games is
worth three times as much.

`academy_progress.xpAwarded` is the running total a lesson has paid out, and every grant is the
difference between that and what the new status is worth. This makes the arithmetic answer every
path on its own — passing the drills twice pays once, and a lesson that decayed to `review` and
was mastered again pays nothing, because XP is never clawed back when a mastery decays.

Both grants happen inside the transaction that writes the row, so XP cannot be paid for a
completion that failed to store.

**No Academy streak.** LaneIQ Daily (LA-20) owns the only streak counter in the product. Two
streaks read to a player as two separate debts, so the Academy pays XP and nothing else.

## Transcript and certificates

`/academy/transcript` is the player's own record: every lesson, its status, the date it was
passed or mastered, and the Academy XP it paid. Signed-in only and `noindex` — it is a record,
not a page for anybody else.

A finished track can be turned into a shareable certificate from there. It rides the existing
`ShareableCard` table (`cardType` is a free string, so no migration) and the existing
`/api/cards/[token]` image route, which gained an `academy` branch beside `weekly` and
`mastery`. The public view is `/academy/certificate/[token]` and needs no account.

Two rules give the certificate its meaning:

- **Only for a finished track.** `buildCertificate` returns null otherwise and the API answers
  400 — a certificate for a part-read track is decoration, and the Academy already has a status
  for "you read most of it".
- **A lesson in `review` does not count as finished.** If the decay check has taken a mastery
  back, the certificate would be claiming something the player's own games stopped showing.

The card shows lessons read and, separately, how many were **proved in ranked** — the number
that distinguishes this from a course completion badge.
