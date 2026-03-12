import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY  = 'nextrep_access_token';
const REFRESH_TOKEN_KEY = 'nextrep_refresh_token';

// ─── Token storage ─────────────────────────────────────────────────────────────
export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });

  // Attempt token refresh on 401
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = await getAccessToken();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    }
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      res.status,
      json.error?.code ?? json.code ?? 'UNKNOWN',
      json.error?.message ?? json.error ?? 'Request failed',
    );
  }

  return json.data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      await saveTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    }
  } catch {}
  return false;
}

// ─── API surfaces ──────────────────────────────────────────────────────────────
export const api = {
  // Auth
  auth: {
    register: (body: { email: string; password: string; displayName: string }) =>
      apiFetch<any>('/auth/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
    login: (body: { email: string; password: string }) =>
      apiFetch<any>('/auth/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
    refresh: (refreshToken: string) =>
      apiFetch<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }), skipAuth: true }),
    logout: () =>
      apiFetch<void>('/auth/logout', { method: 'DELETE' }),
  },

  // Exercises
  exercises: {
    list: (params?: { muscle?: string; q?: string; category?: string }) =>
      apiFetch<any[]>(`/exercises?${new URLSearchParams(params as any).toString()}`),
    get: (id: string) => apiFetch<any>(`/exercises/${id}`),
    create: (body: any) => apiFetch<any>('/exercises', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Templates
  templates: {
    list: () => apiFetch<any[]>('/templates'),
    get: (id: string) => apiFetch<any>(`/templates/${id}`),
    create: (body: any) => apiFetch<any>('/templates', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => apiFetch<void>(`/templates/${id}`, { method: 'DELETE' }),
  },

  // Workouts
  workouts: {
    list: (page = 1, limit = 20) => apiFetch<any>(`/workouts?page=${page}&limit=${limit}`),
    get: (id: string) => apiFetch<any>(`/workouts/${id}`),
    create: (body: any) => apiFetch<any>('/workouts', { method: 'POST', body: JSON.stringify(body) }),
    sync: (sessions: any[]) => apiFetch<any>('/workouts/sync', { method: 'POST', body: JSON.stringify({ sessions }) }),
    remove: (id: string) => apiFetch<void>(`/workouts/${id}`, { method: 'DELETE' }),
    calendar: () => apiFetch<any[]>('/workouts/calendar'),
  },

  // Analytics
  analytics: {
    overview: () => apiFetch<any>('/analytics/overview'),
    strength: (exerciseId: string, days = 90) => apiFetch<any[]>(`/analytics/strength/${exerciseId}?days=${days}`),
    volume: (weeks = 12) => apiFetch<any[]>(`/analytics/volume?weeks=${weeks}`),
    frequency: () => apiFetch<any[]>('/analytics/frequency'),
    tonnage: (weeks = 8) => apiFetch<any[]>(`/analytics/tonnage?weeks=${weeks}`),
    muscleBalance: (days = 30) => apiFetch<any[]>(`/analytics/muscle-balance?days=${days}`),
    duration: (weeks = 12) => apiFetch<any[]>(`/analytics/duration?weeks=${weeks}`),
    records: () => apiFetch<any[]>('/analytics/records'),
  },

  // Body measurements
  body: {
    list: (limit = 30) => apiFetch<any[]>(`/body-measurements?limit=${limit}`),
    create: (body: any) => apiFetch<any>('/body-measurements', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => apiFetch<any>(`/body-measurements/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id: string) => apiFetch<void>(`/body-measurements/${id}`, { method: 'DELETE' }),
  },

  // Records
  records: {
    list: () => apiFetch<any[]>('/records'),
    forExercise: (exerciseId: string) => apiFetch<any[]>(`/records/${exerciseId}`),
  },

  // Streaks
  streaks: {
    get: () => apiFetch<any>('/streaks'),
    calendar: (months = 3) => apiFetch<any[]>(`/streaks/calendar?months=${months}`),
  },

  // Milestones
  milestones: {
    list: () => apiFetch<any[]>('/milestones'),
  },
};
