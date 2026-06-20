import { UserRole } from './index';

export type Permission =
  | 'dashboard'
  | 'customers'
  | 'measurements'
  | 'orders'
  | 'styles'
  | 'production'
  | 'inventory'
  | 'payments'
  | 'financials'
  | 'messages'
  | 'settings'
  | 'staff'
  | 'tickets';

const ALL_STAFF: Permission[] = [
  'dashboard',
  'customers',
  'measurements',
  'orders',
  'styles',
  'production',
  'inventory',
  'payments',
  'financials',
  'messages',
  'settings',
  'staff',
  'tickets',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ALL_STAFF,
  [UserRole.TENANT_OWNER]: ALL_STAFF,
  [UserRole.MANAGER]: ALL_STAFF.filter((p) => p !== 'staff'),
  [UserRole.TAILOR]: [
    'dashboard',
    'orders',
    'measurements',
    'production',
    'messages',
    'settings',
  ],
  [UserRole.CUTTER]: [
    'dashboard',
    'orders',
    'measurements',
    'production',
    'messages',
    'settings',
  ],
  [UserRole.FINISHER]: [
    'dashboard',
    'orders',
    'production',
    'messages',
    'settings',
  ],
  [UserRole.APPRENTICE]: [
    'dashboard',
    'orders',
    'production',
    'messages',
    'settings',
  ],
  [UserRole.CUSTOMER]: [
    'dashboard',
    'orders',
    'measurements',
    'messages',
    'settings',
    'tickets',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const BODY_MEASUREMENT_FIELDS = {
  upperBody: [
    'chestBust',
    'shoulderWidth',
    'sleeveLength',
    'armLength',
    'neck',
    'armhole',
  ],
  lowerBody: ['waist', 'hip', 'thigh', 'inseam', 'outseam', 'trouserLength'],
  fullBody: ['height', 'backLength', 'frontLength', 'dressLength'],
} as const;

export const BODY_MEASUREMENT_LABELS: Record<string, string> = {
  chestBust: 'Chest / Bust',
  shoulderWidth: 'Shoulder Width',
  sleeveLength: 'Sleeve Length',
  armLength: 'Arm Length',
  neck: 'Neck',
  armhole: 'Armhole',
  waist: 'Waist',
  hip: 'Hip',
  thigh: 'Thigh',
  inseam: 'Inseam',
  outseam: 'Outseam',
  trouserLength: 'Trouser Length',
  height: 'Height',
  backLength: 'Back Length',
  frontLength: 'Front Length',
  dressLength: 'Dress Length',
};
