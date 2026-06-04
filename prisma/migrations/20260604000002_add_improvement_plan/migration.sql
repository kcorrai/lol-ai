-- CreateTable: improvement_plans
CREATE TABLE "improvement_plans" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "riotAccountId" UUID        NOT NULL,
    "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"     TIMESTAMPTZ NOT NULL,
    "status"        TEXT        NOT NULL DEFAULT 'active',
    "targets"       JSONB       NOT NULL,

    CONSTRAINT "improvement_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "improvement_plans_riotAccountId_status_idx"
    ON "improvement_plans"("riotAccountId", "status");

-- AddForeignKey
ALTER TABLE "improvement_plans"
    ADD CONSTRAINT "improvement_plans_riotAccountId_fkey"
    FOREIGN KEY ("riotAccountId")
    REFERENCES "riot_accounts"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
