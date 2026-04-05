import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY  = 'nextrep_access_token';
const REFRESH_TOKEN_KEY = 'nextrep_refresh_token';

type ErrorDetails = Record<string, unknown> | null;

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
    public details: ErrorDetails = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toTitle(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

function firstValidationMessage(details: ErrorDetails): string | null {
  if (!details || typeof details !== 'object') return null;

  for (const [field, value] of Object.entries(details)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return `${toTitle(field)}: ${value[0]}`;
    }
  }

  return null;
}

function extractErrorInfo(payload: any): { code: string; rawMessage: string; details: ErrorDetails } {
  const error = payload?.error;
  const code =
    (typeof error?.code === 'string' && error.code) ||
    (typeof payload?.code === 'string' && payload.code) ||
    'UNKNOWN';

  const details =
    code === 'VALIDATION_ERROR' && error && typeof error === 'object' && !Array.isArray(error)
      ? (error as Record<string, unknown>)
      : null;

  const rawMessage =
    (typeof error?.message === 'string' && error.message) ||
    (typeof error === 'string' && error) ||
    (typeof payload?.message === 'string' && payload.message) ||
    '';

  return { code, rawMessage, details };
}

function toFriendlyMessage(params: {
  code: string;
  statusCode: number;
  rawMessage: string;
  path: string;
  details: ErrorDetails;
}): string {
  const { code, statusCode, rawMessage, path, details } = params;

  if (code === 'EMAIL_TAKEN' || (statusCode === 409 && path === '/auth/register')) {
    return 'This email is already registered. Log in instead, or use a different email address.';
  }

  if (code === 'INVALID_CREDENTIALS') {
    return 'Incorrect email or password. Please check your details and try again.';
  }

  if (code === 'VALIDATION_ERROR') {
    return firstValidationMessage(details) ?? 'Some fields are invalid. Please review your entries and try again.';
  }

  if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN' || code === 'UNAUTHORIZED') {
    return 'Your session has expired. Please log in again.';
  }

  if (code === 'RATE_LIMITED' || statusCode === 429) {
    return 'Too many attempts in a short time. Please wait a moment and try again.';
  }

  if (statusCode === 400) return 'The request could not be processed. Please check your input and try again.';
  if (statusCode === 401) return 'You are not authorized. Please log in and try again.';
  if (statusCode === 403) return 'You do not have permission to perform this action.';
  if (statusCode === 404) return 'We could not find what you requested.';

  if (statusCode === 409) {
    if (rawMessage && rawMessage.toLowerCase() !== 'conflict') return rawMessage;
    return 'This action conflicts with existing data. Please review your input and try again.';
  }

  if (statusCode >= 500) {
    return 'Something went wrong on our side. Please try again in a few moments.';
  }

  if (rawMessage) return rawMessage;
  return 'Something went wrong. Please try again.';
}

export function getUserFriendlyErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
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

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Cannot reach the server. Please check your connection and ensure the API is running and reachable from your device.',
    );
  }

  // Attempt token refresh on 401
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const newToken = await getAccessToken();
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      try {
        res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
      } catch {
        throw new ApiError(
          0,
          'NETWORK_ERROR',
          'Cannot reach the server. Please check your connection and ensure the API is running and reachable from your device.',
        );
      }
    }
  }

  let json: any = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok || json?.success === false) {
    const { code, rawMessage, details } = extractErrorInfo(json);
    throw new ApiError(
      res.status,
      code,
      toFriendlyMessage({ code, statusCode: res.status, rawMessage, path, details }),
      details,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!json || typeof json !== 'object') {
    throw new ApiError(
      res.status,
      'INVALID_RESPONSE',
      'Received an unexpected response from the server. Please try again.',
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
