const API_BASE_URL = "http://localhost:5000/api/v1";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }
    return data;
  } catch (error) {
    console.warn(`[API Warning] Request to ${endpoint} failed (${error.message}). Using fallback data.`);
    throw error;
  }
}

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
