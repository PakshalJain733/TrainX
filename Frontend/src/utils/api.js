export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.startsWith("http")) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Local development: use relative /api/v1 so Vite dev server proxies to localhost:5000
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local")
    ) {
      return "/api/v1";
    }

    // Direct production domain mapping
    if (host.includes("trainingportal.getflytechnologies.com")) {
      return "https://api.trainingportal.getflytechnologies.com/api/v1";
    }

    // Production Custom Domains & Vercel Deployments (proxied via /api/v1 rewrite)
    if (host.includes("trainx-vppcoe.tech") || host.endsWith(".vercel.app")) {
      return "/api/v1";
    }
  }

  // Deployed production API (Render live backend fallback)
  return "https://trainx-6w8m.onrender.com/api/v1";
};

export const getBackendOrigin = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, "");
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  }
  if (import.meta.env.VITE_API_URL && (import.meta.env.VITE_API_URL.startsWith("http://") || import.meta.env.VITE_API_URL.startsWith("https://"))) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return `${window.location.protocol}//${host}:5000`;
    }
    if (host.includes("trainingportal.getflytechnologies.com")) {
      return "https://api.trainingportal.getflytechnologies.com";
    }
  }
  return "https://trainx-6w8m.onrender.com";
};

// Read the auth token from whichever storage was used at login:
//   sessionStorage → Remember Me was OFF (cleared when browser closes)
//   localStorage   → Remember Me was ON  (persists across restarts)
export function getAuthToken() {
  const directToken =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("auth_token");
  if (directToken) return directToken;

  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return (
        u?.token ||
        u?.authToken ||
        u?.auth_token ||
        u?.accessToken ||
        u?.jwt ||
        null
      );
    }
  } catch (_) {}

  return null;
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

      // Handle invalid or dead session tokens (e.g. user deleted or database reseeded)
      if (res.status === 401 && token) {
        const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/verify-otp') || endpoint.includes('/auth/register');
        if (!isAuthEndpoint) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("auth_token");
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("role");
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");

          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login") &&
            !window.location.pathname.startsWith("/activate-account") &&
            !window.location.pathname.startsWith("/register") &&
            !window.location.pathname.startsWith("/setup-institution")
          ) {
            window.location.href = "/login?session_expired=1";
          }
        }
      }

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

