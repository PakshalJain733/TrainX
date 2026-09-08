import { sendSuccess } from '../utils/response.js';

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
    // In a real DB, save the array. For now, mock success.
    return sendSuccess(res, 'Attendance saved successfully', { recorded: attendance.length });
  } catch (error) {
    next(error);
  }
};

