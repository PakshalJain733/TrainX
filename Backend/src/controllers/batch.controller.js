import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

let mockBatches = [
  {
    id: 1,
    name: "CSE 2026 Alpha Cohort",
    code: "CSE-2026-A",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    departmentId: 1,
    departmentName: "Computer Science & Engineering",
    trainer: "Rohan Sharma",
    studentsCount: 120,
    enrolledStudents: 120,
    progress: 78,
    schedule: "Mon, Wed, Fri (10:00 AM - 12:00 PM)",
    status: "Active",
  },
  {
    id: 2,
    name: "Fullstack React & Node Specialization",
    code: "FS-WEB-04",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    departmentId: 1,
    departmentName: "Computer Science & Engineering",
    trainer: "Ananya Gupta",
    studentsCount: 105,
    enrolledStudents: 105,
    progress: 62,
    schedule: "Mon, Thu (04:00 PM - 06:00 PM)",
    status: "Active",
  },
  {
    id: 3,
    name: "Data Science & ML 2025",
    code: "DSML-2025-B",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    departmentId: 2,
    departmentName: "Artificial Intelligence & Data Science",
    trainer: "Dr. Vikram Seth",
    studentsCount: 110,
    enrolledStudents: 110,
    progress: 91,
    schedule: "Tue, Thu (02:00 PM - 04:00 PM)",
    status: "Near Completion",
  },
  {
    id: 4,
    name: "Cloud Native & DevOps Infrastructure",
    code: "CLOUD-DO-02",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    departmentId: 3,
    departmentName: "Information Technology",
    trainer: "Siddharth Roy",
    studentsCount: 85,
    enrolledStudents: 85,
    progress: 45,
    schedule: "Tue, Fri (09:00 AM - 11:00 AM)",
    status: "Active",
  },
  {
    id: 5,
    name: "CE 2025 Beta Cohort",
    code: "CE-2025-B",
    collegeId: 2,
    collegeName: "St. Xavier Engineering College",
    departmentId: 4,
    departmentName: "Computer Engineering",
    trainer: "Priya Nair",
    studentsCount: 130,
    enrolledStudents: 130,
    progress: 80,
    schedule: "Mon, Wed (01:00 PM - 03:00 PM)",
    status: "Active",
  },
];

export const getBatches = async (req, res, next) => {
  try {
    const { collegeId, departmentId, college, department } = req.query;

    let result = mockBatches;

    try {
      const dbBatches = await query('SELECT * FROM batches');
      if (dbBatches && dbBatches.length > 0) {
        result = dbBatches;
      }
    } catch (err) {
      // Fallback
    }

    if (collegeId) {
      const cid = Number(collegeId);
      result = result.filter((b) => b.collegeId === cid || b.collegeId === collegeId);
    } else if (college) {
      const cname = college.toLowerCase();
      result = result.filter((b) => b.collegeName && b.collegeName.toLowerCase().includes(cname));
    }

    if (departmentId) {
      const did = Number(departmentId);
      result = result.filter((b) => b.departmentId === did || b.departmentId === departmentId);
    } else if (department) {
      const dname = department.toLowerCase();
      result = result.filter((b) => b.departmentName && b.departmentName.toLowerCase().includes(dname));
    }

    return sendSuccess(res, 'Batches retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    const { name, code, collegeId, collegeName, departmentId, departmentName, trainer, schedule } = req.body;
    if (!name || !code) {
      return sendError(res, 'Batch Name and Code are required', 400);
    }

    const newBatch = {
      id: Date.now(),
      name,
      code,
      collegeId: collegeId ? Number(collegeId) : 1,
      collegeName: collegeName || "Apex Institute of Technology",
      departmentId: departmentId ? Number(departmentId) : 1,
      departmentName: departmentName || "Computer Science & Engineering",
      trainer: trainer || "Industry Specialist",
      studentsCount: 0,
      enrolledStudents: 0,
      progress: 0,
      schedule: schedule || "Mon, Wed, Fri (10:00 AM - 12:00 PM)",
      status: "Active",
    };

    mockBatches = [newBatch, ...mockBatches];
    return sendSuccess(res, 'Batch created successfully', newBatch, 201);
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    let updatedBatch = null;
    mockBatches = mockBatches.map((b) => {
      if (b.id === numId || b.id === id) {
        updatedBatch = { ...b, ...req.body };
        return updatedBatch;
      }
      return b;
    });

    if (!updatedBatch) {
      return sendError(res, 'Batch not found', 404);
    }

    return sendSuccess(res, 'Batch updated successfully', updatedBatch);
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    mockBatches = mockBatches.filter((b) => b.id !== numId && b.id !== id);
    return sendSuccess(res, 'Batch deleted successfully');
  } catch (error) {
    next(error);
  }
};
