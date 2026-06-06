-- CreateTable: shareable_cards
CREATE TABLE "shareable_cards" (
    "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
    "userId"    UUID         NOT NULL,
    "cardType"  TEXT         NOT NULL,
    "token"     TEXT         NOT NULL,
    "data"      JSONB        NOT NULL,
    "viewCount" INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
    "expiresAt" TIMESTAMPTZ  NOT NULL,

    CONSTRAINT "shareable_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shareable_cards_token_key" ON "shareable_cards"("token");
CREATE INDEX "shareable_cards_userId_createdAt_idx" ON "shareable_cards"("userId", "createdAt" DESC);

ALTER TABLE "shareable_cards"
    ADD CONSTRAINT "shareable_cards_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
