const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
}

function clearSessionStorage() {
  if (typeof window === 'undefined') return;
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
      clearSessionStorage();
      throw {
        message: 'Session expired',
        statusCode: 401,
        code: 'SESSION_EXPIRED',
      } satisfies ApiError;
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

  getProfile: () => api<AuthUser>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const dashboardApi = {
  get: (token: string) => api<DashboardData | SuperAdminDashboardData>('/dashboard', { token }),
};

export const tenantsApi = {
  list: (token: string) => api<TenantRecord[]>('/tenants', { token }),

  adminUpdate: (
    tenantId: string,
    data: { isActive?: boolean; plan?: string },
  ) =>
    api(`/tenants/${tenantId}/admin`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  resetOwnerPassword: (tenantId: string, newPassword: string) =>
    api(`/tenants/${tenantId}/owner-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),
};

export const messagesApi = {
  listThreads: () => api<MessageThread[]>('/messages/threads'),

  unreadCount: () => api<{ count: number }>('/messages/unread-count'),

  getThread: (tenantId: string) =>
    api<MessageThreadDetail>(`/messages/tenant/${tenantId}`),

  getInbox: () => api<MessageThreadDetail>('/messages/inbox'),

  send: (body: string, tenantId?: string) =>
    api('/messages', {
      method: 'POST',
      body: JSON.stringify({ body, tenantId }),
    }),

  markRead: (tenantId: string) =>
    api(`/messages/tenant/${tenantId}/read`, { method: 'PATCH' }),
};

export const billingApi = {
  getPaystackConfig: () =>
    api<{ enabled: boolean; publicKey: string | null }>(
      '/subscriptions/paystack/config',
    ),

  initializePaystack: (plan: string) =>
    api<{
      authorizationUrl: string;
      reference: string;
      amount: number;
      plan: string;
    }>('/subscriptions/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  verifyPaystack: (reference: string) =>
    api<{ status: string; plan: string }>(
      `/subscriptions/paystack/verify?reference=${encodeURIComponent(reference)}`,
    ),
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
  summary: {
    totalCustomers: number;
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
    outstandingBalance: number;
  };
  ordersByStatus?: { status: string; count: number }[];
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    customer: { firstName: string; lastName: string };
  }>;
}

export interface SuperAdminDashboardData {
  summary: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalOrders: number;
    monthlyRecurringRevenue: number;
  };
  planBreakdown?: Array<{
    plan: string;
    status: string;
    count: number;
  }>;
  recentTenants?: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    subscription?: { plan: string; status: string } | null;
    _count: { customers: number; orders: number };
  }>;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  _count: { users: number; customers: number; orders: number };
  users?: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface MessageThread {
  tenantId: string;
  tenantName: string;
  slug: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    readAt: string | null;
    isUnread?: boolean;
    sender: { role: string; firstName: string; lastName: string };
  } | null;
}

export interface PlatformMessage {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  };
}

export interface MessageThreadDetail {
  tenant: { id: string; name: string };
  messages: PlatformMessage[];
  unreadCount?: number;
}
