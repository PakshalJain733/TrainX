import { query } from '../config/db.js';

// Pre-seeded placement drives for fallback / testing
const mockDrivesStore = [
  {
    id: 1,
    name: 'TCS NQT National Placement Mock Drive 2026',
    title: 'TCS NQT National Placement Mock Drive 2026',
    scheduled_date: '2026-09-15',
    date: '2026-09-15',
    college_id: 1,
    college_name: 'PVPPCOE',
    eligible_batches: ['Batch A - CSE', 'Batch A - ECS', 'Batch B - IT'],
    status: 'Active Today',
    aptitude_component: {
      id: 1,
      title: 'Aptitude & Logical Reasoning Test',
      total_questions: 15,
      duration_mins: 20,
    },
    coding_component: {
      id: 1,
      title: 'DSA & Algorithmic Problem Solving Challenge',
      difficulty: 'Medium',
      points: 100,
    },
    interview_component: {
      id: 1,
      title: 'AI Technical Mock Interview Round',
      topic: 'DBMS, Data Structures & OOP Concepts',
      duration_mins: 15,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Infosys SP/DSE Placement Mock Drive',
    title: 'Infosys SP/DSE Placement Mock Drive',
    scheduled_date: '2026-09-22',
    date: '2026-09-22',
    college_id: 1,
    college_name: 'PVPPCOE',
    eligible_batches: ['Batch A - CSE', 'Batch Alpha - DBIT'],
    status: 'Upcoming',
    aptitude_component: {
      id: 2,
      title: 'Mathematical Ability & Verbal Assessment',
      total_questions: 20,
      duration_mins: 25,
    },
    coding_component: {
      id: 2,
      title: 'Advanced System Coding & API Task',
      difficulty: 'Hard',
      points: 100,
    },
    interview_component: {
      id: 2,
      title: 'AI Technical Interview (System Architecture)',
      topic: 'System Design & REST APIs',
      duration_mins: 20,
    },
    created_at: new Date().toISOString(),
  },
];

// Student drive participations map (key: `${driveId}_${studentId}`)
const mockParticipationsStore = new Map();

/**
 * Get all mock drives
 */
export const getAllDrivesModel = async (filters = {}) => {
  const { college_id, status } = filters;

  try {
    let sql = `SELECT * FROM mock_drives WHERE 1=1`;
    const params = [];
    if (college_id) {
      sql += ` AND (college_id = ? OR college_id IS NULL)`;
      params.push(parseInt(college_id, 10));
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY id DESC`;

    const rows = await query(sql, params);
    if (rows && Array.isArray(rows) && rows.length > 0) {
      return rows.map((r) => ({
        ...r,
        eligible_batches: typeof r.eligible_batches === 'string' ? JSON.parse(r.eligible_batches) : (r.eligible_batches || []),
        aptitude_component: typeof r.aptitude_component === 'string' ? JSON.parse(r.aptitude_component) : (r.aptitude_component || {}),
        coding_component: typeof r.coding_component === 'string' ? JSON.parse(r.coding_component) : (r.coding_component || {}),
        interview_component: typeof r.interview_component === 'string' ? JSON.parse(r.interview_component) : (r.interview_component || {}),
      }));
    }
  } catch (error) {
    console.warn(`[Drive Model] DB query fallback: ${error.message}`);
  }

  return mockDrivesStore.filter((d) => {
    if (college_id && d.college_id && d.college_id !== parseInt(college_id, 10)) return false;
    if (status && d.status !== status) return false;
    return true;
  });
};

/**
 * Create a new mock drive
 */
export const createDriveModel = async (driveData) => {
  const {
    name,
    scheduled_date,
    college_id = 1,
    eligible_batches = [],
    status = 'Upcoming',
    aptitude_component = {},
    coding_component = {},
    interview_component = {},
  } = driveData;

  try {
    const res = await query(
      `INSERT INTO mock_drives 
        (name, scheduled_date, college_id, eligible_batches, status, aptitude_component, coding_component, interview_component, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name,
        scheduled_date || new Date().toISOString().split('T')[0],
        college_id,
        JSON.stringify(eligible_batches),
        status,
        JSON.stringify(aptitude_component),
        JSON.stringify(coding_component),
        JSON.stringify(interview_component),
      ]
    );

    if (res && res.insertId) {
      return { id: res.insertId, ...driveData };
    }
  } catch (error) {
    console.warn(`[Drive Model] DB insert fallback: ${error.message}`);
  }

  const newDrive = {
    id: mockDrivesStore.length + 1,
    name,
    title: name,
    scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
    date: scheduled_date || new Date().toISOString().split('T')[0],
    college_id,
    eligible_batches,
    status,
    aptitude_component,
    coding_component,
    interview_component,
    created_at: new Date().toISOString(),
  };

  mockDrivesStore.unshift(newDrive);
  return newDrive;
};

/**
 * Get drive participation by student and drive ID
 */
export const getDriveParticipationModel = async (driveId, studentId) => {
  const dId = Number(driveId);
  const sId = Number(studentId);
  const key = `${dId}_${sId}`;

  try {
    const rows = await query(
      `SELECT * FROM drive_participations WHERE drive_id = ? AND student_id = ? LIMIT 1`,
      [dId, sId]
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        ...r,
        strength_areas: typeof r.strength_areas === 'string' ? JSON.parse(r.strength_areas) : (r.strength_areas || []),
        weak_areas: typeof r.weak_areas === 'string' ? JSON.parse(r.weak_areas) : (r.weak_areas || []),
      };
    }
  } catch (error) {
    console.warn(`[Drive Model] DB participation query fallback: ${error.message}`);
  }

  return mockParticipationsStore.get(key) || null;
};

