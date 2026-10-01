export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal =
      ["localhost", "127.0.0.1", "::1"].includes(host) ||
      host.endsWith(".local") ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);

    if (isLocal) {
      return "/api/v1";
    }
  }
  return "https://trainx-6w8m.onrender.com/api/v1";
};

// Read the auth token from whichever storage was used at login:
//   sessionStorage → Remember Me was OFF (cleared when browser closes)
//   localStorage   → Remember Me was ON  (persists across restarts)
export function getAuthToken() {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("auth_token") ||
    null
  );
}

export async function apiFetch(endpoint, options = {}) {
  try {
    let token = getAuthToken();
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
      if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        sessionStorage.removeItem("authToken");
        localStorage.removeItem("authToken");
      }
      return { success: false, message, data: null, error: message, status: res.status };
    }

    return await res.json();
  } catch (error) {
    // Fallback gracefully
    console.warn(`[apiFetch] ${endpoint}:`, error.message);
    return { success: false, message: error.message, data: null, error: error.message };
  }
}

export default apiFetch;

