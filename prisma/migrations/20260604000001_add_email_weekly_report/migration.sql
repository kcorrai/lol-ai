-- AlterTable: add emailWeeklyReport opt-out flag to profiles
-- Defaults to true so existing users remain subscribed; opt-out is explicit.
ALTER TABLE "profiles" ADD COLUMN "emailWeeklyReport" BOOLEAN NOT NULL DEFAULT true;
