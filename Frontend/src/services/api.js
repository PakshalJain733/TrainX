export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return "/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

async function request(endpoint, options = {}) {
  const { skipAuthRedirect = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  };

  try {
    const response = await fetch(url, { ...fetchOptions, headers });
    if (response.status === 401 && !skipAuthRedirect) {
      // Unauthorized: clear expired or invalid credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
      throw new Error("Session expired or unauthorized. Please log in again.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`[API Warning] Request to ${endpoint} failed: ${error.message}`);
    throw error;
  }
}

// Auth API
export const authAPI = {
  sendOtp: async (identifier) => {
    const res = await request("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: identifier, identifier }),
      skipAuthRedirect: true,
    });
    return res.data;
  },
  verifyOtp: async (identifier, otp) => {
    const res = await request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: identifier, identifier, otp }),
      skipAuthRedirect: true,
    });
    return res.data;
  },
  loginPassword: async (identifier, password) => {
    const res = await request("/auth/login-password", {
      method: "POST",
      body: JSON.stringify({ email: identifier, identifier, password }),
      skipAuthRedirect: true,
    });
    return res.data;
  },
  register: async (payload) => {
    const res = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuthRedirect: true,
    });
    return res.data;
  },
  getMe: async () => {
    const res = await request("/auth/me");
    return res.data;
  },
};

// Colleges API
export const collegeAPI = {
  getColleges: async () => {
    const res = await request("/colleges");
    return res.data;
  },
  createCollege: async (data) => {
    const res = await request("/colleges", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },
  updateCollege: async (id, data) => {
    const res = await request(`/colleges/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  },
  deleteCollege: async (id) => {
    const res = await request(`/colleges/${id}`, {
      method: "DELETE",
    });
    return res.data;
  },
};

// Departments API
export const departmentAPI = {
  getDepartments: async (collegeId = null) => {
    const query = collegeId ? `?collegeId=${collegeId}` : "";
    const res = await request(`/departments${query}`);
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await request("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },
  updateDepartment: async (id, data) => {
    const res = await request(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  },
  deleteDepartment: async (id) => {
    const res = await request(`/departments/${id}`, {
      method: "DELETE",
    });
    return res.data;
  },
};

// Batches API
export const batchAPI = {
  getBatches: async (collegeId = null, departmentId = null) => {
    const params = new URLSearchParams();
    if (collegeId) params.append("collegeId", collegeId);
    if (departmentId) params.append("departmentId", departmentId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await request(`/batches${query}`);
    return res.data;
  },
  createBatch: async (data) => {
    const res = await request("/batches", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },
  updateBatch: async (id, data) => {
    const res = await request(`/batches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.data;
  },
  deleteBatch: async (id) => {
    const res = await request(`/batches/${id}`, {
      method: "DELETE",
    });
    return res.data;
  },
};

// Assessments API
export const assessmentAPI = {
  getAssessments: async (batch = null) => {
    const query = batch ? `?batch=${encodeURIComponent(batch)}` : "";
    const res = await request(`/assessments${query}`);
    return res.data;
  },
  createAssessment: async (data) => {
    const res = await request("/assessments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

// Super Admin API
export const superAdminAPI = {
  overview: async () => {
    const res = await request("/superadmin/overview");
    return res.data;
  },
  colleges: async () => {
    const res = await request("/superadmin/colleges");
    return res.data;
  },
  departments: async () => {
    const res = await request("/superadmin/departments");
    return res.data;
  },
  batches: async () => {
    const res = await request("/superadmin/batches");
    return res.data;
  },
  coordinators: async () => {
    const res = await request("/superadmin/coordinators");
    return res.data;
  },
  mentors: async () => {
    const res = await request("/superadmin/mentors");
    return res.data;
  },
  students: async () => {
    const res = await request("/superadmin/students");
    return res.data;
  },
  attendance: async () => {
    const res = await request("/superadmin/attendance");
    return res.data;
  },
  performance: async () => {
    const res = await request("/superadmin/performance");
    return res.data;
  },
  weeklyReports: async () => {
    const res = await request("/superadmin/weekly-reports");
    return res.data;
  },
  roadmaps: async () => {
    const res = await request("/superadmin/roadmaps");
    return res.data;
  },
  verifications: async () => {
    const res = await request("/superadmin/verifications");
    return res.data;
  },
};

export { request };
