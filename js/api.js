// API CLIENT — shared across every page that talks to the backend.
// Include this before any page-specific script that calls apiFetch().

const API_BASE_URL = 'https://web-production-88eb75.up.railway.app/api';

const TOKEN_KEY = 'orbit_token';
const USER_KEY = 'orbit_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Wraps fetch() for the Orbit LMS API:
 * - Prefixes API_BASE_URL
 * - Attaches "Authorization: Bearer <token>" automatically if logged in
 * - Sends/parses JSON automatically
 * - Throws a plain Error with the server's message on non-2xx responses,
 *   so callers can just try/catch instead of checking res.ok everywhere.
 *
 * Usage:
 *   const { data } = await apiFetch('/courses');
 *   const { data } = await apiFetch('/courses', { method: 'POST', body: { title, category } });
 */
async function apiFetch(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (deletes) has no body to parse
  if (res.status === 204) return { data: null };

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message = json?.error?.message || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return json;
}