// Tiny API client wrapper around fetch.
// - Attaches the JWT from localStorage when present.
// - Throws a readable Error with the server message on non-2xx responses.
//
// API base resolution:
//   - VITE_API_URL is set in client/.env (default http://localhost:5000).
//   - API requests and /uploads/ image paths are resolved against that base,
//     so the app works both in the Vite dev server and in a production build.

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * Generic request helper.
 * @param {string} path  e.g. "/api/products"
 * @param {object} options fetch options (method, body, headers, ...)
 */
export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem("saba-token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const isForm = options.body instanceof FormData;
  if (options.body && !isForm && typeof options.body !== "string") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }
  if (isForm) delete headers["Content-Type"]; // let the browser set the multipart boundary

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // 204 has no body
  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.message) || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/** Convenience helpers. */
export const apiGet = (path) => api(path);
export const apiPost = (path, body) => api(path, { method: "POST", body });
export const apiPatch = (path, body) => api(path, { method: "PATCH", body });
export const apiDelete = (path) => api(path, { method: "DELETE" });

/**
 * Build the final URL for an asset. Server responses use relative paths like
 * "/uploads/products/x.jpg"; those are resolved against the API base so the
 * images load in dev and in production builds alike.
 */
export function assetUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith("/uploads/")) return `${API_BASE}${src}`;
  return src;
}
