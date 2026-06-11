import type { AuthUser } from '@/lib/api';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface StoredSession {
  accessToken: string;
  refreshToken: string | null;
  user: AuthUser;
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (!accessToken || !rawUser) return null;

  try {
    return {
      accessToken,
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
      user: JSON.parse(rawUser) as AuthUser,
    };
  } catch {
    return null;
  }
}

export function saveSession(data: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function saveUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isSessionExpiredError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'SESSION_EXPIRED'
  );
}
