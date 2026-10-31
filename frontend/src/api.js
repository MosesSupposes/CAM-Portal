const apiEnvironment = (import.meta.env.VITE_API_ENV || {
  development: 'dev',
  production: 'prod',
  staging: 'staging',
}[import.meta.env.MODE] || 'dev').toLowerCase();

const apiUrls = {
  dev: import.meta.env.VITE_API_URL_DEV || 'http://localhost:8000/api/v1',
  staging: import.meta.env.VITE_API_URL_STAGING || 'https://cam-backend-staging.fly.dev/api/v1',
  prod: import.meta.env.VITE_API_URL_PROD || 'https://cam-backend.fly.dev/api/v1',
};

const BASE = apiUrls[apiEnvironment];

if (!BASE) {
  throw new Error(`Set VITE_API_URL_${apiEnvironment.toUpperCase()} for the ${apiEnvironment} API`);
}

export function setAuthToken(token) {
  if (token) localStorage.setItem('cam_auth_token', token);
  else localStorage.removeItem('cam_auth_token');
}

async function request(path, options = {}) {
  const token = localStorage.getItem('cam_auth_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const responseText = await res.text();
  let body = {};
  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      throw new Error(res.ok ? 'The API returned an invalid response' : `Request failed: ${res.status}`);
    }
  }
  if (!res.ok) throw new Error(body.message || `Request failed: ${res.status}`);
  return body;
}

export async function apiGet(path) {
  const body = await request(path);
  return body.data ?? body.user;
}

export async function apiPost(path, body) {
  return (await request(path, { method: 'POST', body: JSON.stringify(body) })).data;
}

export async function apiPut(path, body) {
  return (await request(path, { method: 'PUT', body: JSON.stringify(body) })).data;
}

export async function apiDelete(path) {
  return (await request(path, { method: 'DELETE' })).data;
}

export async function apiAuth(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}
