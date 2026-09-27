-- Measurable goals a coach sets after a session, tracked over the student's next ranked games (ADR-058).
CREATE TYPE "SessionGoalMetric" AS ENUM ('CS_PER_MIN', 'DEATHS', 'VISION_PER_MIN', 'KDA');

CREATE TABLE "session_goals" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "metric" "SessionGoalMetric" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_goals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "session_goals_bookingId_metric_key" ON "session_goals"("bookingId", "metric");

ALTER TABLE "session_goals" ADD CONSTRAINT "session_goals_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
