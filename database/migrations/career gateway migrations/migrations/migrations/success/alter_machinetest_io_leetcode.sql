-- Add LeetCode JSON columns to machinetest_io; keep legacy input/output for backward compat
ALTER TABLE machinetest_io
  ADD COLUMN input_json TEXT NULL AFTER input,
  ADD COLUMN expected_json TEXT NULL AFTER output,
  ADD COLUMN is_leetcode TINYINT(1) NOT NULL DEFAULT 0 AFTER ishidden;
