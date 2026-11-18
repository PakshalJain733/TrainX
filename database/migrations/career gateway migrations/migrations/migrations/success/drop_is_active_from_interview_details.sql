-- Remove duplicate activation column.
-- Activation state is persisted in the canonical `isActive` column only;
-- `is_active` was an orphan duplicate that the Admin All Interviews UI used to
-- read while the toggle endpoint writes `isActive`, causing state divergence.
ALTER TABLE interview_details
DROP COLUMN is_active;