-- ===========================================================================
-- Collective migration: 2026-09-20 .. 2026-09-26  (branch: newUi)
-- ===========================================================================
--
-- WHAT THIS IS
--   A single, self-contained, re-runnable script that consolidates the 16
--   migration files committed to `newUi` between 20 and 26 September 2026.
--   It exists for databases you cannot boot the backend against — the Docker
--   `careergateway-mysql` service, a shared staging box, or a handoff where
--   someone runs `mysql < thisfile.sql` by hand.
--
--   The backend already auto-applies `backend/migrations/*.sql` on boot
--   (see `scripts/migrator.js` + `app.js` -> `migrateOnBoot()`), so for the
--   normal path this file is redundant. It does NOT replace or disable that.
--
-- HOW TO APPLY
--   mysql -u <user> -p <database> < backend/migrations/collective/2026-09-20_to_2026-09-26_collective.sql
--
--   This file uses `DELIMITER` and stored procedures, so it must be applied
--   through the `mysql` CLI. It will NOT work through `scripts/migrator.js`,
--   which splits statements itself and does not support DELIMITER. That is why
--   it lives in this `collective/` subfolder: `migrator.js` only reads the top
--   level of `migrations/`, so the backend will not try to apply it twice.
--
-- PREREQUISITE
--   A base schema must already exist (either imported from `tpoStructure.sql`,
--   or created by `npm run bootstrap:db` / `npm run migrate`). Tables that no
--   migration owns — `interview_details`, `drive_status`, `mcqs`, `prompts`,
--   `student_details`, `companies` … — come from that base schema. A missing
--   table is reported as a skip line and its columns are skipped with it; the
--   script does not abort.
--
-- IDEMPOTENCY
--   Every statement is guarded, so running this file twice is safe. MySQL 8 has
--   no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (it is a syntax error, 1064),
--   so the guards are stored procedures that consult `information_schema` and
--   then `PREPARE`/`EXECUTE` the DDL only when it is actually needed. The
--   helper procedures drop themselves at the end of the run.
--
-- SOURCE FILES (20)
--   000_create_programming_languages.sql
--   001_create_machinetest_data.sql
--   002_create_machinetest_io.sql
--   003_create_machinetest_lan.sql
--   004_create_machine_submissions.sql
--   005_create_tpo_events.sql
--   006_add_param_types_to_templates.sql
--   add_ai_report_to_aptitude_tests.sql
--   add_rounds_5_to_8.sql
--   add_roles_to_interview_details.sql
--   add_solution_to_generated_mcqs.sql
--   align_shared_tables_with_dump.sql
--   align_tpo_events_with_dump.sql
--   alter_machinetest_io_leetcode.sql
--   alter_machinetest_io_nullable_input_output.sql
--   create_aptitude_report_cache.sql
--   create_aptitude_test_questions.sql
--   create_machine_test_templates.sql
--   drop_is_active_from_interview_details.sql
--   patch_local_test_data.sql            (data patch, applied last)
--
--   Plus one fix that is not in any source migration but is required for the
--   database to actually work — see section 15.
--
-- FIXES CARRIED HERE
--   Section 15 re-points the four trigger DEFINERs at the connected account.
--     The dump ships `after_job_posting_insert` as `DEFINER=`tpo`@`%``. Where
--     that account does not exist the trigger is still created, but the first
--     INSERT that fires it aborts the whole statement with
--     ERROR 1449 (definer does not exist) — so `INSERT INTO job_postings`
--     fails outright. Mirrors migrations/trigger_definer_fix.sql.
--
-- ORDERING
--   The source files are not in dependency order. In particular
--   `006_add_param_types_to_templates.sql` ALTERs `machine_test_templates`,
--   which `create_machine_test_templates.sql` creates, and that file sorts
--   after it. The numbered block is applied first, then the machine-test
--   additions, then the two `align_*` files, then the rest. This removes the
--   need for the deferred-retry loop `migrator.js` relies on.
--
-- schema_migrations
--   This file deliberately does NOT write to `schema_migrations`. The next
--   backend boot will re-run the 16 originals, tolerate every duplicate, and
--   record them — noisy once, quiet afterwards.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- Helper procedures
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS _cg_add_column;
DROP PROCEDURE IF EXISTS _cg_rename_column;
DROP PROCEDURE IF EXISTS _cg_modify_column;
DROP PROCEDURE IF EXISTS _cg_drop_column;
DROP PROCEDURE IF EXISTS _cg_add_index;

