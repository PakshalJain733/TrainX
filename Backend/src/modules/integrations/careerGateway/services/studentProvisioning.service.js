import { pool, query } from '../../../../config/db.js';
import { createAccountActivation, sendActivationEmail } from './accountActivation.service.js';
import { invalidateUserAuthCache, revokeUserAuthInCache } from '../../../../middleware/auth.middleware.js';
import { disconnectUserSockets } from '../../../../socket/interview.socket.js';

/**
 * Resolves a TrainX college tenant strictly from dedicated college identifiers (TENANT-01).
 * Never uses student's institutional registration (clg_id) as a college identifier.
 * Never silently falls back to DEFAULT_COLLEGE_ID in production.
 * Rejects missing, unresolved, or ambiguous colleges with HTTP 422.
 */
export async function resolveCollegeTenant(studentData, options = {}, conn = null) {
  const executeQuery = conn
    ? async (sql, params) => {
        const safeParams = (params || []).map((p) => (p === undefined ? null : p));
        const [results] = await conn.execute(sql, safeParams);
        return results;
      }
    : query;

  // 1. Explicit college ID passed via options/caller
  if (options.collegeId) {
    const colId = parseInt(options.collegeId, 10);
    const rows = await executeQuery('SELECT id FROM colleges WHERE id = ? LIMIT 1', [colId]);
    if (rows && rows.length > 0) return rows[0].id;
    const err = new Error(`College ID ${options.collegeId} specified in options was not found`);
    err.statusCode = 422;
    throw err;
  }

  // 2. Dedicated college identifiers (CRITICAL: NEVER inspect studentData.clg_id)
  const explicitCgCollegeId = studentData.career_gateway_college_id;
  const explicitCollegeId = studentData.college_id;
  const collegeCode = studentData.college_code;
  const collegeName = studentData.college;

  // Resolve by dedicated career_gateway_college_id
  if (explicitCgCollegeId !== undefined && explicitCgCollegeId !== null && String(explicitCgCollegeId).trim() !== '') {
    const trimmed = String(explicitCgCollegeId).trim();
    const rows = await executeQuery(
      'SELECT id FROM colleges WHERE career_gateway_college_id = ? OR id = ? LIMIT 2',
      [trimmed, isNaN(Number(trimmed)) ? -1 : Number(trimmed)]
    );
    if (rows.length === 1) return rows[0].id;
    if (rows.length > 1) {
      const err = new Error(`Ambiguous college: career_gateway_college_id '${explicitCgCollegeId}' matched multiple colleges`);
      err.statusCode = 422;
      throw err;
    }
  }

  // Resolve by dedicated college_id
  if (explicitCollegeId !== undefined && explicitCollegeId !== null && String(explicitCollegeId).trim() !== '') {
    const trimmed = String(explicitCollegeId).trim();
    const rows = await executeQuery(
      'SELECT id FROM colleges WHERE id = ? OR career_gateway_college_id = ? LIMIT 2',
      [isNaN(Number(trimmed)) ? -1 : Number(trimmed), trimmed]
    );
    if (rows.length === 1) return rows[0].id;
    if (rows.length > 1) {
      const err = new Error(`Ambiguous college: college_id '${explicitCollegeId}' matched multiple colleges`);
      err.statusCode = 422;
      throw err;
    }
  }

  // Resolve by college_code
  if (collegeCode && String(collegeCode).trim()) {
    const trimmed = String(collegeCode).trim();
    const rows = await executeQuery(
      'SELECT id FROM colleges WHERE UPPER(code) = UPPER(?) LIMIT 2',
      [trimmed]
    );
    if (rows.length === 1) return rows[0].id;
    if (rows.length > 1) {
      const err = new Error(`Ambiguous college: college_code '${collegeCode}' matched multiple colleges`);
      err.statusCode = 422;
      throw err;
    }
  }

  // Resolve by uniquely validated college name
  if (collegeName && String(collegeName).trim()) {
    const trimmed = String(collegeName).trim();
    const exactRows = await executeQuery(
      'SELECT id FROM colleges WHERE UPPER(name) = UPPER(?) LIMIT 2',
      [trimmed]
    );
    if (exactRows.length === 1) return exactRows[0].id;
    if (exactRows.length > 1) {
      const err = new Error(`Ambiguous college: name '${trimmed}' matched multiple colleges`);
      err.statusCode = 422;
      throw err;
    }

    const likeRows = await executeQuery(
      'SELECT id FROM colleges WHERE UPPER(name) LIKE UPPER(?) LIMIT 2',
      [`%${trimmed}%`]
    );
    if (likeRows.length === 1) return likeRows[0].id;
    if (likeRows.length > 1) {
      const err = new Error(`Ambiguous college: name pattern '${trimmed}' matched multiple colleges`);
      err.statusCode = 422;
      throw err;
    }
  }

  // TENANT-01: Reject unresolved or missing college tenant with HTTP 422
  // Silent fallback to DEFAULT_COLLEGE_ID or first college is strictly prohibited
  const unresolvable = explicitCgCollegeId || explicitCollegeId || collegeCode || collegeName || 'missing';
  const err = new Error(
    `Unresolved college tenant: '${unresolvable}'. A valid college_id, career_gateway_college_id, college_code, or unique college name is required.`
  );
  err.statusCode = 422;
  throw err;
}

