-- Global Search Feature Migration
-- This feature uses existing tables (companies, job_postings) and requires no schema changes.
-- The migration exists to track the feature deployment in the migration history.
-- 
-- Feature: Smart Global Search (⌘K / Ctrl+K Command Palette)
-- - Fuzzy search across 199 portal pages, reports, settings, companies
-- - Role-aware results (TPO, Coordinator, Student, Student Coordinator)
-- - Live company search via /api/search/live?q=... endpoint
-- - Recent searches persisted in localStorage
-- - No database schema changes required

SELECT 1;
