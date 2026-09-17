const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      throw error;
    }

    return await res.json();
  } catch (error) {
    // If backend is not active or unreachable in development, fallback gracefully
    console.warn(`[apiFetch] ${endpoint}:`, error.message);
    return { data: null, error: error.message, status: error.status };
  }
}

export default apiFetch;
