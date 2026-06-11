export const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

export function isSuperAdmin(role?: string | null) {
  return role === SUPER_ADMIN_ROLE;
}