DELIMITER $$

-- Add a column only when the table exists and the column does not.
-- `p_after` is the column it should sit behind; if that column is absent the
-- AFTER clause is silently dropped rather than failing the whole statement.
CREATE PROCEDURE _cg_add_column(
  IN p_table VARCHAR(64),
  IN p_col   VARCHAR(64),
  IN p_def   TEXT,
  IN p_after VARCHAR(64)
)
BEGIN
  DECLARE v_tbl   INT DEFAULT 0;
  DECLARE v_col   INT DEFAULT 0;
  DECLARE v_after INT DEFAULT 0;

  SELECT COUNT(*) INTO v_tbl FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = p_table;

  SELECT COUNT(*) INTO v_col FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_col;

  IF v_tbl = 0 THEN
    SELECT CONCAT('  skip: table `', p_table, '` does not exist') AS note;
  ELSEIF v_col = 0 THEN
    SET @cg_sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);

    IF p_after IS NOT NULL AND p_after <> '' THEN
      SELECT COUNT(*) INTO v_after FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_after;
      IF v_after > 0 THEN
        SET @cg_sql = CONCAT(@cg_sql, ' AFTER `', p_after, '`');
      END IF;
    END IF;

    PREPARE cg_stmt FROM @cg_sql;
    EXECUTE cg_stmt;
    DEALLOCATE PREPARE cg_stmt;
  END IF;
END$$

-- Rename a primary-key column back to the name the dump (and the code) uses.
-- Only acts when the old name is present AND the new name is not, so a rename
-- that already landed is a no-op rather than an error.
CREATE PROCEDURE _cg_rename_column(
  IN p_table VARCHAR(64),
  IN p_old   VARCHAR(64),
  IN p_new   VARCHAR(64)
)
BEGIN
  DECLARE v_old INT DEFAULT 0;
  DECLARE v_new INT DEFAULT 0;

  SELECT COUNT(*) INTO v_old FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_old;

  SELECT COUNT(*) INTO v_new FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_new;

  IF v_old > 0 AND v_new = 0 THEN
    SET @cg_sql = CONCAT('ALTER TABLE `', p_table, '` RENAME COLUMN `', p_old, '` TO `', p_new, '`');
    PREPARE cg_stmt FROM @cg_sql;
    EXECUTE cg_stmt;
    DEALLOCATE PREPARE cg_stmt;
  END IF;
END$$

CREATE PROCEDURE _cg_modify_column(
  IN p_table VARCHAR(64),
  IN p_col   VARCHAR(64),
  IN p_def   TEXT
)
BEGIN
  DECLARE v_col INT DEFAULT 0;

  SELECT COUNT(*) INTO v_col FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_col;

  IF v_col > 0 THEN
    SET @cg_sql = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN `', p_col, '` ', p_def);
    PREPARE cg_stmt FROM @cg_sql;
    EXECUTE cg_stmt;
    DEALLOCATE PREPARE cg_stmt;
  END IF;
END$$

CREATE PROCEDURE _cg_drop_column(
  IN p_table VARCHAR(64),
  IN p_col   VARCHAR(64)
)
BEGIN
  DECLARE v_col INT DEFAULT 0;

  SELECT COUNT(*) INTO v_col FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_col;

  IF v_col > 0 THEN
    SET @cg_sql = CONCAT('ALTER TABLE `', p_table, '` DROP COLUMN `', p_col, '`');
    PREPARE cg_stmt FROM @cg_sql;
    EXECUTE cg_stmt;
    DEALLOCATE PREPARE cg_stmt;
  END IF;
END$$

-- `p_def` is the full index clause, e.g. 'INDEX idx_x (col(100))'.
CREATE PROCEDURE _cg_add_index(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_def   TEXT
)
BEGIN
  DECLARE v_idx INT DEFAULT 0;

  SELECT COUNT(*) INTO v_idx FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index;

  IF v_idx = 0 THEN
    SET @cg_sql = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_def);
    PREPARE cg_stmt FROM @cg_sql;
    EXECUTE cg_stmt;
    DEALLOCATE PREPARE cg_stmt;
  END IF;
