-- Migration: Add ai_report column to aptitude test result tables
-- Stores the AI-generated aptitude report once per attempt so it is
-- generated a single time (consuming Gemini tokens once) and reused.

ALTER TABLE test_results
  ADD COLUMN ai_report LONGTEXT NULL AFTER answers;

ALTER TABLE practice_test_answers
  ADD COLUMN ai_report LONGTEXT NULL AFTER answers;