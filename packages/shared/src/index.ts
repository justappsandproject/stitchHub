// Const objects (not TS enums) so Node's native type-stripping can load this package.

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_OWNER: 'TENANT_OWNER',
  MANAGER: 'MANAGER',
  TAILOR: 'TAILOR',
  CUTTER: 'CUTTER',
  FINISHER: 'FINISHER',
  APPRENTICE: 'APPRENTICE',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
  NEW: 'NEW',
  MEASURED: 'MEASURED',
  CUTTING: 'CUTTING',
  SEWING: 'SEWING',
  FITTING: 'FITTING',
  FINISHING: 'FINISHING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  PAYSTACK: 'PAYSTACK',
  FLUTTERWAVE: 'FLUTTERWAVE',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const MeasurementCategory = {
  MEN: 'MEN',
  WOMEN: 'WOMEN',
  CHILDREN: 'CHILDREN',
} as const;
export type MeasurementCategory =
  (typeof MeasurementCategory)[keyof typeof MeasurementCategory];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const SubscriptionPlan = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface PlanConfig {
  name: string;
  priceNgn: number;
  tagline: string;
  /** null = unlimited */
  maxCustomers: number | null;
  /** null = unlimited */
  maxOrdersPerMonth: number | null;
  staffManagement: boolean;
  analytics: boolean;
  multiBranch: boolean;
  features: string[];
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  STARTER: {
    name: 'Starter',
    priceNgn: 5000,
    tagline: 'For solo tailors getting started',
    maxCustomers: 100,
    maxOrdersPerMonth: 50,
    staffManagement: false,
    analytics: false,
    multiBranch: false,
    features: [
      'Up to 100 customers',
      'Up to 50 orders per month',
      'Digital measurement vault',
      'Invoices & receipts',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    priceNgn: 10000,
    tagline: 'For growing fashion businesses',
    maxCustomers: null,
    maxOrdersPerMonth: null,
    staffManagement: false,
    analytics: false,
    multiBranch: false,
    features: [
      'Unlimited customers',
      'Unlimited orders',
      'Unlimited measurements',
      'Production kanban board',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceNgn: 25000,
    tagline: 'For fashion houses & multi-branch ateliers',
    maxCustomers: null,
    maxOrdersPerMonth: null,
    staffManagement: true,
    analytics: true,
    multiBranch: true,
    features: [
      'Everything in Professional',
      'Multi-branch support',
      'Staff management',
      'Business analytics',
      'Dedicated support',
    ],
  },
};

export const ORDER_STATUS_PROGRESS: Record<OrderStatus, number> = {
  NEW: 0,
  MEASURED: 10,
  CUTTING: 25,
  SEWING: 45,
  FITTING: 65,
  FINISHING: 80,
  READY: 95,
  DELIVERED: 100,
  CANCELLED: 0,
};

export const STAFF_ROLES: UserRole[] = [
  UserRole.TENANT_OWNER,
  UserRole.MANAGER,
  UserRole.TAILOR,
  UserRole.CUTTER,
  UserRole.FINISHER,
  UserRole.APPRENTICE,
];

export const TENANT_ROLES: UserRole[] = [...STAFF_ROLES, UserRole.CUSTOMER];

export * from './permissions';
