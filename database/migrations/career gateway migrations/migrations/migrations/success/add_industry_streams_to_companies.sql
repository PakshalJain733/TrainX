-- Adds industry and streams (BFA / BE / Both) to companies for Company Master.
ALTER TABLE companies
  ADD COLUMN industry VARCHAR(255) NULL COMMENT 'Industry sector or category',
  ADD COLUMN streams VARCHAR(32) NULL COMMENT 'BFA, BE, or Both';
