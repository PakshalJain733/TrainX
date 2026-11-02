-- Seed the current admission batch.
--
-- Why this is needed
--   `current_batch` is read as a scalar subquery in ~38 queries across the
--   admin/coordinator dashboards, the ERP and drive reports, the announcement
--   mailers and the drive-status filters:
--
--     WHERE degree_year IN (SELECT batch FROM current_batch)
--     WHERE degree_year BETWEEN (SELECT batch FROM current_batch)
--                          AND (SELECT batch FROM current_batch) + 4
--
--   Nothing in the codebase ever INSERTs or UPDATEs this table — there is no
--   admin screen or endpoint for it — and the canonical dump (tpoStructure.sql)
--   ships the CREATE TABLE with no rows. So on a database built from the dump
--   the table is empty, and every one of those subqueries silently evaluates to
--   NULL, making those reports return nothing with no error at all.
--
--   Event creation failed outright because of the same empty table.
--   `Event.getCurrentBatch()` read `row[0].batch` without checking that a row
--   existed, so it threw:
--     Error checking current batchCannot read properties of undefined
--   (the missing separator in that message is a separate cosmetic bug, also
--   fixed in models/Event.js and helpers/Event.js).
--
-- The value
--   2024, matching `student_details.degree_year` for the students in this
--   environment. Change it with a plain UPDATE if a different admission batch
--   is in effect — this table is meant to be edited by hand as each batch
--   advances:
--     UPDATE current_batch SET batch = 2027 WHERE batch_id = 1;
--
-- Idempotent
--   Guarded on batch_id = 1, so re-running neither duplicates nor overwrites a
--   batch an admin has since set to something else.

INSERT INTO current_batch (batch_id, batch)
SELECT 1, 2024
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM current_batch WHERE batch_id = 1);
