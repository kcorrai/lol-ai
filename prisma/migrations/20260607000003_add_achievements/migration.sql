-- CreateTable: achievement catalog (slug PK, no UUID)
CREATE TABLE "achievements" (
    "id"          TEXT    NOT NULL,
    "name"        TEXT    NOT NULL,
    "description" TEXT    NOT NULL,
    "iconSlug"    TEXT    NOT NULL,
    "tier"        TEXT    NOT NULL,
    "isSecret"    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: per-user earned achievements
CREATE TABLE "user_achievements" (
    "id"            UUID        NOT NULL,
    "userId"        UUID        NOT NULL,
    "achievementId" TEXT        NOT NULL,
    "earnedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen"          BOOLEAN     NOT NULL DEFAULT false,
    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- Unique: each achievement can only be earned once per user
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key"
    ON "user_achievements"("userId", "achievementId");

-- Index: fast lookup of unseen achievements for toast
CREATE INDEX "user_achievements_userId_seen_idx"
    ON "user_achievements"("userId", "seen");

-- FK: cascade-delete when user is deleted
ALTER TABLE "user_achievements"
    ADD CONSTRAINT "user_achievements_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: restrict delete of achievement definition while users hold it
ALTER TABLE "user_achievements"
    ADD CONSTRAINT "user_achievements_achievementId_fkey"
    FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
