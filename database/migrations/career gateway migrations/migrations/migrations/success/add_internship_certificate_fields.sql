-- Allow ongoing internships without end date; add certificate storage
ALTER TABLE internship_tracking
  MODIFY COLUMN end_date DATE NULL,
  MODIFY COLUMN duration_days INT NULL,
  ADD COLUMN certificate_path VARCHAR(255) NULL AFTER status;
