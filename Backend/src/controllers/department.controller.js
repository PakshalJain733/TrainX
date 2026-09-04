import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

let mockDepartments = [
  {
    id: 1,
    name: "Computer Science & Engineering",
    code: "CSE",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    hodName: "Dr. Arvind Kulkarni",
    hodEmail: "hod.cse@apex.edu.in",
    studentsCount: 420,
    batchesCount: 4,
    status: "Active",
  },
  {
    id: 2,
    name: "Artificial Intelligence & Data Science",
    code: "AI-DS",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    hodName: "Dr. Meera Nambiar",
    hodEmail: "hod.aids@apex.edu.in",
    studentsCount: 380,
    batchesCount: 3,
    status: "Active",
  },
  {
    id: 3,
    name: "Information Technology",
    code: "IT",
    collegeId: 1,
    collegeName: "Apex Institute of Technology",
    hodName: "Prof. Rajesh Verma",
    hodEmail: "hod.it@apex.edu.in",
    studentsCount: 340,
    batchesCount: 3,
    status: "Active",
  },
  {
    id: 4,
    name: "Computer Engineering",
    code: "CE",
    collegeId: 2,
    collegeName: "St. Xavier Engineering College",
    hodName: "Dr. Sanjay Joshi",
    hodEmail: "hod.ce@sxec.edu.in",
    studentsCount: 450,
    batchesCount: 4,
    status: "Active",
  },
  {
    id: 5,
    name: "Electronics & Telecommunication",
    code: "EXTC",
    collegeId: 2,
    collegeName: "St. Xavier Engineering College",
    hodName: "Dr. Sunita Rao",
    hodEmail: "hod.extc@sxec.edu.in",
    studentsCount: 300,
    batchesCount: 3,
    status: "Active",
  },
  {
    id: 6,
    name: "Data Science",
    code: "DS",
    collegeId: 3,
    collegeName: "Vidyalankar Institute of Tech",
    hodName: "Prof. Anand Sharma",
    hodEmail: "hod.ds@vit.edu.in",
    studentsCount: 280,
    batchesCount: 2,
    status: "Active",
  },
];

export const getDepartments = async (req, res, next) => {
  try {
    const { collegeId, college } = req.query;

    let result = mockDepartments;

    try {
      const dbDepts = await query('SELECT * FROM departments');
      if (dbDepts && dbDepts.length > 0) {
        result = dbDepts;
      }
    } catch (err) {
      // Fallback to mock
    }

    if (collegeId) {
      const cid = Number(collegeId);
      result = result.filter((d) => d.collegeId === cid || d.collegeId === collegeId);
    } else if (college) {
      const cname = college.toLowerCase();
      result = result.filter((d) => d.collegeName && d.collegeName.toLowerCase().includes(cname));
    }

    return sendSuccess(res, 'Departments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, collegeId, collegeName, hodName, hodEmail } = req.body;
    if (!name || !code) {
      return sendError(res, 'Department Name and Code are required', 400);
    }

    const newDept = {
      id: Date.now(),
      name,
      code,
      collegeId: collegeId ? Number(collegeId) : 1,
      collegeName: collegeName || "Apex Institute of Technology",
      hodName: hodName || "Dr. Department HOD",
      hodEmail: hodEmail || `hod.${code.toLowerCase()}@college.edu.in`,
      studentsCount: 0,
      batchesCount: 0,
      status: "Active",
    };

    mockDepartments = [newDept, ...mockDepartments];
    return sendSuccess(res, 'Department created successfully', newDept, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    let updatedDept = null;
    mockDepartments = mockDepartments.map((d) => {
      if (d.id === numId || d.id === id) {
        updatedDept = { ...d, ...req.body };
        return updatedDept;
      }
      return d;
    });

    if (!updatedDept) {
      return sendError(res, 'Department not found', 404);
    }

    return sendSuccess(res, 'Department updated successfully', updatedDept);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    mockDepartments = mockDepartments.filter((d) => d.id !== numId && d.id !== id);
    return sendSuccess(res, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
