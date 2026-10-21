/**
 * Shared API client for the frontend.
 *
 * - In dev, Vite proxies `/api` to the backend (see vite.config.js), so a
 *   relative base works with no CORS friction.
 * - In production / preview, set VITE_API_URL=http://host:port in frontend/.env
 *   (or the host environment) and the client will talk to that backend directly.
 * - Network failures, timeouts and non-JSON responses are converted into clear
 *   Error objects instead of opaque "Failed to fetch" messages.
 */

const RAW_BASE = import.meta.env.VITE_API_URL || '';

// Normalise: strip trailing slash, fall back to relative /api.
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : '';

/**
 * Join a path onto the API origin.
 * `apiUrl('/api/documents')` -> '/api/documents' (dev) or
 *                             'http://host:4000/api/documents' (VITE_API_URL set).
 * The caller supplies the full route, including the '/api' segment.
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/**
 * Build the URL for a backend endpoint addressed without the '/api' prefix.
 * `apiEndpoint('/home/overview')` -> '/api/home/overview'.
 * This is what the shared `api` client uses for every request.
 */
export function apiEndpoint(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}/api${p}`;
}

const DEFAULT_TIMEOUT_MS = 20000;

export async function request(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(apiEndpoint(path), {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      throw new Error('Request timed out. Check your network connection and that the backend is running.');
    }
    throw new Error(
      `Failed to reach the backend (${e.message || 'network error'}). ` +
      `Make sure the backend is running on ${API_BASE || 'the same origin'} and that VITE_API_URL is set correctly.`
    );
  }
  clearTimeout(timer);

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',   path, body),
  delete: (path)        => request('DELETE', path),
};
