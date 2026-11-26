const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const body = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    throw new Error(body.message || 'Permintaan tidak dapat diproses.');
  }
  return body;
}

export function jsonBody(value) {
  return JSON.stringify(value);
}
