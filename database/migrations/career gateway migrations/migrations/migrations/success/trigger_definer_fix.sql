-- Re-point every trigger DEFINER at the account that is actually connected.
--
-- Why this is needed
--   `trigger_bkp.sql` creates its triggers as `DEFINER=`tpo`@`%``, and the
--   canonical dump ships `after_job_posting_insert` the same way. When the
--   `tpo` account does not exist in the target MySQL — which is the case on
--   every environment except the original one — MySQL still *creates* the
--   trigger, but the first INSERT that fires it fails:
--
--     ERROR 1449 (HY000): The user specified as a definer ('tpo'@'%')
--     does not exist
--
--   That breaks the whole job-posting flow, not just the trigger: an
--   `INSERT INTO job_postings` aborts before the row is written. It stayed
--   hidden because the triggers only got created once the migration run
--   reached `trigger_bkp.sql`.
--
-- The fix
--   MySQL has no `ALTER TRIGGER ... DEFINER`, so each trigger is dropped and
--   recreated with `DEFINER=CURRENT_USER`. `CURRENT_USER` is always
--   permitted — unlike naming another account, this needs no SUPER or
--   SET_USER_ID privilege, so it works for the least-privileged migration user
--   as well as an admin.
--
--   The four trigger bodies are reproduced verbatim from the database, so the
--   behaviour is unchanged. `after_job_posting_insert` is not in
--   `trigger_bkp.sql`; it arrives with the dump, so it is fixed here too.
--
-- Ordering
--   Named to sort immediately after `trigger_bkp.sql` ('b' < 'd'), because that
--   file recreates three of these with the broken definer. Running first would
--   simply be undone by it.
--
-- Idempotent
--   `DROP TRIGGER IF EXISTS` then `CREATE` — safe to run repeatedly.

DROP TRIGGER IF EXISTS set_createdAt_before_insert_jobPost;
DROP TRIGGER IF EXISTS set_createdAt_before_insert_hackathon;
DROP TRIGGER IF EXISTS set_createdAt_before_insert_intershipPost;
DROP TRIGGER IF EXISTS after_job_posting_insert;

CREATE DEFINER=CURRENT_USER TRIGGER `set_createdAt_before_insert_jobPost` BEFORE INSERT ON `job_postings` FOR EACH ROW BEGIN

        SET NEW.createdAt = NOW();

        SET NEW.updatedAt = NOW();

END

CREATE DEFINER=CURRENT_USER TRIGGER `set_createdAt_before_insert_hackathon` BEFORE INSERT ON `hackathons` FOR EACH ROW BEGIN

        SET NEW.created_at = NOW();
        SET NEW.updated_at = NOW();

END

CREATE DEFINER=CURRENT_USER TRIGGER `set_createdAt_before_insert_intershipPost` BEFORE INSERT ON `intership_postings` FOR EACH ROW BEGIN
        SET NEW.createdAt = NOW();
        SET NEW.updatedAt = NOW();
END

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
END
