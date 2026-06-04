-- AlterTable: add nullable teamObjectives JSON column to matches
ALTER TABLE "matches" ADD COLUMN "teamObjectives" JSONB;
