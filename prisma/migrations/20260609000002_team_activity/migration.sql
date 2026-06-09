-- Team activity feed
CREATE TABLE "team_activities" (
    "id"        UUID        NOT NULL DEFAULT gen_random_uuid(),
    "teamId"    UUID        NOT NULL,
    "actorName" TEXT        NOT NULL,
    "action"    TEXT        NOT NULL,
    "detail"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "team_activities_teamId_createdAt_idx" ON "team_activities"("teamId", "createdAt" DESC);

ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
