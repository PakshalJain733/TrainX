// Backwards-compatible shim over the single API client in ../services/api.js.
// Preserves the historical contract of `apiFetch`:
//   - success: resolves to the parsed JSON envelope
//   - failure: resolves to { data: null, error, status }
import { getApiBaseUrl, request } from "../services/api.js";

export async function apiFetch(endpoint, options = {}) {
  try {
    return await request(endpoint, options);
  } catch (error) {
    return { data: null, error: error.message, status: error.status };
  }
}

export { getApiBaseUrl };
export default apiFetch;
