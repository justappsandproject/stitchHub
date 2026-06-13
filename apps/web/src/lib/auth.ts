export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';
export const CUSTOMER_ROLE = 'CUSTOMER';

export function isSuperAdmin(role?: string | null) {
  return role === SUPER_ADMIN_ROLE;
}

export function isCustomer(role?: string | null) {
  return role === CUSTOMER_ROLE;
}

export function isStaff(role?: string | null) {
  if (!role || isSuperAdmin(role) || isCustomer(role)) return false;
  return true;
}

export function homePathForRole(role?: string | null) {
  if (isSuperAdmin(role)) return '/admin';
  if (isCustomer(role)) return '/customer';
  return '/dashboard';
}
