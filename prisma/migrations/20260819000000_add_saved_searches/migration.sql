-- Personal match database (LA-36, ADR-032): a filter set the player named and kept.
--
-- Hand-written rather than generated, per LA-15: `migrate dev` diffs the whole schema against the
-- migration history and would sweep unrelated index drift into this file.
--
-- `filters` is jsonb and not a column per facet on purpose — it is re-validated through
-- `archiveFilterSchema` on read, so a search saved before a facet existed still loads, and the
-- search console can grow a control without a migration.

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- One name per player: saving over a name replaces it, which is what "save" means here.
CREATE UNIQUE INDEX "saved_searches_userId_name_key" ON "saved_searches"("userId", "name");

-- CreateIndex
CREATE INDEX "saved_searches_userId_createdAt_idx" ON "saved_searches"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
