-- ---------------------------------------------------------------------------
-- Migration: transactional outbox for interview_activity_log
-- ---------------------------------------------------------------------------
-- Why this exists
-- --
-- auditBuffer batches events in memory and flushes to interview_activity_log.
-- That works well while the process stays up, but it cannot guarantee delivery
-- if:
--   - the process crashes after enqueuing but before a flush completes,
--   - the OS kills the process and the last batch never reaches MySQL, or
--   - traffic is served by multiple instances and a request hits an instance
--     that dies before its in-memory batch flushes.
--
-- A transactional outbox guarantees no loss from in-process death: write the
-- event to `interview_activity_outbox` in the same transaction that produces or
-- accepts it. A separate relay polls the outbox and inserts into
-- `interview_activity_log`, marking rows as published. If the relay dies, the
-- rows remain in the outbox and any other instance (or the restarted one) will
-- publish them.
--
-- The shape is deliberately minimal. `payload` is the full row to insert into
-- `interview_activity_log` (stored as JSON) so the relay needs no code changes
-- when new audit columns are added. `retry_count`, `max_retries`, and
-- `last_error` let the relay back off and quarantine bad rows without dropping
-- them in a way that loses evidence.
--
-- Applied automatically on boot by scripts/migrator.js.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS interview_activity_outbox (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  -- Which interview this audit belongs to. Indexed so the relay can query
  -- unprocessed rows efficiently and to aid debugging.
  interview_id INT NOT NULL,
  -- Opaque JSON payload containing the columns for interview_activity_log.
  -- The relay will INSERT ... SELECT or build INSERTs from this payload.
  payload JSON NOT NULL,
  -- 0 = unpublished. The relay atomically marks published=1, published_at and
  -- attempts a single INSERT into the target table inside a short transaction.
  published TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 20,
  last_error TEXT NULL,
  -- In-process enqueue timestamp. Drives "publish events older than" in case of
  -- clock skew and to keep ordering obvious for an operator.
  enqueued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  published_at DATETIME(3) NULL,
  -- Indexes: the poller looks for unpublished old rows first.
  KEY idx_iao_unpub_enq (published, enqueued_at),
  KEY idx_iao_unpub_interview (published, interview_id),
  KEY idx_iao_enq (enqueued_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;