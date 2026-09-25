export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "/api/v1";
  }
  return "https://trainx-6w8m.onrender.com/api/v1";
};

export async function apiFetch(endpoint, options = {}) {
  try {
    let token =
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("auth_token");

    if (!token) {
      try {
        const uSession = JSON.parse(
          sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
        );
        token = uSession.token || uSession.authToken || uSession.auth_token;
      } catch (e) {}
    }

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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    // Fallback gracefully
    console.warn(`[apiFetch] ${endpoint}:`, error.message);
    return { data: null, error: error.message };
  }
}

export default apiFetch;

