const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiError {
  message: string;
  statusCode: number;
}

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// Shared across concurrent 401s so the refresh token (which is single-use)
// is only exchanged once.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;

        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function rawFetch(
  path: string,
  fetchOptions: RequestInit,
  token?: string,
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token: explicitToken, ...fetchOptions } = options;

  const isBrowser = typeof window !== 'undefined';
  const isAuthRoute = path.startsWith('/auth/');
  const token =
    explicitToken ??
    (isBrowser ? localStorage.getItem('accessToken') ?? undefined : undefined);

  let res = await rawFetch(path, fetchOptions, token);

  // On 401, try one token refresh and retry the original request.
  if (res.status === 401 && isBrowser && !isAuthRoute) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawFetch(path, fetchOptions, newToken);
    } else {
      clearSession();
      window.location.href = '/login';
      // Halt callers while the redirect happens.
      return new Promise<never>(() => {});
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: res.statusText,
      statusCode: res.status,
    }));
    throw error;
  }

  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),

  registerTenant: (data: RegisterTenantData) =>
    api<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/register/tenant',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  getProfile: (token: string) =>
    api<AuthUser>('/auth/me', { token }),
};

export const dashboardApi = {
  get: (token: string) => api<DashboardData>('/dashboard', { token }),
};

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  firstName: string;
  lastName: string;
  fashionHouseName: string | null;
}

export interface RegisterTenantData {
  businessName: string;
  slug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface DashboardData {
  summary: Record<string, number>;
  ordersByStatus?: { status: string; count: number }[];
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    customer: { firstName: string; lastName: string };
  }>;
  recentTenants?: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    _count: { customers: number; orders: number };
  }>;
}
