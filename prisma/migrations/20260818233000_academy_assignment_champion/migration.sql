-- LA-32. Pin a champion lesson's field assignment to the champion it is about.
--
-- Champion lessons are generated per champion (ADR-030), so their assignments have to be
-- measured on games played on that champion. Without this the verdict would be read from the
-- player's ranked games in that role generally, which for a one-trick is nearly the same
-- population and for everybody else is a different champion's numbers entirely.
--
-- Nullable, and null is the normal case: every assignment the authored curriculum opens is
-- champion-blind, because those lessons are not about a champion.

-- AlterTable
ALTER TABLE "academy_assignments" ADD COLUMN "championId" INTEGER;