/**
 * Resolves or associates an incoming student with an explicit TrainX batch.
 * Accepts optional transaction connection `conn` for transactional atomicity (DATA-02).
 */
export async function resolveAndAssignBatch(userId, requestedBatch, collegeId, departmentId, conn = null) {
  const executeQuery = conn
    ? async (sql, params) => {
        const safeParams = (params || []).map((p) => (p === undefined ? null : p));
        const [results] = await conn.execute(sql, safeParams);
        return results;
      }
    : query;

  if (!requestedBatch || String(requestedBatch).trim().length === 0) {
    return { batchId: null, status: 'no_batch_specified' };
  }

  const rawBatch = String(requestedBatch).trim();

  // Search batches within this college tenant
  const matchedBatches = await executeQuery(
    `SELECT id, name FROM batches 
     WHERE college_id = ? AND (
       UPPER(name) = UPPER(?) OR 
       UPPER(name) LIKE UPPER(?) OR
       id = ?
     ) LIMIT 1`,
    [collegeId, rawBatch, `%${rawBatch}%`, isNaN(Number(rawBatch)) ? -1 : Number(rawBatch)]
  );

  const matchedBatch = matchedBatches[0] || null;

  if (!matchedBatch) {
    return { batchId: null, status: 'unmatched', requested: rawBatch };
  }

  // Create association in student_batches
  await executeQuery(
    `INSERT INTO student_batches (user_id, batch_id) 
     VALUES (?, ?) 
     ON DUPLICATE KEY UPDATE created_at = created_at`,
    [userId, matchedBatch.id]
  );

  return { batchId: matchedBatch.id, batchName: matchedBatch.name, status: 'assigned' };
}

/**
 * Service to process single or bulk student provisioning from Career Gateway.
 * Fully transactional (DATA-02), preserves institutional roll numbers (DATA-01),
 * enforces dedicated tenant resolution (TENANT-01), and provides immediate revocation invalidation (SEC-01).
 */
