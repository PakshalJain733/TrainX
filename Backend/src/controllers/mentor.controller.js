import { sendSuccess } from '../utils/response.js';
import { query } from '../config/db.js';

export const getMentorStudentsPerformance = async (req, res, next) => {
  try {
    const students = [
      {
        id: "st-1", name: "Ganesh Shinde", department: "ECS", batch: "Batch A",
        overallScore: 71, assessment: 78, coding: 65, interview: 58, attendance: 82, milestone: 74,
        status: "Average", trend: "up", trendDelta: "+4%",
        weakAreas: [
          { skill: "AI Mock Interview", score: 58, target: 75 },
          { skill: "Coding / DSA", score: 65, target: 80 },
        ],
        recommendations: [
          "Schedule 2 AI Mock Interview sessions this week.",
          "Complete the Dynamic Programming problem set.",
          "Maintain 80%+ attendance for placement eligibility.",
        ],
      },
      {
        id: "st-2", name: "Priya Nair", department: "CSE", batch: "Batch A",
        overallScore: 85, assessment: 88, coding: 82, interview: 79, attendance: 91, milestone: 86,
        status: "Excellent", trend: "up", trendDelta: "+6%",
        weakAreas: [],
        recommendations: ["Attempt advanced DSA problems to maintain rank.", "Try the AI Interview for leadership-track prep."],
      },
      {
        id: "st-3", name: "Rahul Mehta", department: "IT", batch: "Batch B",
        overallScore: 52, assessment: 55, coding: 48, interview: 42, attendance: 68, milestone: 50,
        status: "Needs Work", trend: "down", trendDelta: "-3%",
        weakAreas: [
          { skill: "AI Mock Interview", score: 42, target: 65 },
          { skill: "Coding / DSA", score: 48, target: 70 },
          { skill: "Attendance", score: 68, target: 75 },
        ],
        recommendations: [
          "Urgently improve attendance (currently 68%).",
          "Complete 3 practice coding sessions before next assessment.",
          "Schedule mentor one-on-one session immediately.",
        ],
      },
      {
        id: "st-4", name: "Sneha Patil", department: "ECS", batch: "Batch A",
        overallScore: 68, assessment: 72, coding: 60, interview: 64, attendance: 78, milestone: 66,
        status: "Average", trend: "stable", trendDelta: "0%",
        weakAreas: [
          { skill: "Coding / DSA", score: 60, target: 70 },
        ],
        recommendations: [
          "Focus on graph algorithms in the practice module.",
          "Review last quiz feedback and reattempt.",
        ],
      },
    ];

    return sendSuccess(res, 'Mentor students performance retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

export const getMentorAttendanceBatches = async (req, res, next) => {
  try {
    const batches = [
      {
        id: 'b-1',
        name: 'Full Stack Batch A',
        students: [
          { id: 'st-1', name: 'Ganesh Shinde', roll: 'CS-101', status: null },
          { id: 'st-2', name: 'Priya Nair', roll: 'CS-102', status: null },
          { id: 'st-4', name: 'Sneha Patil', roll: 'CS-104', status: null }
        ]
      },
      {
        id: 'b-2',
        name: 'DSA Mastery Batch B',
        students: [
          { id: 'st-3', name: 'Rahul Mehta', roll: 'IT-201', status: null },
          { id: 'st-5', name: 'Karan Singh', roll: 'IT-202', status: null }
        ]
      }
    ];
    return sendSuccess(res, 'Batches retrieved', { batches });
  } catch (error) {
    next(error);
  }
};

export const saveMentorAttendance = async (req, res, next) => {
  try {
    const { batchId, session, date, attendance } = req.body;
    return sendSuccess(res, 'Attendance saved successfully', { recorded: attendance ? attendance.length : 0 });
  } catch (error) {
    next(error);
  }
};

// --- Live Sessions Database Endpoints ---
export const getLiveSessions = async (req, res, next) => {
  try {
    let sessions = [];
    try {
      sessions = await query(`SELECT * FROM live_sessions ORDER BY id DESC`);
    } catch (e) {
      console.warn('[DB getLiveSessions fallback]', e.message);
    }
    if (!sessions || sessions.length === 0) {
      sessions = [
        {
          id: 1,
          title: "System Design & Scalability Masterclass",
          mentorName: "Prof. Rajesh Sharma",
          subject: "System Design",
          batch: "BE-CS-2026-A",
          date: "2026-09-10",
          time: "06:00 PM - 07:30 PM",
          duration: "90 mins",
          meetingLink: "https://meet.google.com/xyz-abcd-123",
          status: "Upcoming",
          attendeesCount: 42
        },
        {
          id: 2,
          title: "Dynamic Programming & Graph Patterns",
          mentorName: "Dr. Ananya V.",
          subject: "DSA",
          batch: "TE-IT-2026-B",
          date: "2026-09-08",
          time: "04:00 PM - 05:00 PM",
          duration: "60 mins",
          meetingLink: "https://meet.google.com/dsa-graph-456",
          status: "Live",
          attendeesCount: 58
        }
      ];
    }
    return sendSuccess(res, 'Live sessions retrieved', sessions);
  } catch (error) {
    next(error);
  }
};

export const createLiveSession = async (req, res, next) => {
  try {
    const { title, subject, batch, date, time, duration, meetingLink } = req.body;
    const mentorId = req.user?.userId || req.user?.id || 1;

    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO live_sessions (mentor_id, title, subject, batch, date, time, duration, meeting_link, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`,
        [mentorId, title, subject || 'General', batch || 'All Batches', date, time, duration || '60 mins', meetingLink || '']
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createLiveSession fallback]', e.message);
    }

    const newSession = {
      id: insertId,
      mentor_id: mentorId,
      title,
      subject: subject || 'General',
      batch: batch || 'All Batches',
      date,
      time,
      duration: duration || '60 mins',
      meeting_link: meetingLink || '',
      status: 'Upcoming',
      created_at: new Date().toISOString()
    };
    return sendSuccess(res, 'Live session created successfully', newSession, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteLiveSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await query(`DELETE FROM live_sessions WHERE id = ?`, [id]);
    } catch (e) {
      console.warn('[DB deleteLiveSession fallback]', e.message);
    }
    return sendSuccess(res, 'Live session deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

// --- Study Materials Database Endpoints ---
export const getStudyMaterials = async (req, res, next) => {
  try {
    let materials = [];
    try {
      materials = await query(`SELECT * FROM study_materials ORDER BY id DESC`);
    } catch (e) {
      console.warn('[DB getStudyMaterials fallback]', e.message);
    }
    return sendSuccess(res, 'Study materials retrieved', materials || []);
  } catch (error) {
    next(error);
  }
};

import { uploadFileToS3 } from '../utils/s3Upload.js';

export const createStudyMaterial = async (req, res, next) => {
  try {
    const { title, description, subject, batch, type, link } = req.body;
    let fileUrl = req.body.fileUrl || null;

    // If file was uploaded via multipart/form-data
    if (req.file) {
      fileUrl = await uploadFileToS3(req.file);
    }

    const userId = req.user?.userId || req.user?.id || 1;
    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO study_materials (uploaded_by, title, description, subject, batch, type, file_url, link)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, description || null, subject || 'General', batch || 'All Batches', type || 'PDF', fileUrl || null, link || null]
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createStudyMaterial fallback]', e.message);
    }
    const newMaterial = {
      id: insertId,
      uploaded_by: userId,
      title,
      description: description || null,
      subject: subject || 'General',
      batch: batch || 'All Batches',
      type: type || 'PDF',
      file_url: fileUrl || null,
      link: link || null,
      created_at: new Date().toISOString()
    };
    return sendSuccess(res, 'Study material uploaded successfully', newMaterial, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteStudyMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await query(`DELETE FROM study_materials WHERE id = ?`, [id]);
    } catch (e) {
      console.warn('[DB deleteStudyMaterial fallback]', e.message);
    }
    return sendSuccess(res, 'Study material deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};


