-- CreateTable
CREATE TABLE "patch_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patchNotesUrl" TEXT,

    CONSTRAINT "patch_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patch_versions_version_key" ON "patch_versions"("version");

-- CreateIndex
CREATE INDEX "patch_versions_detectedAt_idx" ON "patch_versions"("detectedAt" DESC);
