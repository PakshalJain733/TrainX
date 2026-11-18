-- Migration: Add solution column to generated_mcqs table
-- This migration adds a solution column to store detailed explanations for MCQ answers

-- `TEXT` cannot carry a literal default on MySQL 8 ("BLOB, TEXT, GEOMETRY or JSON
-- column can't have a default value"), so the column is added as NULL. Reads that
-- expect an empty string should treat NULL as empty; writes always set a value.
ALTER TABLE generated_mcqs 
ADD COLUMN solution TEXT NULL 
AFTER answer;

-- Add an index on the solution column for better performance
CREATE INDEX idx_generated_mcqs_solution ON generated_mcqs(solution(100));
