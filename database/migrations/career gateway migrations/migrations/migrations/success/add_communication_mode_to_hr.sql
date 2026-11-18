-- Preferred communication for HR contacts (phone / email / both)
ALTER TABLE hr
ADD COLUMN communication_mode VARCHAR(20) NOT NULL DEFAULT 'contact';