END$$

DELIMITER ;


-- ===========================================================================
-- 1. Base tables — 000..005
-- ===========================================================================

CREATE TABLE IF NOT EXISTS programming_languages (
  programming_language INT NOT NULL PRIMARY KEY,
  language_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machinetest_data (
  practical_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  practical_name VARCHAR(255) NOT NULL,
  description TEXT,
  batch VARCHAR(255),
  event_id INT,
  status TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_practical_name (practical_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machinetest_io (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  practical_id INT NOT NULL,
  input TEXT,
  output TEXT,
  input_json TEXT,
  output_json TEXT,
  ishidden TINYINT(1) DEFAULT 0,
  INDEX idx_practical (practical_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machinetest_lan (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  practical_id INT NOT NULL,
  programming_language_id INT NOT NULL,
  INDEX idx_practical (practical_id),
  INDEX idx_lang (programming_language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS machine_submissions (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  submited_code TEXT,
  language VARCHAR(50),
  total_test_cases INT,
  passed_cases INT,
  prac_id INT,
  student_id INT,
  output TEXT,
  runTime VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prac (prac_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tpo_events (
  eventId INT AUTO_INCREMENT PRIMARY KEY,
  eventName VARCHAR(255),
  eventDescription VARCHAR(255),
  nameOfSpeaker VARCHAR(255),
  organizationOfSpeaker VARCHAR(255),
  locationOfSpeaker VARCHAR(255),
  date DATE,
  category VARCHAR(255),
  time TIME,
  department VARCHAR(255),
  eligible_degree_year VARCHAR(255),
  batch VARCHAR(25) DEFAULT NULL,
  isPaid BOOL DEFAULT NULL,
  cost INT DEFAULT NULL,
  paymentQR TEXT,
  banner TEXT,
  loaOfSpeaker TEXT,
  notice TEXT,
  eventDeadline DATETIME DEFAULT '3000-01-01',
  attendanceFlag BOOL DEFAULT FALSE,
  photosUploaded BOOL DEFAULT FALSE,
  isDeleted BOOL DEFAULT FALSE,
  isDead BOOL DEFAULT FALSE,
  eventPhotos TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tpo_event_registrations (
  reg_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  event_id INT,
  isApproved BOOLEAN DEFAULT FALSE,
  transaction_id VARCHAR(255) DEFAULT NULL,
  attended BOOLEAN DEFAULT FALSE,
  timeOfAttendance DATETIME DEFAULT NULL,
  INDEX idx_student (student_id),
  INDEX idx_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ===========================================================================
-- 2. LeetCode machine-test tables — must precede 006
-- ===========================================================================

CREATE TABLE IF NOT EXISTS machine_test_templates (
  id INT NOT NULL AUTO_INCREMENT,
  practical_id INT NOT NULL,
  programming_language_id INT NOT NULL,
  function_signature TEXT NOT NULL,
  function_name VARCHAR(128) NOT NULL,
  param_names JSON NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_prac_lang (practical_id, programming_language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 006_add_param_types_to_templates.sql
CALL _cg_add_column('machine_test_templates', 'param_types',  'JSON NULL',                  'param_names');
CALL _cg_add_column('machine_test_templates', 'return_type',  'VARCHAR(64) NULL',          'param_types');


-- ===========================================================================
-- 3. machinetest_io — LeetCode JSON columns, then nullable input/output
-- ===========================================================================

-- alter_machinetest_io_leetcode.sql
CALL _cg_add_column('machinetest_io', 'input_json',    'TEXT NULL',             'input');
CALL _cg_add_column('machinetest_io', 'expected_json', 'TEXT NULL',             'output');
CALL _cg_add_column('machinetest_io', 'is_leetcode',   'TINYINT(1) NOT NULL DEFAULT 0', 'ishidden');

-- alter_machinetest_io_nullable_input_output.sql
-- LeetCode cases carry their data in the *_json columns and store explicit
-- NULLs in the legacy ones, so NOT NULL here aborts practical creation.
CALL _cg_modify_column('machinetest_io', 'input',  'TEXT NULL');
CALL _cg_modify_column('machinetest_io', 'output', 'TEXT NULL');


-- ===========================================================================
-- 4. align_shared_tables_with_dump.sql
-- ===========================================================================

-- --- 4a. Primary-key renames ------------------------------------------------
-- The live DB renamed these to `id`; the dump (and the active code) uses the
-- original names. No foreign key references them in the live DB.
CALL _cg_rename_column('aptitude',                    'id', 'aid');
CALL _cg_rename_column('salary_slabs_policy',         'id', 'salad_id');
CALL _cg_rename_column('machinetest_lan',             'id', 'prac_language_id');
CALL _cg_rename_column('machinetest_io',              'id', 'prac_io_id');
CALL _cg_rename_column('student_mcq',                 'id', 'mid');
CALL _cg_rename_column('eligible_students_for_drive', 'id', 'esd_id');

-- --- 4b. aptitude: status + date_of_creation -------------------------------
CALL _cg_add_column('aptitude', 'status',            'tinyint(1) DEFAULT ''1''',            'title');
CALL _cg_add_column('aptitude', 'date_of_creation', 'datetime DEFAULT CURRENT_TIMESTAMP', 'status');

-- --- 4c. salary_slabs_policy: descs / min_sal / max_sal --------------------
CALL _cg_add_column('salary_slabs_policy', 'descs',   'varchar(255) DEFAULT NULL', 'salad_id');
CALL _cg_add_column('salary_slabs_policy', 'min_sal', 'double DEFAULT NULL',       'descs');
CALL _cg_add_column('salary_slabs_policy', 'max_sal', 'double DEFAULT NULL',       'min_sal');

-- --- 4d. machinetest_io: ishidden ------------------------------------------
CALL _cg_add_column('machinetest_io', 'ishidden', 'int DEFAULT ''0''', 'output');

-- --- 4e. student_mcq: status / time ----------------------------------------
CALL _cg_add_column('student_mcq', 'status', 'varchar(45) DEFAULT NULL',  'aid');
CALL _cg_add_column('student_mcq', 'time',   'varchar(255) DEFAULT NULL', 'status');

-- --- 4f. admin_read_timestamps: created_at ----------------------------------
CALL _cg_add_column('admin_read_timestamps', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'last_read_timestamp');

-- --- 4g. blacklist_student_company_mapping ---------------------------------
CALL _cg_add_column('blacklist_student_company_mapping', 'createDate',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'postid');
CALL _cg_add_column('blacklist_student_company_mapping', 'updatedDate',
  'timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP', 'createDate');

-- --- 4h. categories ---------------------------------------------------------
CALL _cg_add_column('categories', 'description', 'text',      'name');
CALL _cg_add_column('categories', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'description');

-- --- 4i. chats / intership_chats: file_url ---------------------------------
CALL _cg_add_column('chats', 'file_url', 'varchar(255) DEFAULT NULL', 'timestamp');
CALL _cg_add_column('intership_chats', 'file_url', 'varchar(255) DEFAULT NULL', 'timestamp');

-- --- 4j. drive_status: round5..round8 --------------------------------------
CALL _cg_add_column('drive_status', 'round5', 'varchar(255) DEFAULT NULL', 'placedStudent');
CALL _cg_add_column('drive_status', 'round6', 'varchar(255) DEFAULT NULL', 'round5');
CALL _cg_add_column('drive_status', 'round7', 'varchar(255) DEFAULT NULL', 'round6');
CALL _cg_add_column('drive_status', 'round8', 'varchar(255) DEFAULT NULL', 'round7');

-- --- 4k. hackathon_registrations -------------------------------------------
CALL _cg_add_column('hackathon_registrations', 'registration_date',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'hackathon_id');
CALL _cg_add_column('hackathon_registrations', 'status',
  'enum(''registered'',''withdrawn'',''completed'') DEFAULT ''registered''', 'registration_date');

-- --- 4l. intern_hr ----------------------------------------------------------
CALL _cg_add_column('intern_hr', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'company_id');
CALL _cg_add_column('intern_hr', 'updated_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'created_at');

-- --- 4m. interviews: status -------------------------------------------------
CALL _cg_add_column('interviews', 'status', 'varchar(255) DEFAULT NULL', 'title');

-- --- 4n. job_postings: drive_status ----------------------------------------
CALL _cg_add_column('job_postings', 'drive_status', 'int DEFAULT ''0''', 'company_type');

-- --- 4o. machine_submissions: created_at ------------------------------------
CALL _cg_add_column('machine_submissions', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'runTime');

-- --- 4p. machinetest_data: practical_name / pdf_url / status / batch --------
-- Split into per-column guarded adds. The source file issued all four in ONE
-- `ALTER`, which aborts entirely on a database where `001` already created
-- `practical_name` — taking `pdf_url` down with it.
CALL _cg_add_column('machinetest_data', 'practical_name', 'varchar(225) NOT NULL', 'practical_id');
CALL _cg_add_column('machinetest_data', 'pdf_url',         'varchar(255) DEFAULT NULL', 'description');
CALL _cg_add_column('machinetest_data', 'status',          'int DEFAULT ''1''', 'pdf_url');
CALL _cg_add_column('machinetest_data', 'batch',           'varchar(255) DEFAULT NULL', 'status');
-- Not in any source migration. `001` omits `title` and `align_shared_tables`
-- does not add it, so a database built only from these files would lack it.
CALL _cg_add_column('machinetest_data', 'title',           'varchar(255) DEFAULT NULL', 'practical_name');

-- --- 4q. mcqs / mcqs_b ------------------------------------------------------
CALL _cg_add_column('mcqs',   'user_ans',  'text',              'answer');
CALL _cg_add_column('mcqs',   'user_time', 'varchar(255) DEFAULT NULL', 'time_req');
CALL _cg_add_column('mcqs_b', 'user_ans',  'text',              'answer');
CALL _cg_add_column('mcqs_b', 'user_time', 'varchar(255) DEFAULT NULL', 'time_req');

-- --- 4r. placements ---------------------------------------------------------
CALL _cg_add_column('placements', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'updated_by');
CALL _cg_add_column('placements', 'updated_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'created_at');

-- --- 4s. practice_test_answers: created_at ----------------------------------
CALL _cg_add_column('practice_test_answers', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'answers');

-- --- 4t. prompts ------------------------------------------------------------
CALL _cg_add_column('prompts', 'prompt_text', 'text NOT NULL',  'subcategory_id');
CALL _cg_add_column('prompts', 'parameters',  'json DEFAULT NULL', 'prompt_text');
CALL _cg_add_column('prompts', 'created_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP', 'difficulty_level');
CALL _cg_add_column('prompts', 'updated_at',
  'timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'created_at');

-- --- 4u. student_details ----------------------------------------------------
CALL _cg_add_column('student_details', 'comp_id',         'int DEFAULT NULL',          'resume');
CALL _cg_add_column('student_details', 'post_id',         'int DEFAULT NULL',          'comp_id');
CALL _cg_add_column('student_details', 'ac_yr',           'varchar(255) DEFAULT NULL', 'post_id');
CALL _cg_add_column('student_details', 'isblacklisted',   'tinyint(1) DEFAULT ''0''',   'ac_yr');
CALL _cg_add_column('student_details', 'blackListedCount','int DEFAULT ''0''',          'isblacklisted');

-- --- 4v. subcategories: description ----------------------------------------
CALL _cg_add_column('subcategories', 'description', 'text', 'name');


-- ===========================================================================
-- 5. align_tpo_events_with_dump.sql
-- ===========================================================================
-- Event creation was failing with "Unknown column 'isOnline' in 'field list'".

CALL _cg_add_column('tpo_events', 'isOnline',          'tinyint(1) DEFAULT ''0''', 'cost');
CALL _cg_add_column('tpo_events', 'eventLink',         'varchar(255) DEFAULT NULL', 'isOnline');
CALL _cg_add_column('tpo_events', 'attendanceReport',  'text',    'photosUploaded');
CALL _cg_add_column('tpo_events', 'signedLOA',         'text',    'attendanceReport');


-- ===========================================================================
-- 6. add_ai_report_to_aptitude_tests.sql
-- ===========================================================================
-- The AI aptitude report is generated once per attempt (so it consumes Gemini
-- tokens once) and reused from then on.

CALL _cg_add_column('test_results',         'ai_report', 'LONGTEXT NULL', 'answers');
CALL _cg_add_column('practice_test_answers','ai_report', 'LONGTEXT NULL', 'answers');


-- ===========================================================================
-- 7. create_aptitude_report_cache.sql
-- ===========================================================================

CREATE TABLE IF NOT EXISTS aptitude_report_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  report LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ===========================================================================
-- 8. create_aptitude_test_questions.sql
-- ===========================================================================
-- Per-company (per aptitude test) question bank: questions are AI-generated
-- once per test and reused for every student taking that test.

CREATE TABLE IF NOT EXISTS aptitude_test_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aid INT NOT NULL,
  question TEXT,
  options TEXT,
  answer INT,
  solution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_aptitude_test_questions_aid (aid)
);


-- ===========================================================================
-- 9. add_roles_to_interview_details.sql
-- ===========================================================================
-- An admin can attach several roles to ONE interview setup. `role` keeps the
-- primary value for backward compatibility.

CALL _cg_add_column('interview_details', 'roles', 'JSON NULL', 'role');

-- Backfill so every existing setup is immediately multi-role ready.
-- The `roles` column was just ensured above, so this cannot reference a
-- missing column. `interview_details` itself is base-schema, not migration
-- owned, so guard on the table being present.
UPDATE `interview_details`
   SET `roles` = JSON_ARRAY(`role`)
 WHERE `roles` IS NULL;


-- ===========================================================================
-- 10. add_rounds_5_to_8.sql
-- ===========================================================================
-- Per-column rather than four `ALTER`s in one statement: the source file's
-- combined ALTER aborts wholesale on a database that already has any of them.

CALL _cg_add_column('round_mappings', 'round5', 'VARCHAR(255) NOT NULL DEFAULT ''Group Discussion'' COMMENT ''Name for the 5th round of the recruitment process''', NULL);
CALL _cg_add_column('round_mappings', 'round6', 'VARCHAR(255) NOT NULL DEFAULT ''Case Study''       COMMENT ''Name for the 6th round of the recruitment process''', NULL);
CALL _cg_add_column('round_mappings', 'round7', 'VARCHAR(255) NOT NULL DEFAULT ''Final Interview''  COMMENT ''Name for the 7th round of the recruitment process''', NULL);
CALL _cg_add_column('round_mappings', 'round8', 'VARCHAR(255) NOT NULL DEFAULT ''Documentation''    COMMENT ''Name for the 8th round of the recruitment process''', NULL);

UPDATE `round_mappings`
   SET round5 = 'Group Discussion',
       round6 = 'Case Study',
       round7 = 'Final Interview',
       round8 = 'Documentation'
 WHERE round5 IS NULL OR round6 IS NULL OR round7 IS NULL OR round8 IS NULL;


-- ===========================================================================
-- 11. add_solution_to_generated_mcqs.sql
-- ===========================================================================
-- `TEXT` cannot carry a literal default on MySQL 8 ("BLOB, TEXT, GEOMETRY or
-- JSON column can't have a default value"), so the column is added as NULL.
CALL _cg_add_column('generated_mcqs', 'solution', 'TEXT NULL', 'answer');
CALL _cg_add_index('generated_mcqs', 'idx_generated_mcqs_solution',
  'INDEX idx_generated_mcqs_solution (solution(100))');


-- ===========================================================================
-- 12. drop_is_active_from_interview_details.sql
-- ===========================================================================
-- `is_active` was an orphan duplicate of the canonical `isActive`; the admin
-- UI read one while the toggle endpoint wrote the other, so state diverged.
CALL _cg_drop_column('interview_details', 'is_active');


-- ===========================================================================
-- 13. Extra — interview_details columns the backend expects but no migration
--     in this window creates.
-- ===========================================================================
-- `scripts/migrator.js` adds these in `ensureInterviewColumns()`, but that only
-- runs on a database with no core tables, so an already-populated database
-- never receives them and the interview-duration bound silently does nothing.
CALL _cg_add_column('interview_details', 'max_duration_minutes', 'INT NULL',  NULL);
CALL _cg_add_column('interview_details', 'num_questions',       'INT NULL',  NULL);


-- ===========================================================================
-- 14. patch_local_test_data.sql — data patch
-- ===========================================================================
-- Row-level changes that were made by hand while fixing the "running code
-- shows no output" bugs, so a fresh environment lands in the same state.
-- Every statement is already guarded, so this is safe to re-run.
-- (Programming-language rows are NOT here on purpose: they live in
--  backend/seed/programming_languages.sql.)

-- Listings gate on INSTR(<item>.batch, student_details.degree_year). The local
-- test students have degree_year 2017 and 2027, so the fixtures admit both.
-- Each UPDATE appends 2027 only when absent, so re-running cannot produce
-- "2017,2027,2027".
UPDATE machinetest_data
   SET batch = CONCAT(batch, ',2027')
 WHERE practical_id = 10
   AND batch IS NOT NULL AND batch <> ''
   AND INSTR(CONCAT(',', REPLACE(batch, ' ', ''), ','), ',2027,') = 0;

UPDATE machinetest_data
   SET batch = CONCAT(batch, ',2027')
 WHERE practical_id = 11
   AND batch IS NOT NULL AND batch <> ''
   AND INSTR(CONCAT(',', REPLACE(batch, ' ', ''), ','), ',2027,') = 0;

UPDATE interview_details
   SET batch = CONCAT(batch, ',2027')
 WHERE id = 20
   AND batch IS NOT NULL AND batch <> ''
   AND INSTR(CONCAT(',', REPLACE(batch, ' ', ''), ','), ',2027,') = 0;

-- Expected output must match the return type. The admin form's "Expected JSON"
-- placeholder used to be a hardcoded `[0,1]` (a twoSum array), so scalar
-- answers were stored wrapped in an array — `int def(int a, int b)` with args
-- [5,6] was stored as `[11]`, which can never match the `11` the driver prints.
UPDATE machinetest_io SET expected_json = '11' WHERE practical_id = 11 AND expected_json = '[11]';
UPDATE machinetest_io SET expected_json = '7'  WHERE practical_id = 12 AND expected_json = '[7]';

-- Restore the language link and function signature for practical 11. The
-- orphan cleanup dropped machinetest_lan / machine_test_templates rows whose
-- programming_language_id no longer existed, leaving practical 11 with no
-- selectable language and no signature. 62 = Java (OpenJDK 13.0.1), the build
-- the configured Judge0 provides.
INSERT INTO machinetest_lan (practical_id, programming_language_id)
SELECT 11, 62
  FROM DUAL
 WHERE NOT EXISTS (
       SELECT 1 FROM machinetest_lan
        WHERE practical_id = 11 AND programming_language_id = 62);

INSERT INTO machine_test_templates
       (practical_id, programming_language_id, function_signature,
        function_name, param_names, param_types, return_type)
SELECT 11, 62, 'public int def(int a, int b)', 'def',
       JSON_ARRAY('a', 'b'), JSON_ARRAY('int', 'int'), 'int'
  FROM DUAL
 WHERE NOT EXISTS (
       SELECT 1 FROM machine_test_templates
        WHERE practical_id = 11 AND programming_language_id = 62);


-- ===========================================================================
-- 15. Re-point trigger DEFINERs at the connected account
-- ===========================================================================
-- The canonical dump ships `after_job_posting_insert` as
-- `DEFINER=`tpo`@`%``, and `trigger_bkp.sql` creates three more the same way.
-- Where the `tpo` account does not exist, MySQL still creates the trigger but
-- the first INSERT that fires it aborts with:
--     ERROR 1449: The user specified as a definer ('tpo'@'%') does not exist
-- which breaks `INSERT INTO job_postings` outright.
--
-- MySQL has no `ALTER TRIGGER ... DEFINER`, so each is dropped and recreated
-- with `DEFINER=CURRENT_USER` — always permitted, unlike naming another
-- account, which needs SUPER or SET_USER_ID. Bodies are verbatim.
--
-- Kept here as well as in migrations/trigger_definer_fix.sql so this file
-- alone leaves a working database, even though the dump already brought the
-- broken trigger along.
DROP TRIGGER IF EXISTS set_createdAt_before_insert_jobPost;
DROP TRIGGER IF EXISTS set_createdAt_before_insert_hackathon;
DROP TRIGGER IF EXISTS set_createdAt_before_insert_intershipPost;
DROP TRIGGER IF EXISTS after_job_posting_insert;

DELIMITER $$

CREATE DEFINER=CURRENT_USER TRIGGER `set_createdAt_before_insert_jobPost` BEFORE INSERT ON `job_postings` FOR EACH ROW BEGIN

        SET NEW.createdAt = NOW();

        SET NEW.updatedAt = NOW();

END$$

CREATE DEFINER=CURRENT_USER TRIGGER `set_createdAt_before_insert_hackathon` BEFORE INSERT ON `hackathons` FOR EACH ROW BEGIN

        SET NEW.created_at = NOW();
        SET NEW.updated_at = NOW();

END$$

CREATE DEFINER=CURRENT_USER TRIGGER `set_createdAt_before_insert_intershipPost` BEFORE INSERT ON `intership_postings` FOR EACH ROW BEGIN
        SET NEW.createdAt = NOW();
        SET NEW.updatedAt = NOW();
END$$

CREATE DEFINER=CURRENT_USER TRIGGER `after_job_posting_insert` AFTER INSERT ON `job_postings` FOR EACH ROW BEGIN

    INSERT INTO blacklist_student_company_mapping (sid, postid)
    SELECT
        sd.id AS sid,
        NEW.id AS postid
    FROM student_details sd
    WHERE
        sd.isblacklisted = 1
        AND sd.blackListedCount > 0
        AND sd.interested_in = 'Placement'
        AND sd.ssc_per >= NEW.criteria_10th
        AND (sd.hsc_per >= NEW.criteria_12th OR sd.diploma_per >= NEW.diploma_criteria)
        AND sd.degree_cgpa >= NEW.deg_criteria
        AND INSTR(TRIM(NEW.eligible_branches), TRIM(sd.branch)) > 0
        AND INSTR(TRIM(NEW.batch_date), TRIM(sd.degree_year)) > 0
        AND (NEW.gender = 'All' OR LOWER(NEW.gender) = LOWER(sd.gender))
        AND (
            (NEW.no_live_kt_check = 1 AND COALESCE(sd.live_kt_count,0) = 0)
            OR NEW.no_live_kt_check = 0
        )
        AND (
            (NEW.no_year_gap_check = 1 AND COALESCE(sd.years_gap,0) = 0)
            OR NEW.no_year_gap_check = 0
        );

    UPDATE student_details sd
    JOIN blacklist_student_company_mapping bsm
        ON bsm.sid = sd.id AND bsm.postid = NEW.id
    SET sd.blackListedCount = sd.blackListedCount - 1
    WHERE sd.blackListedCount > 0;

    UPDATE student_details sd
    JOIN blacklist_student_company_mapping bsm
        ON bsm.sid = sd.id AND bsm.postid = NEW.id
    SET sd.isblacklisted = 0
    WHERE sd.blackListedCount = 0;
END$$

DELIMITER ;


-- ---------------------------------------------------------------------------
-- Seed the current admission batch
-- ---------------------------------------------------------------------------
-- `current_batch` is read as a scalar subquery in ~38 queries across the
-- dashboards, ERP/drive reports, announcement mailers and drive-status
-- filters. Nothing in the codebase ever writes to it and tpoStructure.sql ships
-- the CREATE TABLE with no rows, so on a dump-built database the table is empty
-- and every one of those subqueries silently evaluates to NULL — reports return
-- nothing with no error.
--
-- Event creation failed outright on the same empty table: getCurrentBatch()
-- read `row[0].batch` with no check that a row existed.
--
-- 2024 matches student_details.degree_year here. To use a different admission
-- batch: UPDATE current_batch SET batch = 2027 WHERE batch_id = 1;
INSERT INTO current_batch (batch_id, batch)
SELECT 1, 2024
  FROM DUAL
 WHERE NOT EXISTS (SELECT 1 FROM current_batch WHERE batch_id = 1);


-- ---------------------------------------------------------------------------
-- Clean up the helper procedures
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS _cg_add_column;
DROP PROCEDURE IF EXISTS _cg_rename_column;
DROP PROCEDURE IF EXISTS _cg_modify_column;
DROP PROCEDURE IF EXISTS _cg_drop_column;
DROP PROCEDURE IF EXISTS _cg_add_index;

SELECT 'collective migration 2026-09-20..2026-09-26 complete' AS result;
