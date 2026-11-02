-- Profile columns: student_details (profile_pic, linkedin_url) and coordinator_details
-- (profile_pic, mobile, department). Added by the profile feature (commit 5ad4e9d3).
-- Idempotent via ER_DUP_FIELDNAME tolerance in the migrator.
ALTER TABLE student_details
  ADD COLUMN profile_pic VARCHAR(255) NULL;

ALTER TABLE student_details
  ADD COLUMN linkedin_url VARCHAR(255) NULL;

ALTER TABLE coordinator_details
  ADD COLUMN profile_pic VARCHAR(255) NULL;

ALTER TABLE coordinator_details
  ADD COLUMN mobile VARCHAR(20) NULL;

ALTER TABLE coordinator_details
  ADD COLUMN department VARCHAR(100) NULL;
