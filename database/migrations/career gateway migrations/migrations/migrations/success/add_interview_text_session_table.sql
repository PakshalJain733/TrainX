-- ---------------------------------------------------------------------------
-- Migration: durable text-interview session state
-- ---------------------------------------------------------------------------
-- Why this exists
-- --
-- `textSessions` in controllers/aiInterviewController.js was a plain in-memory
-- object keyed by sessionId. It held the ENTIRE conversation for a
-- browser-voice interview: `history` (every question and answer) and
-- `questionIndex`. Nothing else held a copy.
--
-- Two failure modes follow, both silent or fatal depending on timing:
--
--   1. POST /ai-interview/text/next with `role` (the connect call) silently
--      RE-CREATES the session at questionIndex 0. A candidate who refreshed
--      after a deploy was re-asked question 1 mid-attempt, with the deadline
--      still running and no error shown anywhere.
--
--   2. POST /ai-interview/text/next WITHOUT `role` (submitAnswerText sends only
--      {sessionId, answerText}) hits
--         if (!session) { if (!role) return 400 "role is required..." }
--      so the interview dies irrecoverably. The IN_PROGRESS row survives with a
--      live deadline, but the conversation cannot be reconstructed.
--
-- Triggered by any restart, deploy or OOM during an interview -- and by ANY
-- multi-instance deployment behind a load balancer without sticky sessions,
-- since consecutive turns of one interview hash to different processes. That
-- makes horizontal scaling impossible, which is the opposite of the goal.
--
-- This table makes the conversation durable and instance-independent: state now
-- lives in MySQL, so turns can land on any process and survive any restart.
--
-- session_id is the natural key because it is what the client already sends and
-- what interviews.session_id already references. interview_id is denormalised in
-- so a session can be traced back to its attempt row without a second lookup,
-- and so a session can be invalidated when its attempt is terminated.
--
-- `history` is JSON, not a child table: it is written and read as one opaque
-- value per turn, never queried by content, and it is bounded by `budget`
-- (<= 20 exchanges). A child table would buy queryability nobody needs at the
-- cost of a join on the hottest path in the interview.
--
-- Applied automatically on boot by scripts/migrator.js, which records the file
-- in schema_migrations with a checksum. Plain statements only -- the migrator has
-- no DELIMITER support -- and ER_TABLE_EXISTS_ERROR is treated as "already
-- applied", so this is safe to re-run.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS interview_text_session (
  -- What the client sends on every turn. VARCHAR(64) to index efficiently while
  -- leaving room for a UUID-with-prefix style id.
  session_id     VARCHAR(64)  NOT NULL,
  -- Owning attempt row. NULL-tolerant: a session may be created before the
  -- attempt row is known (the connect call carries the id, but nothing depends
  -- on it being present).
  interview_id   INT          NULL,
  user_id        INT          NOT NULL,
  role           VARCHAR(191) NOT NULL,
  -- JSON array of strings. Written with JSON.stringify, read defensively
  -- because MySQL JSON columns come back already decoded.
  skills         JSON         NULL,
  -- Question budget for this interview, clamped to [3, 20] at creation.
  budget         INT          NOT NULL DEFAULT 5,
  -- How many candidate answers have been accepted. Advanced exactly once per
  -- non-replayed answer, inside the same locked read-modify-write.
  question_index INT          NOT NULL DEFAULT 0,
  -- JSON array of {role, content}. The whole conversation.
  history        JSON         NOT NULL,
  -- Drives the TTL sweep. Index-backed because the sweep is a range delete and
  -- must not table-scan on every tick.
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (session_id),
  KEY idx_its_user (user_id),
  KEY idx_its_interview (interview_id),
  KEY idx_its_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A JSON column cannot carry a literal DEFAULT on every MySQL version this app
-- is deployed against, so `history` is NOT NULL with no default and every INSERT
-- writes it explicitly. This statement exists purely to guarantee that invariant
-- on a database where the table was created by an older/partial run.
ALTER TABLE interview_text_session
  MODIFY COLUMN history JSON NOT NULL;