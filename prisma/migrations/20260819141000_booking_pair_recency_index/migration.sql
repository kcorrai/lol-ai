-- The thread list asks, for every (coach, student) pair it is showing, what the most recent
-- booking between them is. That is a DISTINCT ON over (coachProfileId, studentId) ordered by
-- createdAt DESC, and this is the index that lets Postgres walk it in order instead of sorting the
-- whole bookings table to answer it.
--
-- The existing indexes do not help: (coachProfileId, status, startTime) leads with the right
-- column but sorts by the wrong ones, and (studentId, createdAt DESC) has the pair the wrong way
-- round.
CREATE INDEX IF NOT EXISTS idx_bookings_pair_recency
  ON bookings ("coachProfileId", "studentId", "createdAt" DESC);
