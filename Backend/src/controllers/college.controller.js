import { sendSuccess, sendError } from '../utils/response.js';
import { query, pool } from '../config/db.js';

// In-Memory Fallback Store initialized with default data
let mockColleges = [
  {
    id: 1,
    name: "Apex Institute of Technology",
    code: "AIT-MAIN",
    codeName: "AIT",
    location: "Campus West, Tech Zone",
    city: "Bangalore",
    type: "Autonomous",
    departmentsCount: 6,
    studentsCount: 1420,
    batchesCount: 12,
    status: "Active",
    contactEmail: "admin@apex.edu.in",
    contactPhone: "+91 98765 43210",
  },
  {
    id: 2,
    name: "St. Xavier Engineering College",
    code: "SXEC-NORTH",
    codeName: "SXEC",
    location: "North University Campus",
    city: "Mumbai",
    type: "Affiliated",
    departmentsCount: 5,
    studentsCount: 980,
    batchesCount: 8,
    status: "Active",
    contactEmail: "info@sxec.edu.in",
    contactPhone: "+91 98111 22334",
  },
  {
    id: 3,
    name: "Vidyalankar Institute of Tech",
    code: "VIT-SOUTH",
    codeName: "VIT",
    location: "South Tech Park",
    city: "Pune",
    type: "Autonomous",
    departmentsCount: 4,
    studentsCount: 750,
    batchesCount: 6,
    status: "Active",
    contactEmail: "contact@vit.edu.in",
    contactPhone: "+91 98222 33445",
  },
  {
    id: 4,
    name: "Global Academy of Science & Engineering",
    code: "GASE-EAST",
    codeName: "GASE",
    location: "East Innovation Belt",
    city: "Hyderabad",
    type: "Affiliated",
    departmentsCount: 3,
    studentsCount: 510,
    batchesCount: 4,
    status: "Active",
    contactEmail: "admin@gase.edu.in",
    contactPhone: "+91 98333 44556",
  },
];

export const getColleges = async (req, res, next) => {
  try {
    try {
      const dbColleges = await query('SELECT * FROM colleges');
      if (dbColleges && dbColleges.length > 0) {
        return sendSuccess(res, 'Colleges retrieved successfully', dbColleges);
      }
    } catch (dbErr) {
      // Fallback to in-memory state
    }
    return sendSuccess(res, 'Colleges retrieved successfully', mockColleges);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    const { name, code, location, city, type, contactEmail, contactPhone } = req.body;
    if (!name || !code) {
      return sendError(res, 'College Name and Code are required', 400);
    }

    const newCollege = {
      id: Date.now(),
      name,
      code,
      codeName: code.split("-")[0] || code,
      location: location || "Main Campus",
      city: city || "Metropolis",
      type: type || "Autonomous",
      departmentsCount: 0,
      studentsCount: 0,
      batchesCount: 0,
      status: "Active",
      contactEmail: contactEmail || `info@${code.toLowerCase()}.edu.in`,
      contactPhone: contactPhone || "+91 90000 00000",
    };

    try {
      await query(
        'INSERT INTO colleges (name, code, location, city, type, status) VALUES (?, ?, ?, ?, ?, ?)',
        [newCollege.name, newCollege.code, newCollege.location, newCollege.city, newCollege.type, newCollege.status]
      );
    } catch (dbErr) {
      // Memory fallback insertion
    }

    mockColleges = [newCollege, ...mockColleges];
    return sendSuccess(res, 'College created successfully', newCollege, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    let updatedCollege = null;
    mockColleges = mockColleges.map((c) => {
      if (c.id === numId || c.id === id) {
        updatedCollege = { ...c, ...req.body };
        return updatedCollege;
      }
      return c;
    });

    if (!updatedCollege) {
      return sendError(res, 'College not found', 404);
    }

    return sendSuccess(res, 'College updated successfully', updatedCollege);
  } catch (error) {
    next(error);
  }
};

export const deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    mockColleges = mockColleges.filter((c) => c.id !== numId && c.id !== id);
    return sendSuccess(res, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCollegeData = getColleges;
