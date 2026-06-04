-- AlterTable: add shareToken to coaching_reports
ALTER TABLE "coaching_reports" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "coaching_reports_shareToken_key" ON "coaching_reports"("shareToken");
