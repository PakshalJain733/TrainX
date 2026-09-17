export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    // Relative URL `/api/v1` routes via Vite Proxy securely (no HTTPS/HTTP mixed content issues)
    return "/api/v1";
  }
  return "http://localhost:5000/api/v1";
};

export async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      throw error;
    }

    return await res.json();
  } catch (error) {
    console.warn(`[apiFetch] ${endpoint}:`, error.message);
    return { data: null, error: error.message, status: error.status };
  }
}

export default apiFetch;