/**
 * Save or update drive participation (Prevents duplicate completion)
 */
export const saveOrUpdateDriveParticipationModel = async (participationData) => {
  const {
    drive_id,
    student_id,
    status = 'In Progress',
    current_step = 1,
    aptitude_score = 0,
    coding_score = 0,
    interview_score = 0,
    final_score = 0,
    feedback = '',
    strength_areas = [],
    weak_areas = [],
  } = participationData;

  const dId = Number(drive_id);
  const sId = Number(student_id);
  const key = `${dId}_${sId}`;

  try {
    const existing = await query(
      `SELECT id, status FROM drive_participations WHERE drive_id = ? AND student_id = ? LIMIT 1`,
      [dId, sId]
    );

    if (existing && existing.length > 0) {
      // Prevent overwriting if already completed
      if (existing[0].status === 'Completed' && status !== 'Completed') {
        return getDriveParticipationModel(dId, sId);
      }

      await query(
        `UPDATE drive_participations 
         SET status = ?, current_step = ?, aptitude_score = ?, coding_score = ?, interview_score = ?, final_score = ?, feedback = ?, strength_areas = ?, weak_areas = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          status,
          current_step,
          aptitude_score,
          coding_score,
          interview_score,
          final_score,
          feedback,
          JSON.stringify(strength_areas),
          JSON.stringify(weak_areas),
          existing[0].id,
        ]
      );
      return getDriveParticipationModel(dId, sId);
    } else {
      await query(
        `INSERT INTO drive_participations 
          (drive_id, student_id, status, current_step, aptitude_score, coding_score, interview_score, final_score, feedback, strength_areas, weak_areas, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          dId,
          sId,
          status,
          current_step,
          aptitude_score,
          coding_score,
          interview_score,
          final_score,
          feedback,
          JSON.stringify(strength_areas),
          JSON.stringify(weak_areas),
        ]
      );
      return getDriveParticipationModel(dId, sId);
    }
  } catch (error) {
    console.warn(`[Drive Model] DB participation save fallback: ${error.message}`);
  }

  const existingMock = mockParticipationsStore.get(key);
  if (existingMock && existingMock.status === 'Completed' && status !== 'Completed') {
    return existingMock;
  }

  const newMock = {
    id: existingMock ? existingMock.id : Date.now(),
    drive_id: dId,
    student_id: sId,
    status,
    current_step,
    aptitude_score,
    coding_score,
    interview_score,
    final_score,
    feedback,
    strength_areas,
    weak_areas,
    updated_at: new Date().toISOString(),
  };

  mockParticipationsStore.set(key, newMock);
  return newMock;
};
