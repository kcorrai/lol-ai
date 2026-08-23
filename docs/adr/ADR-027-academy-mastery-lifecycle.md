# ADR-027: Academy mastery lifecycle and interactive drill types

## Status: Accepted

## Context

ADR-025 settled the Academy content model: a lesson is data, drills are pure, and
`curriculum.test.ts` is the contract. Two things it deliberately left open are now
being built, and both change what a lesson status _means_.

**Mastery does not currently expire.** LA-22 made `mastered` mean something real —
the player moved a metric in their own ranked games after the lesson. But it is
stamped once and never revisited. A player who mastered wave management in March
and has been shoving mindlessly since June still reads as mastered, and the
curriculum keeps recommending lessons they have not done instead of the one that
has quietly come undone. `AcademyLessonStatus.review` has been in the schema since
the first migration with nothing ever writing it.

**Two drill kinds cannot express half the curriculum.** `quiz` and `decision` are
both "read a paragraph, pick an option". Vision and wave management are spatial and
temporal: where on the map, and what the wave does over the next three cycles.
Asking those as multiple choice tests whether the player can read, not whether they
can see.

## Decision

### 1. Mastery decays, and decay is measured, not timed

A `mastered` lesson is re-measured 21 days after `masteredAt`. The check re-reads
the same metric, in the same role, against the same target the assignment already
stored, using the judgement engine from LA-22 unchanged. If the player is no longer
holding the target, the lesson drops to `review`.

Three consequences follow from measuring rather than timing:

- Decay is **not** a spaced-repetition timer. Duolingo's mechanic fades a skill on a
  clock because it cannot see whether you still speak the language. We can see the
  ranked games. A player who has held the habit for a year is never sent back.
- The judgement needs no new rule. `AcademyAssignment` already stores `metric`,
  `direction`, `target` and `position` for the passing run, so a decay check is the
  same comparison against the same number — not a fresh baseline, which would
  quietly move the goalposts every time the player improved.
- A lesson with no ranked games in that role since the check window is left alone.
  Silence is not regression, and demoting somebody for not playing is a punishment
  for the wrong thing.

`academy_progress` gains `decayCheckedAt` so the nightly job can skip rows it has
already judged. Without it the job re-measures every mastered lesson every night.

Recovery is the existing path: a lesson in `review` is redone, which opens a fresh
assignment, which can restore `mastered`. No separate mechanism.

### 2. New drill kinds extend the union; scoring stays pure

`map` and `wave-sim` join `quiz`, `decision` and `order` as members of the `Drill`
union. The contract from ADR-025 holds unchanged: the answer serialises as
`string[]`, `gradeDrill` is pure and total, and the body component decides nothing.

- **`map`** reuses `DrillOption` with normalised coordinates (`x`, `y`, `r`) added.
  Grading is therefore the _existing_ choice branch — a click on the map is a
  choice, and giving it its own scoring path would have meant a second way to be
  right about the same thing.
- **`wave-sim`** carries a start state and an action per tick. `simulateWave` is a
  pure reducer over those actions, and the drill passes when the final state
  satisfies the stated goal (`freeze` / `slow-push` / `crash`). The component runs
  the same reducer to animate the wave, so what the player watches and what the
  grader judges cannot disagree.

The Rift is drawn as our own SVG schematic rather than shipping Riot's minimap
asset: it is licence-free, it is legible in both themes, and a schematic is what
the lesson is teaching anyway — the danger triangle is a shape, not a screenshot.

## Consequences

- The Academy can claim something no competitor can: a curriculum that takes a
  lesson _back_ when your own games stop showing it. This only works because the
  match data is already ours.
- One migration (`decayCheckedAt`), hand-written. `prisma migrate dev` is not
  trustworthy in this repo until LA-15 is closed.
- `review` now has to render everywhere a status renders — track page, track card,
  and the recommendation order, where a decayed lesson outranks an unstarted one.
- Every new drill kind is a new body component and a new scoring branch. Two is
  the ceiling for now: `map` and `wave-sim` are each used by real lessons in the
  Vision and Macro tracks. A drill kind with no lesson behind it is dead code.
- A player can lose a status they earned. That is the point, and it is the one
  place the Academy is allowed to take something away — so the wording says the
  measurement moved, never that the player failed.
