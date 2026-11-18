-- Optional office / work locations for a job posting (JSON array string, e.g. ["Bangalore","Hyderabad"])
ALTER TABLE job_postings
ADD COLUMN locations TEXT NULL;
