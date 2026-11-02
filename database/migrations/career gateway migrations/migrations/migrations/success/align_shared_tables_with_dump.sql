-- Align shared tables with the canonical dump (tpoStructure.sql — single source
-- of truth). For every table present in BOTH the dump and the live DB, this adds
-- every dump column missing from the live table (types/defaults/position from
-- the dump) without touching app-added extras.
--
-- Part 1: rename live PK columns back to the dump's PK names. The live DB
-- renamed these columns to `id`; the dump (and active code) uses the original
-- names, so these renames fix real breakage:
--   aptitude.id                    -> aid          (code: JOIN .. ON a.aid)
--   salary_slabs_policy.id         -> salad_id     (code: DELETE .. WHERE salad_id; JOIN j.salad_id = sp.salad_id; frontend slab.salad_id)
--   machinetest_lan.id             -> prac_language_id (frontend codingEnv: lang.prac_language_id)
--   machinetest_io.id              -> prac_io_id   (dump PK)
--   student_mcq.id                 -> mid          (dump PK)
--   eligible_students_for_drive.id -> esd_id       (dump PK)
--
-- No foreign keys reference any of these columns in the live DB (verified via
-- information_schema), and no code references the live `id` names on these
-- tables, so the renames are safe.

-- aptitude: rename PK, add status + date_of_creation (dump positions after title)
ALTER TABLE `aptitude`
  RENAME COLUMN `id` TO `aid`,
  ADD COLUMN `status` tinyint(1) DEFAULT '1' AFTER `title`,
  ADD COLUMN `date_of_creation` datetime DEFAULT CURRENT_TIMESTAMP AFTER `status`;

-- salary_slabs_policy: rename PK, add descs / min_sal / max_sal
ALTER TABLE `salary_slabs_policy`
  RENAME COLUMN `id` TO `salad_id`,
  ADD COLUMN `descs` varchar(255) DEFAULT NULL AFTER `salad_id`,
  ADD COLUMN `min_sal` double DEFAULT NULL AFTER `descs`,
  ADD COLUMN `max_sal` double DEFAULT NULL AFTER `min_sal`;

-- machinetest_lan: rename PK to prac_language_id (no other missing columns)
ALTER TABLE `machinetest_lan`
  RENAME COLUMN `id` TO `prac_language_id`;

-- machinetest_io: rename PK + add ishidden (code/frontend use ishidden)
ALTER TABLE `machinetest_io`
  RENAME COLUMN `id` TO `prac_io_id`,
  ADD COLUMN `ishidden` int DEFAULT '0' AFTER `output`;

-- student_mcq: rename PK + add status / time
ALTER TABLE `student_mcq`
  RENAME COLUMN `id` TO `mid`,
  ADD COLUMN `status` varchar(45) DEFAULT NULL AFTER `aid`,
  ADD COLUMN `time` varchar(255) DEFAULT NULL AFTER `status`;

-- eligible_students_for_drive: rename PK to esd_id (code uses only stud_clg_id)
ALTER TABLE `eligible_students_for_drive`
  RENAME COLUMN `id` TO `esd_id`;

-- ---------------------------------------------------------------------------
-- Part 2: add missing dump columns (one ALTER per table, dump positions).
-- ---------------------------------------------------------------------------

-- admin_read_timestamps: add created_at (after last_read_timestamp)
ALTER TABLE `admin_read_timestamps`
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `last_read_timestamp`;

-- blacklist_student_company_mapping: add createDate / updatedDate
ALTER TABLE `blacklist_student_company_mapping`
  ADD COLUMN `createDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `postid`,
  ADD COLUMN `updatedDate` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER `createDate`;

-- categories: add description + created_at
ALTER TABLE `categories`
  ADD COLUMN `description` text AFTER `name`,
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `description`;

-- chats: add file_url (code INSERT/SELECT file_url)
ALTER TABLE `chats`
  ADD COLUMN `file_url` varchar(255) DEFAULT NULL AFTER `timestamp`;

-- intership_chats: add file_url (code INSERT file_url)
ALTER TABLE `intership_chats`
  ADD COLUMN `file_url` varchar(255) DEFAULT NULL AFTER `timestamp`;

-- drive_status: add round5..round8 (code SELECT/INSERT round5-8)
ALTER TABLE `drive_status`
  ADD COLUMN `round5` varchar(255) DEFAULT NULL AFTER `placedStudent`,
  ADD COLUMN `round6` varchar(255) DEFAULT NULL AFTER `round5`,
  ADD COLUMN `round7` varchar(255) DEFAULT NULL AFTER `round6`,
  ADD COLUMN `round8` varchar(255) DEFAULT NULL AFTER `round7`;

-- hackathon_registrations: add registration_date + status (code uses both)
ALTER TABLE `hackathon_registrations`
  ADD COLUMN `registration_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `hackathon_id`,
  ADD COLUMN `status` enum('registered','withdrawn','completed') DEFAULT 'registered' AFTER `registration_date`;

