# ADR-030: Champion lessons are generated, and the generator is a pure function

## Status: Accepted

## Context

ADR-025 decided that Academy content lives in code: one typed module per lesson, checked by
`curriculum.test.ts`. That works because the curriculum is finite — 61 lessons, all authored.

Champion Mastery cannot be. There are around 170 champions in five roles, the right content
changes every patch, and the lesson worth reading is the one about the champion _this_ player
has been playing. Authoring that is not a content problem, it is an impossible one.

The product already has the missing half. `getOtpAnalysis` (`@/domains/otp`) returns a
**structured** analysis for a champion in a role — a matchup tier list where every entry carries
a summary and a key tip, a ban priority list where every entry states its priority, power spikes,
hidden mechanics, lane strategies and a meta rating — validated against a Zod schema and cached
for fourteen days.

## Decision

**A champion lesson is generated, and the generator is a pure function of the analysis.**
`buildChampionLesson(analysis) → Lesson | null` reaches nothing: no network, no database, no
second model call. The drill _shapes_ are authored in `championDrills.ts` and the analysis only
fills them in.

That purity is what makes the rest safe. `championLesson.test.ts` runs the same contract
`curriculum.test.ts` runs — every drill block resolves, exactly one correct option, every option
explained, one gate in a pro lesson, a measurable assignment — over a fixture. Generated content
is held to the rules authored content is held to, by construction rather than by hope.

Three shapes, chosen because the analysis can actually support them:

- **Tier recognition** (quiz) — one lane the champion is favoured in against three it loses.
- **The plan for the hardest lane** (decision) — the correct option is that matchup's key tip;
  every wrong option is a _real_ tip for a _different_ opponent, so the mistake being corrected
  is "right idea, wrong lane", which is the mistake players actually make.
- **Ban priority** (order) — the only field that carries its own sequence, so it is the only one
  that can be graded as an order without inventing a ranking the source never claimed.
  Deliberately _not_ power spikes: nothing promises that array is chronological.

**A thin analysis produces no lesson.** Every builder returns null rather than a weak drill, and
`buildChampionLesson` returns null if either matchup drill is missing. A lesson with an
unanswerable drill would still be graded and would still pay XP. The ban drill is the exception:
it is dropped on its own, because a short ban list is no reason to withhold the matchup half.

**Only for champions the player actually plays.** `listChampionOptions` reads
`getRecommendedOtps` — the player's own ranked champions with at least three games — and a lesson
is generated only for one of those, in the role they play it. This is the control that keeps an
AI call off a URL a stranger can type, and it is also what makes the lesson personal rather than
a champion wiki.

**Grading rebuilds from the cached analysis, never a fresh one.** `resolveChampionLesson` calls
`getCachedOtpAnalysis`, which never generates. A cache miss means the analysis this lesson came
from has expired and the drills the player is holding no longer exist — grading those answers
against a newly generated set would mark right answers wrong. A miss is an error the reader can
act on ("this lesson has been refreshed"), not a silent regeneration.

**The assignment is measured on that champion, in that champion's role.** The champion filter is
the obvious half. The role is not: `rankedBaseline` derives the account's main role, and an
account whose last twenty ranked games were eleven support and seven mid reads as a support main
— so a Veigar lesson backed by 43 ranked mid games measured zero of them and opened nothing.
`resolveLesson` therefore carries the lesson's own role and `rankedBaseline` uses it rather than
deriving one. This is the same class of finding as the role fix in LA-22, one level further in.

**It is not in the registry.** `TrackId` gains `"champion"`, the one member with no `Track`
behind it. No sitemap entry, no `generateStaticParams`, no place in `TRACKS`, and
`getLessonById` returns null for it — champion lesson ids resolve through the service instead.
This is only safe because `academy_progress.lessonId` is a free string and deliberately not a
foreign key (ADR-025), which is exactly the property that decision was taken for.

## Consequences

**Good**

- Progress, XP, mastery, decay and the transcript reach champion lessons unchanged: it is a
  `Lesson` with an id, and every one of those mechanisms is keyed on the id.
- The content is current by construction — the analysis is regenerated every fourteen days, so a
  patch that changes a matchup changes the lesson without anybody editing a file.
- Generated content cannot ship below the standard authored content is held to.

**Bad**

- Lesson quality is `getOtpAnalysis` quality. The null path bounds the _shape_, not the truth of
  the claims — a confident, wrong tip becomes a confident, wrong drill. This is the real cost of
  the decision and it is accepted knowingly.
- A player's first visit to a champion pays for a generation. Cached fourteen days per champion
  and role across all users, so the second player on the same champion pays nothing.
- Champion lessons cannot be certified: a certificate is issued for a finished _track_, and this
  is not a track. That is correct rather than a limitation — there is no defined set to finish.
- The drills reuse a fixed set of ids (`champion-tier`, `champion-matchup`, `champion-bans`)
  across every champion. They are only ever unique _within_ a lesson, which is all the contract
  and the grader require, but it means a drill id is not globally meaningful for these lessons.
