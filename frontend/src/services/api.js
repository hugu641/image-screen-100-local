/**
 * api.js — Frontend API client
 *
 * Priority for the server URL:
 *  1. localStorage key "server_url"  ← set from the Settings page for cloud/remote hosting
 *  2. import.meta.env.VITE_SERVER_URL ← set at build time via Vercel env variables
 *  3. window.location.origin          ← works automatically in local & production (same-origin)
 *
 * This means the TV screen just needs to know the server URL once; afterwards it persists
 * even if the browser is refreshed.
 */

function getBaseUrl() {
  // 1. Manual override (user-defined via Settings page)
  const saved = localStorage.getItem('server_url');
  if (saved && saved.trim() !== '') {
    return saved.trim().replace(/\/$/, '');
  }
  // 2. Build-time env variable (set in Vercel dashboard as VITE_SERVER_URL)
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }
  // 3. Same-origin fallback (works for local network)
  return window.location.origin;
}

export function getApiUrl() {
  return `${getBaseUrl()}/api`;
}

export function getUploadsUrl() {
  return getBaseUrl();
}

// Alias kept for backwards compat
export const UPLOADS_URL = '';  // no longer used as a static constant – use getUploadsUrl() instead

// ─── Helper to build request headers ────────────────────────────────────────

function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isMultipart) headers['Content-Type'] = 'application/json';

  return headers;
}

// ─── Global fetch wrapper ────────────────────────────────────────────────────

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.startsWith('/tv') && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Une erreur est survenue.');
  }

  return data;
}

// ─── Exported API helpers ────────────────────────────────────────────────────

export const api = {
  get(endpoint) {
    return request(`${getApiUrl()}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });
  },

  post(endpoint, body) {
    return request(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return request(`${getApiUrl()}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return request(`${getApiUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  },

  patch(endpoint, body) {
    return request(`${getApiUrl()}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body || {})
    });
  },

  upload(endpoint, formData) {
    return request(`${getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
  }
};
