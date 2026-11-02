-- Multi-role interview support: an admin can attach several roles to ONE
-- interview setup. Candidates pick one (dropdown) before starting; `role`
-- keeps the primary/first value for backward compatibility.
-- MySQL 8 (docker-compose mysql service).

ALTER TABLE `interview_details`
  ADD COLUMN `roles` JSON NULL AFTER `role`;

-- Backfill existing rows so every setup is immediately multi-role ready.
UPDATE `interview_details`
  SET `roles` = JSON_ARRAY(`role`)
  WHERE `roles` IS NULL;