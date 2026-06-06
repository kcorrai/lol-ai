-- CreateTable: player_habits
CREATE TABLE "player_habits" (
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "riotAccountId" UUID         NOT NULL,
    "habitType"     TEXT         NOT NULL,
    "severity"      TEXT         NOT NULL,
    "weekCount"     INTEGER      NOT NULL,
    "firstDetected" TIMESTAMPTZ  NOT NULL,
    "lastDetected"  TIMESTAMPTZ  NOT NULL,
    "isResolved"    BOOLEAN      NOT NULL DEFAULT false,
    "resolvedAt"    TIMESTAMPTZ,
    "evidence"      JSONB        NOT NULL,
    "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "updatedAt"     TIMESTAMPTZ  NOT NULL,

    CONSTRAINT "player_habits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "player_habits_riotAccountId_isResolved_idx"
  ON "player_habits"("riotAccountId", "isResolved");

ALTER TABLE "player_habits"
    ADD CONSTRAINT "player_habits_riotAccountId_fkey"
    FOREIGN KEY ("riotAccountId") REFERENCES "riot_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
