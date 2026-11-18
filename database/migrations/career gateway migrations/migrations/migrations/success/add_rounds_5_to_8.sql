-- Migration: Add rounds 5-8 to round_mappings table
-- Date: 2024-01-XX
-- Description: Extends the round_mappings table to support 8 rounds instead of 4

-- Add new round columns with default values.
-- The column comments are declared inline: MySQL has no `COMMENT ON COLUMN`
-- statement, so the separate ones this file used to carry were a syntax error and
-- aborted the whole migration on a database that did not already have the columns.
ALTER TABLE round_mappings 
ADD COLUMN round5 VARCHAR(255) NOT NULL DEFAULT 'Group Discussion' COMMENT 'Name for the 5th round of the recruitment process';

ALTER TABLE round_mappings 
ADD COLUMN round6 VARCHAR(255) NOT NULL DEFAULT 'Case Study' COMMENT 'Name for the 6th round of the recruitment process';

ALTER TABLE round_mappings 
ADD COLUMN round7 VARCHAR(255) NOT NULL DEFAULT 'Final Interview' COMMENT 'Name for the 7th round of the recruitment process';

ALTER TABLE round_mappings 
ADD COLUMN round8 VARCHAR(255) NOT NULL DEFAULT 'Documentation' COMMENT 'Name for the 8th round of the recruitment process';

-- Update existing records to have the new default values
UPDATE round_mappings 
SET 
    round5 = 'Group Discussion',
    round6 = 'Case Study', 
    round7 = 'Final Interview',
    round8 = 'Documentation'
WHERE round5 IS NULL OR round6 IS NULL OR round7 IS NULL OR round8 IS NULL;