-- intern_hr: add created_at / updated_at (a) (live also keeps app-added createdAt/updatedAt)
ALTER TABLE `intern_hr`
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `company_id`,
  ADD COLUMN `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- interviews: add status (dump has it; our AI interview table is otherwise a superset)
ALTER TABLE `interviews`
  ADD COLUMN `status` varchar(255) DEFAULT NULL AFTER `title`;

-- job_postings: add drive_status (code: coalesce(jp.drive_status,0), j.drive_status)
ALTER TABLE `job_postings`
  ADD COLUMN `drive_status` int DEFAULT '0' AFTER `company_type`;

-- machine_submissions: add created_at (dump position after runTime)
ALTER TABLE `machine_submissions`
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `runTime`;

-- machinetest_data: add practical_name / pdf_url / status / batch (code uses all)
ALTER TABLE `machinetest_data`
  ADD COLUMN `practical_name` varchar(225) NOT NULL AFTER `practical_id`,
  ADD COLUMN `pdf_url` varchar(255) DEFAULT NULL AFTER `description`,
  ADD COLUMN `status` int DEFAULT '1' AFTER `pdf_url`,
  ADD COLUMN `batch` varchar(255) DEFAULT NULL AFTER `status`;

-- mcqs: add user_ans / user_time (reports use user_ans = answer; frontend aptitudeDetails uses user_ans/user_time)
ALTER TABLE `mcqs`
  ADD COLUMN `user_ans` text AFTER `answer`,
  ADD COLUMN `user_time` varchar(255) DEFAULT NULL AFTER `time_req`;

-- mcqs_b: add user_ans / user_time (same as mcqs)
ALTER TABLE `mcqs_b`
  ADD COLUMN `user_ans` text AFTER `answer`,
  ADD COLUMN `user_time` varchar(255) DEFAULT NULL AFTER `time_req`;

-- placements: add created_at / updated_at (dump names; live keeps app-added createdAt/updatedAt)
ALTER TABLE `placements`
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `updated_by`,
  ADD COLUMN `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- practice_test_answers: add created_at (dump has created_at + started_at; live has started_at + submitted_at)
ALTER TABLE `practice_test_answers`
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `answers`;

-- prompts: add prompt_text / parameters / created_at / updated_at (frontend TestGeneration reads prompt.prompt_text)
ALTER TABLE `prompts`
  ADD COLUMN `prompt_text` text NOT NULL AFTER `subcategory_id`,
  ADD COLUMN `parameters` json DEFAULT NULL AFTER `prompt_text`,
  ADD COLUMN `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP AFTER `difficulty_level`,
  ADD COLUMN `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- student_details: add comp_id / post_id / ac_yr / isblacklisted / blackListedCount
-- (code: register.js INSERT ac_yr; adminDashboard sd.ac_yr; reports isblacklisted)
ALTER TABLE `student_details`
  ADD COLUMN `comp_id` int DEFAULT NULL AFTER `resume`,
  ADD COLUMN `post_id` int DEFAULT NULL AFTER `comp_id`,
  ADD COLUMN `ac_yr` varchar(255) DEFAULT NULL AFTER `post_id`,
  ADD COLUMN `isblacklisted` tinyint(1) DEFAULT '0' AFTER `ac_yr`,
  ADD COLUMN `blackListedCount` int DEFAULT '0' AFTER `isblacklisted`;

-- subcategories: add description (prompts/categories practice-test module)
ALTER TABLE `subcategories`
  ADD COLUMN `description` text AFTER `name`;