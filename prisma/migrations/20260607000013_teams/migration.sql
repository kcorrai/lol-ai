-- Migration: 20260607000013_teams
-- Adds: TeamRole enum, team subscription plan value,
--       teams, team_members, team_invites tables

-- Add 'team' value to SubscriptionPlan enum
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'team';

-- Add TeamRole enum
DO $$ BEGIN
  CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'COACH', 'PLAYER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- teams
CREATE TABLE "teams" (
  "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
  "name"      TEXT         NOT NULL,
  "logoUrl"   TEXT,
  "ownerId"   UUID         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "teams_ownerId_idx" ON "teams"("ownerId");

ALTER TABLE "teams"
  ADD CONSTRAINT "teams_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- team_members
CREATE TABLE "team_members" (
  "id"       UUID         NOT NULL DEFAULT gen_random_uuid(),
  "teamId"   UUID         NOT NULL,
  "userId"   UUID         NOT NULL,
  "role"     "TeamRole"   NOT NULL DEFAULT 'PLAYER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
CREATE INDEX "team_members_teamId_idx"  ON "team_members"("teamId");
CREATE INDEX "team_members_userId_idx"  ON "team_members"("userId");

ALTER TABLE "team_members"
  ADD CONSTRAINT "team_members_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "teams"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members"
  ADD CONSTRAINT "team_members_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- team_invites
CREATE TABLE "team_invites" (
  "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
  "teamId"    UUID         NOT NULL,
  "email"     TEXT         NOT NULL,
  "token"     TEXT         NOT NULL,
  "role"      "TeamRole"   NOT NULL DEFAULT 'PLAYER',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");
CREATE INDEX "team_invites_teamId_idx" ON "team_invites"("teamId");
CREATE INDEX "team_invites_token_idx"  ON "team_invites"("token");

ALTER TABLE "team_invites"
  ADD CONSTRAINT "team_invites_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "teams"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
