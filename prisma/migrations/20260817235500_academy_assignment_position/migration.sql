-- LA-22. Pin a field assignment to the role it was measured in.
--
-- Found against real data: an account with 94 ranked games averaged 4.1 CS/min over its last
-- twenty (a mix of mid and support), while the three games that would have judged the
-- assignment were all support and averaged 0.85. CS per minute is not comparable across roles,
-- so a role-blind baseline sets a target no support game can reach and every mid game clears
-- by accident.
--
-- Nullable, so the rows written before this migration keep working: a null position means the
-- assignment was opened role-blind and is judged that way.

-- AlterTable
ALTER TABLE "academy_assignments" ADD COLUMN "position" "Position";
