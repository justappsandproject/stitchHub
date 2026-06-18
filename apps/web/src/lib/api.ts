const DEFAULT_LOCAL_API = 'http://localhost:3001/api/v1';
const DEFAULT_PRODUCTION_API = 'https://stitchhub-gb1w.onrender.com/api/v1';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return DEFAULT_PRODUCTION_API;
  }
  return DEFAULT_LOCAL_API;
}

function networkError(): ApiError {
  const url = getApiUrl();
  const hint = url.includes('localhost')
    ? 'Start the API with: pnpm dev:api'
    : 'Check your internet connection or try again later.';
  return {
    message: `Cannot reach API at ${url}. ${hint}`,
    statusCode: 0,
    code: 'NETWORK_ERROR',
  };
}

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
        const res = await fetch(`${getApiUrl()}/auth/refresh`, {
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

  return fetch(`${getApiUrl()}${path}`, { ...fetchOptions, headers });
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

  let res: Response;
  try {
    res = await rawFetch(path, fetchOptions, token);
  } catch {
    throw networkError();
  }

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

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('accessToken') ?? undefined
    : undefined;

  const formData = new FormData();
  formData.append('file', file);

  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw networkError();
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
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

  registerCustomer: (data: RegisterCustomerData) =>
    api<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/register/customer',
      { method: 'POST', body: JSON.stringify(data) },
    ),

  getProfile: () => api<AuthUser>('/auth/me'),

  updateProfile: (data: Partial<AuthUser>) =>
    api<AuthUser>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    api<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    api<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  registerDeviceToken: (token: string, platform = 'web') =>
    api<{ message: string }>('/notifications/device-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const dashboardApi = {
  get: () => api<DashboardData | SuperAdminDashboardData>('/dashboard'),
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
  getCurrent: () =>
    api<{
      plan: string;
      status: string;
      configName?: string;
      priceNgn?: number;
      usageCustomers?: number;
      maxCustomers?: number;
      usageOrdersThisMonth?: number;
      maxOrdersPerMonth?: number;
    }>('/subscriptions/current'),

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
  phone?: string | null;
  photoUrl?: string | null;
  customerId?: string | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
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

export interface RegisterCustomerData {
  tenantSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface DashboardData {
  summary: {
    totalCustomers?: number;
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    totalRevenue?: number;
    outstandingBalance: number;
  };
  ordersByStatus?: { status: string; count: number }[];
  recentOrders?: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    balanceAmount?: number;
    customer?: { firstName: string; lastName: string };
    style?: { name: string } | null;
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

export interface StyleRecord {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  photoUrls: string[];
  videoUrls: string[];
  basePrice?: number | string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerDetail extends CustomerRecord {
  gender?: string | null;
  address?: string | null;
  notes?: string | null;
  tags: string[];
  photoUrl?: string | null;
  user?: {
    id: string;
    email: string;
    role: string;
    lastLoginAt?: string | null;
  } | null;
  measurements: Array<{
    id: string;
    values: Record<string, number>;
    notes?: string | null;
    createdAt: string;
    template?: { id: string; name: string; category: string };
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    style?: { id: string; name: string; category: string } | null;
  }>;
  _count: { orders: number; measurements: number };
  tenantPlan?: string;
  tenantSubscriptionStatus?: string;
  tenantUsage?: {
    customers: number;
    ordersThisMonth: number;
    measurements: number;
  };
}

export interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  isVip: boolean;
  tags?: string[];
  _count?: { orders: number; measurements: number };
}

export const customersApi = {
  list: (q?: string) =>
    api<CustomerRecord[]>(
      `/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  get: (id: string) => api<CustomerDetail>(`/customers/${id}`),
};

export const stylesApi = {
  list: (params?: { q?: string; category?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.category) search.set('category', params.category);
    const qs = search.toString();
    return api<StyleRecord[]>(`/styles${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api<StyleRecord>(`/styles/${id}`),
  create: (data: Partial<StyleRecord>) =>
    api<StyleRecord>('/styles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<StyleRecord>) =>
    api<StyleRecord>(`/styles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    api(`/styles/${id}`, { method: 'DELETE' }),
  tryOn: (id: string, body?: Record<string, string>) =>
    api<{
      tryOnImageUrl: string | null;
      previewUrl: string | null;
      placeholder: boolean;
      disclaimer: string;
      integrationNote?: string;
      styleName: string;
      generatedAt: string;
      expiresAt: string;
    }>(`/styles/${id}/try-on`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  lookbook: (params?: {
    tenantSlug?: string;
    fashionHouseId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const search = new URLSearchParams();
    if (params?.tenantSlug) search.set('tenantSlug', params.tenantSlug);
    if (params?.fashionHouseId) search.set('fashionHouseId', params.fashionHouseId);
    if (params?.category) search.set('category', params.category);
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return api<{ items: StyleRecord[]; total: number; page: number; limit: number }>(
      `/styles/lookbook${qs ? `?${qs}` : ''}`,
    );
  },
};

export const paymentsApi = {
  createInvoice: (data: {
    orderId: string;
    amount: number;
    dueDate?: string;
    notes?: string;
  }) =>
    api('/payments/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listInvoices: (orderId?: string) =>
    api<Array<Record<string, unknown>>>(
      `/payments/invoices${orderId ? `?orderId=${orderId}` : ''}`,
    ),
};

export const ordersApi = {
  create: (data: {
    customerId?: string;
    styleId?: string;
    fabric?: string;
    deliveryDate?: string;
    priority?: string;
    notes?: string;
    totalAmount?: number;
    depositAmount?: number;
    discountCode?: string;
  }) =>
    api('/orders', { method: 'POST', body: JSON.stringify(data) }),
};
