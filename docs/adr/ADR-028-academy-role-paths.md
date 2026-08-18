# ADR-028: Role paths sit beside the curriculum, not inside it

## Status: Accepted

## Context

The Academy shipped six tracks — Foundations, Laning, Vision & Map, Macro, Teamfighting,
Mental & Consistency — and every one of them teaches something all five roles do. LA-23 left
one item open: role-specific modules for Top, Jungle, Mid, ADC and Support.

The obvious implementation is five more `Track` entries in the same registry, rendered in the
same grid. Three things make that wrong:

- **Four fifths of it is not for you.** A support main opening the hub would see eleven tracks
  and be told, implicitly, that five of them are somebody else's. The Academy's whole claim is
  that it reads your games and shows you what applies to *you*.
- **The recommender would offer them.** `chooseNextLesson` walks the registry in order looking
  for an unfinished lesson that fixes a detected leak. `low_cs` is a leak a jungle lesson
  claims to fix, so a support player with low CS would be handed jungle clear routes.
- **The rail is one line.** Eleven links do not fit in it, and a section rail that scrolls
  sideways is a section nobody navigates.

## Decision

A track may carry a `role`. A track that has one is a **role path**; a track without one is the
core curriculum. That single optional field decides everything else:

- `coreTracks()` and `roleTracks()` split the registry. The hub grid renders the core six; the
  role paths get their own section below it, showing the player's own path as a card and the
  other four as links.
- `/academy/roles` is the index for all five, and the rail carries one **Roles** entry rather
  than five.
- `chooseNextLesson` will not offer a lesson from a role path unless the path's role matches the
  player's own — read from their ranked games, the same `primaryPosition` reading an assignment
  is judged with. **No role, no role lessons**: a signed-out visitor and a player with no ranked
  games get the core curriculum only.
- Resuming and reviewing are exempt from that filter. Those are lessons the player opened
  themselves, and a main role that has drifted since should not strand one half-finished.

Role paths are **five lessons**, not six. They cover only what is specific to the role; anything
true in every lane is already taught once in the core curriculum, and repeating it is padding.

The role vocabulary is the Academy's own — `RoleId` is `"top" | "jungle" | "mid" | "adc" |
"support"`, not Prisma's `Position`. `types.ts` is imported by client components (ADR-025) and a
value import of the Prisma enum drags `async_hooks` into the browser bundle. The translation
lives in `roles.ts` and nowhere else.

## Consequences

**Good**

- The hub still shows six tracks and one path — a reading list, not a catalogue.
- A role path's id *is* its role, so a path cannot be filed under a role it is not about, and
  `/academy/top` is a URL a person can guess.
- Nothing about progress, XP, mastery, decay or the transcript needed changing: a role path is a
  `Track` and its lessons are `Lesson`s, so every existing mechanism reaches them unchanged.
- A certificate for a role path is a real certificate — it is a finished track like any other.

**Bad**

- The player's role is read from ranked games only, so a player who has never queued ranked sees
  no role path recommended even though they can browse to all five. Accepted: guessing a role
  from normals would recommend the wrong path to the exact player least able to tell.
- A player who switches main role mid-season starts a new path from zero. Accepted — that is
  what actually happened to them.
- The registry now ships 61 lessons in the server bundle rather than 36. ADR-025 flagged this
  and it is still not urgent; the point at which lessons should be loaded per route rather than
  through the registry barrel is a measurement nobody has taken yet.
