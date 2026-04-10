import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// ── Base URL (mirrors AuthContext logic) ──────────────────────────────────────
export const getBaseUrl = (): string => {
  if (Platform.OS === 'web') return 'http://localhost:8080';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:8080`;
  return 'http://10.0.2.2:8080';
};

export const BASE_URL = getBaseUrl();

let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (handler: () => void) => {
  onUnauthorized = handler;
};

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'auth_token';

export const getStoredToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== 'web') return await SecureStore.getItemAsync(TOKEN_KEY);
    return null;
  } catch {
    return null;
  }
};

// ── Structured API error ──────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const parseErrorMessage = async (res: Response): Promise<string> => {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.message ?? json.error ?? text;
    } catch {
      return text || `Request failed (${res.status})`;
    }
  } catch {
    return `Request failed (${res.status})`;
  }
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  token?: string | null;
  /** Skip auth header — for public endpoints */
  noAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, noAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!noAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

// ── Exported helpers ──────────────────────────────────────────────────────────
export const apiGet = <T>(path: string, token?: string | null) =>
  request<T>(path, { token, noAuth: !token });

export const apiPost = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: 'POST', body, token });

export const apiPatch = <T>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, { method: 'PATCH', body, token });

export const apiDelete = <T>(path: string, token?: string | null) =>
  request<T>(path, { method: 'DELETE', token });
