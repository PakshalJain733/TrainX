export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
  ) {
    return "/api/v1";
  }
  return "https://trainx-6w8m.onrender.com/api/v1";
};

// Read the auth token from whichever storage was used at login:
//   sessionStorage → Remember Me was OFF (cleared when browser closes)
//   localStorage   → Remember Me was ON  (persists across restarts)
export function getAuthToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token") || null;
}

export async function apiFetch(endpoint, options = {}) {
  try {
    let token = getAuthToken();
    if (!token) {
      token =
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("auth_token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("auth_token");
    }
    if (!token) {
      try {
        const uSession = JSON.parse(
          sessionStorage.getItem("user") || localStorage.getItem("user") || "{}"
        );
        token =
          uSession.token ||
          uSession.authToken ||
          uSession.auth_token ||
          uSession.accessToken ||
          uSession.jwt;
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
      const message = errorData.message || `Request failed with status ${res.status}`;
      console.warn(`[apiFetch] ${endpoint}: ${message}`);
      return { data: null, error: message, status: res.status };
    }

    return await res.json();
  } catch (error) {
    // Fallback gracefully
    console.warn(`[apiFetch] ${endpoint}:`, error.message);
    return { data: null, error: error.message };
  }
}

export default apiFetch;

