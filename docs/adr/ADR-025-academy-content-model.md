# ADR-025: Academy content lives in code, not in the database

## Status: Accepted

## Context

The Academy (`/academy`, LA-21) is a League of Legends curriculum: tracks of lessons, each
lesson a short read plus interactive drills plus a measurable field assignment. It needs a
home for that content.

Three options were on the table:

1. **Database rows** — a `lessons` table, edited through an admin screen.
2. **MDX files** — the usual choice for a docs-shaped section.
3. **Typed TypeScript modules** — one file per lesson, exporting a `Lesson` object.

Constraints that decided it:

- Every lesson block, drill and assignment is structured data, not free prose. A drill has
  options, exactly one of which is correct, and each option carries its own explanation.
  A lesson's assignment names a metric that has to exist in `PlayerPerformanceProfile`.
- Lessons are the section's SEO surface, so they must render server-side with no round trip.
- There is no content team. The curriculum is written by whoever is writing the code.
- The repo has no MDX toolchain and adding one is a dependency decision (CLAUDE.md §2.1).

## Decision

Lesson content lives in `src/domains/academy/content/`, one TypeScript module per lesson,
each exporting a `Lesson` typed against `src/domains/academy/types.ts`. `content/tracks.ts`
is the registry; `curriculum.ts` is the only thing that reads it.

The database stores **only the player's relationship to that content**: `academy_progress`,
`academy_enrollments`, `academy_assignments`. `lessonId` is the string `track/slug`, and it
is deliberately **not** a foreign key — the curriculum is code, so a renamed slug should
surface as one missing lesson rather than as a constraint violation on every write.

## Consequences

**Good**

- The curriculum is typechecked. A drill block that references a drill id that does not
  exist, a pro lesson with no gate marker, an assignment naming a metric we cannot measure —
  all of these are caught by `curriculum.test.ts` rather than by a reader.
- Lessons render server-side for free, with `generateStaticParams` covering every route, and
  `app/sitemap.ts` derives its Academy entries from the same registry so the two cannot drift.
- No new dependency, no admin screen to build, no seeding step.

**Bad**

- Publishing a lesson requires a deploy. Accepted: the alternative is an editing surface
  nobody has asked for, and a lesson is not a hotfix.
- Non-engineers cannot write lessons. Accepted for now; if that changes, the `Lesson` type is
  the schema a CMS would have to satisfy, so the migration path is a loader swap.
- Content ships in the server bundle. Small at this size (12 lessons); if it grows past a
  track or two, lessons should be loaded per-route rather than through the registry barrel.

**Also decided here**

- Client components import the pure modules (`curriculum`, `drills/scoring`, `types`)
  directly, never the domain barrel — `index.ts` re-exports services that pull in Prisma,
  which drags `async_hooks` into the browser bundle and fails the build.
