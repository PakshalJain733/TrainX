-- Migration: Add options_without_explanations column to generated_mcqs table
-- This migration adds a column to store clean options without explanations

-- The original file ended with
--   CREATE INDEX idx_generated_mcqs_clean_options ON generated_mcqs(options_without_explanations(100));
-- MySQL refuses that: a JSON column can only be indexed through a generated
-- column on a specified JSON path (ERROR 3152), so the statement always failed
-- and aborted the rest of the migration run.
--
-- The index was never needed. `options_without_explanations` is only ever read
-- whole (`SELECT id, question, options_without_explanations AS options ...` in
-- controllers/practiceTest/testController.js and controllers/openAiController.js) —
-- it is never filtered, joined or sorted on, so there is no query for the index
-- to speed up. Creating one would also require a generated column plus a JSON
-- path, which is not worth the schema complexity for a value always fetched as
-- a whole row.
ALTER TABLE generated_mcqs 
ADD COLUMN options_without_explanations JSON DEFAULT NULL 
AFTER options;
