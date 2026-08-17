-- LA-21. The three tables the Academy owns.
--
-- Hand-written, following 20260817220000_add_daily_quiz. Nothing here touches an
-- existing table, so this migration is additive and safe to apply in any order
-- relative to the other feature branches in flight.
--
-- Lesson content is not stored. The curriculum lives in code
-- (src/domains/academy/content) so it is typechecked and unit-tested; `lessonId`
-- is the `track/slug` string that resolves against it. That is deliberately not a
-- foreign key — a renamed slug should surface as a missing lesson in one place,
-- not as a constraint violation on every write.

-- CreateEnum
CREATE TYPE "AcademyLessonStatus" AS ENUM ('available', 'in_progress', 'completed', 'mastered', 'review');

-- CreateEnum
CREATE TYPE "AcademyAssignmentStatus" AS ENUM ('active', 'passed', 'failed', 'expired');

-- CreateTable
CREATE TABLE "academy_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "AcademyLessonStatus" NOT NULL DEFAULT 'available',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_enrollments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "trackId" TEXT NOT NULL,
    "placementLevel" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "academy_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lessonId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "baseline" DECIMAL(6,2) NOT NULL,
    "target" DECIMAL(6,2) NOT NULL,
    "gamesRequired" INTEGER NOT NULL DEFAULT 3,
    "gamesObserved" INTEGER NOT NULL DEFAULT 0,
    "status" "AcademyAssignmentStatus" NOT NULL DEFAULT 'active',
    "evidence" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "academy_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_progress_userId_lessonId_key" ON "academy_progress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "academy_progress_userId_status_idx" ON "academy_progress"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "academy_enrollments_userId_trackId_key" ON "academy_enrollments"("userId", "trackId");

-- CreateIndex
CREATE INDEX "academy_assignments_userId_status_idx" ON "academy_assignments"("userId", "status");

-- CreateIndex
CREATE INDEX "academy_assignments_userId_lessonId_idx" ON "academy_assignments"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "academy_progress" ADD CONSTRAINT "academy_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_enrollments" ADD CONSTRAINT "academy_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_assignments" ADD CONSTRAINT "academy_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
