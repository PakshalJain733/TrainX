import { sendSuccess, sendError } from '../utils/response.js';

let mockAssessments = [
  {
    id: 1,
    title: "Data Structures & Graph Theory Mid-Term Quiz",
    batch: "CSE 2026 Alpha Cohort",
    type: "MCQ & Coding",
    dueDate: "2026-09-05",
    submissions: "112 / 120",
    attempts: 112,
    totalEnrolled: 120,
    avgScore: "84%",
    highestScore: "98%",
    passRate: "92%",
    status: "Active",
  },
  {
    id: 2,
    title: "Generative AI & Fine-Tuning LLMs Assessment",
    batch: "Data Science & ML 2025",
    type: "Project & Quiz",
    dueDate: "2026-08-30",
    submissions: "110 / 110",
    attempts: 110,
    totalEnrolled: 110,
    avgScore: "91%",
    highestScore: "100%",
    passRate: "98%",
    status: "Completed",
  },
  {
    id: 3,
    title: "Fullstack Authentication & Redis Caching Exam",
    batch: "Fullstack React & Node Specialization",
    type: "Coding Assessment",
    dueDate: "2026-09-08",
    submissions: "45 / 105",
    attempts: 45,
    totalEnrolled: 105,
    avgScore: "76%",
    highestScore: "92%",
    passRate: "81%",
    status: "In Progress",
  },
  {
    id: 4,
    title: "Docker Containerization & Kubernetes Challenge",
    batch: "Cloud Native & DevOps Infrastructure",
    type: "Hands-on Lab",
    dueDate: "2026-09-12",
    submissions: "12 / 85",
    attempts: 12,
    totalEnrolled: 85,
    avgScore: "82%",
    highestScore: "95%",
    passRate: "88%",
    status: "Active",
  },
];

export const getAssessments = async (req, res, next) => {
  try {
    const { batch } = req.query;
    let result = mockAssessments;
    if (batch && batch !== "All") {
      result = result.filter((a) => a.batch.toLowerCase().includes(batch.toLowerCase()));
    }
    return sendSuccess(res, 'Assessments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const { title, batch, type, dueDate } = req.body;
    if (!title) {
      return sendError(res, 'Quiz/Assessment Title is required', 400);
    }

    const newAssessment = {
      id: Date.now(),
      title,
      batch: batch || "CSE 2026 Alpha Cohort",
      type: type || "MCQ Quiz",
      dueDate: dueDate || "2026-09-15",
      submissions: "0 / 120",
      attempts: 0,
      totalEnrolled: 120,
      avgScore: "--",
      highestScore: "--",
      passRate: "--",
      status: "Active",
    };

    mockAssessments = [newAssessment, ...mockAssessments];
    return sendSuccess(res, 'Assessment created successfully', newAssessment, 201);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentData = getAssessments;
