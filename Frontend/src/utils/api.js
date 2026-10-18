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
  }

  // Deployed production API (Render live backend)
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
  }
  return "https://trainx-6w8m.onrender.com";
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

