-- Migration: Make remarkId nullable in job_postings and intership_postings
-- Decouples Job Postings and Internship Postings from Company Remarks

ALTER TABLE job_postings MODIFY COLUMN remarkId INT NULL;
ALTER TABLE intership_postings MODIFY COLUMN remarkId INT NULL;
