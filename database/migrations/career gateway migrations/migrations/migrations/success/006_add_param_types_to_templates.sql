ALTER TABLE machine_test_templates
  ADD COLUMN param_types JSON NULL AFTER param_names,
  ADD COLUMN return_type VARCHAR(64) NULL AFTER param_types;
