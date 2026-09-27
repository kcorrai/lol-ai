-- A listing can be a trial: a short first session, one per student per coach (ADR-058).
ALTER TABLE "coach_listings" ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT false;
