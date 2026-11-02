-- Add is_active column to interview_details table
ALTER TABLE interview_details 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing records to be active by default
UPDATE interview_details SET is_active = TRUE WHERE is_active IS NULL;
