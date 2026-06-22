import api from './api';

const TOKEN_KEY = 'student_planner_token';
const USER_KEY = 'student_planner_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function persistSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function register({ email, password, fullname }) {
  const { data } = await api.post('/auth/register', {
    email,
    password,
    fullname,
  });
  persistSession(data.token, data.user);
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  persistSession(data.token, data.user);
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Client-side logout still succeeds if the token is already invalid.
  } finally {
    clearSession();
  }
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}
