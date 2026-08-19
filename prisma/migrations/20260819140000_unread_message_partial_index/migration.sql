-- Unread-message lookups, for the thread poll.
--
-- An open thread is polled every five seconds, and each poll both counts the other side's unread
-- messages and marks them read. Both filter on `readAt IS NULL`, which the existing
-- (conversationId, createdAt) index cannot serve — so every poll scanned the conversation's whole
-- message history to find, almost always, nothing.
--
-- Partial rather than a plain three-column index: read messages are the overwhelming majority and
-- permanent, so indexing them would grow the index without ever being queried. This one only holds
-- rows that are still unread, which is a handful per conversation at most and shrinks again as
-- soon as the thread is opened.
--
-- Partial indexes cannot be expressed in the Prisma schema, so this is raw SQL by necessity.
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages ("conversationId", "senderId")
  WHERE "readAt" IS NULL;
