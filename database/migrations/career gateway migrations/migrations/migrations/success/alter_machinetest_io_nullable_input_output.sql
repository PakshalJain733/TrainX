-- Make machinetest_io.input/output nullable.
-- LeetCode-style test cases carry their data in input_json/expected_json and
-- store explicit NULLs in the legacy input/output columns, so NOT NULL here
-- makes "Column 'input' cannot be null" abort practical creation.
ALTER TABLE machinetest_io
  MODIFY COLUMN input text NULL,
  MODIFY COLUMN output text NULL;