export async function provisionStudentFromCareerGateway(studentData, options = {}) {
  const { triggerEmail = true } = options;

  const externalStudentId = parseInt(studentData.student_id || studentData.id, 10);
  if (!externalStudentId || isNaN(externalStudentId)) {
    throw new Error('Missing or invalid required field: student_id');
  }

  const email = String(studentData.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('Missing or invalid student email');
  }

  // Acquire dedicated connection from pool for transaction management (DATA-02)
  const connection = await pool.getConnection();
  const executeQuery = async (sql, params) => {
    const safeParams = (params || []).map((p) => (p === undefined ? null : p));
    const [results] = await connection.execute(sql, safeParams);
    return results;
  };

  const pendingPostCommitActions = [];

  try {
    await connection.beginTransaction();

    // 1. Resolve College Tenant strictly without fallback (TENANT-01)
    const targetCollegeId = await resolveCollegeTenant(studentData, options, connection);

    // 2. Extract canonical fields
    // DATA-01: Treat clg_id and roll_number as independent fields
    const clgId = studentData.clg_id ? String(studentData.clg_id).trim() : null;
    const explicitRollNumber = (studentData.roll_number || studentData.roll_no)
      ? String(studentData.roll_number || studentData.roll_no).trim()
      : null;

    const requestedBatch = studentData.batch || null;
    const name = String(studentData.name || email.split('@')[0]).trim();
    const mobile = studentData.mobile ? String(studentData.mobile).trim() : null;
    const departmentName = studentData.department || studentData.branch || 'General';
    const division = studentData.division || 'A';
    const year = studentData.year || studentData.degree_year || 'TE';
    const semester = studentData.semester || 'Semester 5';
    const cgpa = studentData.cgpa ? parseFloat(studentData.cgpa) : 8.5;
    const liveKt = parseInt(studentData.live_kt, 10) || 0;
    const deadKt = parseInt(studentData.dead_kt, 10) || 0;
    const placementStatus = studentData.placement_status || 'Unplaced';
    const placedCompany = studentData.placed_company || null;
    const linkedinUrl = studentData.linkedin_url || null;
    const portfolioLink = studentData.portfolio_link || null;
    const isEligible = studentData.eligible !== false; // defaults to true unless explicitly false

    // 3. Resolve Department within College Tenant
    let departmentId = null;
    try {
      const depts = await executeQuery(
        `SELECT id FROM departments 
         WHERE college_id = ? AND (UPPER(code) = UPPER(?) OR UPPER(name) LIKE UPPER(?))
         LIMIT 1`,
        [targetCollegeId, departmentName, `%${departmentName}%`]
      );
      if (depts && depts.length > 0) {
        departmentId = depts[0].id;
      }
    } catch (_) {}

    // 4. Check for existing mapping by Career Gateway Student ID
    const mappings = await executeQuery(
      'SELECT id, trainx_user_id, eligibility_status, clg_id, assigned_batch FROM career_gateway_student_mappings WHERE career_gateway_student_id = ? LIMIT 1',
      [externalStudentId]
    );
    const existingMapping = mappings[0] || null;

    let userId;
    let statusResult;
    let batchResolution = { status: 'none' };

    if (existingMapping) {
      // =========================================================================
      // SCENARIO 1: Existing Career Gateway-linked student: IDEMPOTENT UPDATE
      // =========================================================================
      userId = existingMapping.trainx_user_id;

      const newEligibility = isEligible ? 'eligible' : 'revoked';
      const isReactivating = existingMapping.eligibility_status === 'revoked' && isEligible;

      // Query current student profile to preserve existing institutional roll_number (DATA-01)
      const existingStudents = await executeQuery(
        'SELECT roll_number, clg_id FROM students WHERE user_id = ? LIMIT 1',
        [userId]
      );
      const existingStudent = existingStudents[0] || null;

      // DATA-01: Preserve existing roll_number if not explicitly provided in this update
      const targetRollNumber = explicitRollNumber !== null
        ? explicitRollNumber
        : (existingStudent?.roll_number || null);

      // DATA-01: Update clg_id independently
      const targetClgId = clgId !== null
        ? clgId
        : (existingStudent?.clg_id || existingMapping.clg_id || null);

      // Update Mapping
      await executeQuery(
        `UPDATE career_gateway_student_mappings
         SET eligibility_status = ?, clg_id = ?, assigned_batch = COALESCE(?, assigned_batch),
             last_synced_at = NOW(), revoked_at = ?
         WHERE id = ?`,
        [newEligibility, targetClgId, requestedBatch, isEligible ? null : new Date(), existingMapping.id]
      );

      // Check if existing user account has never completed password activation
      const userRows = await executeQuery('SELECT password_hash, is_active FROM users WHERE id = ? LIMIT 1', [userId]);
      const currentTargetUser = userRows[0] || null;
      const isUnactivated = !currentTargetUser || !currentTargetUser.password_hash || String(currentTargetUser.password_hash).trim().length === 0;

      // Update User record (PRESERVES EXISTING password_hash and role)
      await executeQuery(
        `UPDATE users
         SET name = ?, mobile_number = COALESCE(?, mobile_number), is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, mobile, isEligible ? (isUnactivated ? 0 : 1) : 0, userId]
      );

      // If existing user account is still unactivated, generate fresh activation token
      if (isUnactivated && isEligible) {
        const { rawToken } = await createAccountActivation(userId, {}, connection);
        if (triggerEmail) {
          pendingPostCommitActions.push(() => {
            sendActivationEmail({ to: email, name, rawToken }).catch((err) => {
              console.warn(`[Activation] Async email trigger failed for ${email}: ${err.message}`);
            });
          });
        }
      }

      // Update Student Profile with preserved roll_number and independent clg_id
      await executeQuery(
        `UPDATE students
         SET clg_id = ?, department = ?, department_id = COALESCE(?, department_id),
             roll_number = ?, division = ?, year = ?, semester = ?, cgpa = ?, live_kt = ?, dead_kt = ?,
             placement_status = ?, placed_company = ?, linkedin_url = ?, portfolio_link = ?,
             last_synced_at = NOW()
         WHERE user_id = ?`,
        [
          targetClgId, departmentName, departmentId, targetRollNumber, division, year, semester, cgpa,
          liveKt, deadKt, placementStatus, placedCompany, linkedinUrl, portfolioLink,
          userId
        ]
      );

      // Resolve and assign requested batch if specified
      if (requestedBatch) {
        batchResolution = await resolveAndAssignBatch(userId, requestedBatch, targetCollegeId, departmentId, connection);
        if (batchResolution.batchId) {
          await executeQuery('UPDATE students SET batch_id = ? WHERE user_id = ?', [batchResolution.batchId, userId]);
        }
      }

      // If user was revoked, immediately revoke cache and terminate live sockets
      if (!isEligible) {
        pendingPostCommitActions.push(() => {
          revokeUserAuthInCache(userId);
          disconnectUserSockets(userId, 'Student eligibility revoked by Career Gateway');
        });
      } else if (isReactivating) {
        pendingPostCommitActions.push(() => {
          invalidateUserAuthCache(userId);
        });
      }

      statusResult = isReactivating ? 'reactivated' : 'updated';
    } else {
      // =========================================================================
      // SCENARIO 2: Check if user already exists by email (Safe Reconciliation)
      // =========================================================================
      const usersByEmail = await executeQuery(
        'SELECT id, career_gateway_student_id, role, password_hash, is_active FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      const existingUserByEmail = usersByEmail[0] || null;

      if (existingUserByEmail) {
        userId = existingUserByEmail.id;

        // Prevent cross-linking: one TrainX user cannot be re-linked to a different external student ID
        if (
          existingUserByEmail.career_gateway_student_id &&
          Number(existingUserByEmail.career_gateway_student_id) !== externalStudentId
        ) {
          const err = new Error(
            `Conflict: Account with email ${email} is already linked to Career Gateway Student ID ${existingUserByEmail.career_gateway_student_id}`
          );
          err.statusCode = 409;
          throw err;
        }

        // Query existing student profile to preserve existing roll_number (DATA-01)
        const existingStudents = await executeQuery(
          'SELECT roll_number, clg_id FROM students WHERE user_id = ? LIMIT 1',
          [userId]
        );
        const existingStudent = existingStudents[0] || null;

        const targetRollNumber = explicitRollNumber !== null
          ? explicitRollNumber
          : (existingStudent?.roll_number || `CG-${externalStudentId}`);

        const targetClgId = clgId !== null
          ? clgId
          : (existingStudent?.clg_id || null);

        // Link user to Career Gateway ID (preserves password_hash and role)
        await executeQuery(
          `UPDATE users
           SET career_gateway_student_id = ?, source_system = 'career_gateway',
               provisioned_at = COALESCE(provisioned_at, NOW()), updated_at = NOW()
           WHERE id = ?`,
          [externalStudentId, userId]
        );

        // Upsert mapping record
        await executeQuery(
          `INSERT INTO career_gateway_student_mappings
           (trainx_user_id, career_gateway_student_id, clg_id, assigned_batch, source_system, eligibility_status, provisioned_at, last_synced_at)
           VALUES (?, ?, ?, ?, 'career_gateway', ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             career_gateway_student_id = VALUES(career_gateway_student_id),
             clg_id = VALUES(clg_id),
             assigned_batch = VALUES(assigned_batch),
             eligibility_status = VALUES(eligibility_status),
             last_synced_at = NOW()`,
          [userId, externalStudentId, targetClgId, requestedBatch, isEligible ? 'eligible' : 'revoked']
        );

        // Upsert student record preserving existing roll_number
        await executeQuery(
          `INSERT INTO students (
             user_id, career_gateway_student_id, source_system, college_id, department_id,
             clg_id, roll_number, mobile_number, department, year, division, semester, cgpa,
             live_kt, dead_kt, placement_status, placed_company, linkedin_url, portfolio_link, last_synced_at
           )
           VALUES (?, ?, 'career_gateway', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             career_gateway_student_id = VALUES(career_gateway_student_id),
             clg_id = VALUES(clg_id),
             roll_number = VALUES(roll_number),
             department = VALUES(department),
             department_id = COALESCE(VALUES(department_id), department_id),
             year = VALUES(year),
             division = VALUES(division),
             semester = VALUES(semester),
             cgpa = VALUES(cgpa),
             last_synced_at = NOW()`,
          [
            userId, externalStudentId, targetCollegeId, departmentId,
            targetClgId, targetRollNumber, mobile, departmentName, year, division, semester, cgpa,
            liveKt, deadKt, placementStatus, placedCompany, linkedinUrl, portfolioLink
          ]
        );

        // Batch assignment
        if (requestedBatch) {
          batchResolution = await resolveAndAssignBatch(userId, requestedBatch, targetCollegeId, departmentId, connection);
          if (batchResolution.batchId) {
            await executeQuery('UPDATE students SET batch_id = ? WHERE user_id = ?', [batchResolution.batchId, userId]);
          }
        }

        // If existing user account has never completed password activation, generate activation token
        const isEmailUserUnactivated = !existingUserByEmail.password_hash || String(existingUserByEmail.password_hash).trim().length === 0;
        if (isEmailUserUnactivated && isEligible) {
          const { rawToken } = await createAccountActivation(userId, {}, connection);
          if (triggerEmail) {
            pendingPostCommitActions.push(() => {
              sendActivationEmail({ to: email, name, rawToken }).catch((err) => {
                console.warn(`[Activation] Async email trigger failed for ${email}: ${err.message}`);
              });
            });
          }
        }

        if (!isEligible) {
          pendingPostCommitActions.push(() => {
            revokeUserAuthInCache(userId);
            disconnectUserSockets(userId, 'Student eligibility revoked by Career Gateway');
          });
        }

        statusResult = 'linked_existing_account';
      } else {
        // =========================================================================
        // SCENARIO 3: Brand New Student Provisioning
        // =========================================================================
        const targetRollNumber = explicitRollNumber !== null
          ? explicitRollNumber
          : `CG-${externalStudentId}`;

        // Create user with password_hash = NULL, is_active = 0 (pending activation)
        // Uses LAST_INSERT_ID(id) to ensure atomic idempotency under concurrent duplicate provisioning
        const userInsert = await executeQuery(
          `INSERT INTO users (
             name, email, mobile_number, role, college_id, career_gateway_student_id,
             source_system, password_hash, is_active, is_verified, is_approved, provisioned_at
           )
           VALUES (?, ?, ?, 'student', ?, ?, 'career_gateway', NULL, 0, 0, 1, NOW())
           ON DUPLICATE KEY UPDATE
             id = LAST_INSERT_ID(id),
             career_gateway_student_id = VALUES(career_gateway_student_id),
             source_system = 'career_gateway',
             updated_at = NOW()`,
          [name, email, mobile, targetCollegeId, externalStudentId]
        );
        userId = userInsert.insertId;

        // Batch assignment if specified
        let assignedBatchId = null;
        if (requestedBatch) {
          batchResolution = await resolveAndAssignBatch(userId, requestedBatch, targetCollegeId, departmentId, connection);
          assignedBatchId = batchResolution.batchId;
        }

        // Create student profile storing clg_id independently from roll_number
        await executeQuery(
          `INSERT INTO students (
             user_id, career_gateway_student_id, source_system, college_id, department_id, batch_id,
             clg_id, roll_number, mobile_number, department, year, division, semester, cgpa,
             live_kt, dead_kt, placement_status, placed_company, linkedin_url, portfolio_link, last_synced_at
           )
           VALUES (?, ?, 'career_gateway', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             career_gateway_student_id = VALUES(career_gateway_student_id),
             clg_id = VALUES(clg_id),
             roll_number = VALUES(roll_number),
             batch_id = COALESCE(VALUES(batch_id), batch_id),
             department = VALUES(department),
             department_id = COALESCE(VALUES(department_id), department_id),
             year = VALUES(year),
             division = VALUES(division),
             semester = VALUES(semester),
             cgpa = VALUES(cgpa),
             last_synced_at = NOW()`,
          [
            userId, externalStudentId, targetCollegeId, departmentId, assignedBatchId,
            clgId, targetRollNumber, mobile, departmentName, year, division, semester, cgpa,
            liveKt, deadKt, placementStatus, placedCompany, linkedinUrl, portfolioLink
          ]
        );

        // Create mapping record
        await executeQuery(
          `INSERT INTO career_gateway_student_mappings
           (trainx_user_id, career_gateway_student_id, clg_id, assigned_batch, source_system, eligibility_status, provisioned_at, last_synced_at)
           VALUES (?, ?, ?, ?, 'career_gateway', ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE
             career_gateway_student_id = VALUES(career_gateway_student_id),
             clg_id = VALUES(clg_id),
             assigned_batch = VALUES(assigned_batch),
             eligibility_status = VALUES(eligibility_status),
             last_synced_at = NOW()`,
          [userId, externalStudentId, clgId, requestedBatch, isEligible ? 'eligible' : 'revoked']
        );

        // Generate activation token using transaction connection (DATA-02)
        const { rawToken } = await createAccountActivation(userId, {}, connection);

        // Queue activation email to be sent ONLY after transaction commits (DATA-02)
        if (triggerEmail && isEligible) {
          pendingPostCommitActions.push(() => {
            sendActivationEmail({ to: email, name, rawToken }).catch((err) => {
              console.warn(`[Activation] Async email trigger failed for ${email}: ${err.message}`);
            });
          });
        }

        statusResult = 'created';
      }
    }

    // 5. Record audit event within transaction
    await executeQuery(
      `INSERT INTO career_gateway_integration_events
       (event_type, external_student_id, payload, status)
       VALUES ('student_provisioned', ?, ?, 'processed')`,
      [externalStudentId, JSON.stringify({ student_id: externalStudentId, clg_id: clgId, email, name, status: statusResult, batch: batchResolution })]
    );

    // Commit transaction only when all operations succeed (DATA-02)
    await connection.commit();

    // Execute post-commit actions (emails, cache invalidation, socket termination)
    for (const action of pendingPostCommitActions) {
      try {
        action();
      } catch (postErr) {
        console.warn('[PostCommitAction] Error executing post-commit action:', postErr.message);
      }
    }

    return {
      student_id: externalStudentId,
      clg_id: clgId,
      trainx_user_id: userId,
      email,
      batch: batchResolution,
      status: statusResult,
    };
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rbErr) {
      console.error('[Provisioning] Transaction rollback error:', rbErr.message);
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Revokes TrainX eligibility for a Career Gateway student.
 * Fully transactional, preserves learning history, and immediately invalidates
 * HTTP access tokens and live Socket.IO connections (SEC-01).
 */
export async function revokeStudentEligibility(externalStudentId, reason = 'Revoked by Career Gateway Administrator') {
  const parsedId = parseInt(externalStudentId, 10);
  if (!parsedId || isNaN(parsedId)) {
    throw new Error('Valid student_id is required for revocation');
  }

  const connection = await pool.getConnection();
  const executeQuery = async (sql, params) => {
    const safeParams = (params || []).map((p) => (p === undefined ? null : p));
    const [results] = await connection.execute(sql, safeParams);
    return results;
  };

  try {
    await connection.beginTransaction();

    const mappings = await executeQuery(
      'SELECT id, trainx_user_id, eligibility_status FROM career_gateway_student_mappings WHERE career_gateway_student_id = ? LIMIT 1',
      [parsedId]
    );
    const mapping = mappings[0] || null;

    if (!mapping) {
      throw new Error(`No student found mapping to Career Gateway student ID ${parsedId}`);
    }

    const userId = mapping.trainx_user_id;

    // 1. Deactivate user account to prevent login
    await executeQuery(
      'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [userId]
    );

    // 2. Invalidate any pending activation tokens
    await executeQuery(
      'UPDATE account_activations SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL',
      [userId]
    );

    // 3. Update mapping status
    await executeQuery(
      `UPDATE career_gateway_student_mappings 
       SET eligibility_status = 'revoked', revoked_at = NOW(), metadata = ?
       WHERE id = ?`,
      [JSON.stringify({ revocation_reason: reason, revoked_at: new Date() }), mapping.id]
    );

    // 4. Log revocation event
    await executeQuery(
      `INSERT INTO career_gateway_integration_events
       (event_type, external_student_id, payload, status)
       VALUES ('eligibility_revoked', ?, ?, 'processed')`,
      [parsedId, JSON.stringify({ student_id: parsedId, user_id: userId, reason })]
    );

    await connection.commit();

    // SEC-01: Immediately revoke token cache and disconnect live sockets
    revokeUserAuthInCache(userId);
    disconnectUserSockets(userId, reason);

    return {
      student_id: parsedId,
      trainx_user_id: userId,
      status: 'revoked',
      message: 'Student TrainX eligibility successfully revoked. Historical records preserved.',
    };
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rbErr) {
      console.error('[Revocation] Rollback error:', rbErr.message);
    }
    throw err;
  } finally {
    connection.release();
  }
}
