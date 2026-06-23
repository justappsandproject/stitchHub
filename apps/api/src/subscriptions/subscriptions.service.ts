import { ForbiddenException, Injectable } from '@nestjs/common';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  PlanLimitReachedException,
  planLimitMessage,
} from './plan-limit.exception';

const TRIAL_DAYS = 14;

export class SubscriptionSuspendedException extends ForbiddenException {
  constructor(message?: string) {
    super({
      statusCode: 403,
      code: 'SUBSCRIPTION_SUSPENDED',
      message:
        message ??
        'Your trial has ended. Please make a payment on the Billing page to continue using StitchHub.',
    });
  }
}

type GatedFeature =
  | 'staffManagement'
  | 'styleStore'
  | 'messaging'
  | 'financialReports'
  | 'analytics'
  | 'multiBranch';

const FEATURE_LABELS: Record<GatedFeature, string> = {
  staffManagement: 'Staff management',
  styleStore: 'Style Store',
  messaging: 'Real-time messaging',
  financialReports: 'Financial reports',
  analytics: 'Business analytics',
  multiBranch: 'Multi-branch support',
};

const FEATURE_RESOURCE: Record<GatedFeature, import('./plan-limit.exception').PlanResource> = {
  staffManagement: 'staff',
  styleStore: 'styleStore',
  messaging: 'messaging',
  financialReports: 'financialReports',
  analytics: 'financialReports',
  multiBranch: 'staff',
};

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /** New tenants start on the Free plan. */
  async getOrCreate(tenantId: string): Promise<Subscription> {
    const existing = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;

    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 10);

    return this.prisma.subscription.create({
      data: {
        tenantId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  getPlans() {
    return Object.entries(PLAN_CONFIG).map(([plan, config]) => ({
      plan,
      ...config,
    }));
  }

  /** Sync expired trials → PAST_DUE and suspend tenant access. */
  async syncExpiredTrial(tenantId: string): Promise<Subscription> {
    const subscription = await this.getOrCreate(tenantId);
    const now = new Date();

    if (
      subscription.plan !== SubscriptionPlan.FREE &&
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.currentPeriodEnd < now
    ) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { isActive: false },
      });
      return this.prisma.subscription.update({
        where: { tenantId },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    }

    if (
      subscription.status === SubscriptionStatus.PAST_DUE &&
      subscription.currentPeriodEnd < now
    ) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { isActive: false },
      });
    }

    return subscription;
  }

  async assertTenantAccess(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });
    if (!tenant) throw new SubscriptionSuspendedException();

    if (!tenant.isActive) {
      throw new SubscriptionSuspendedException(
        tenant.subscription?.status === SubscriptionStatus.PAST_DUE
          ? 'Your account is suspended. Go to Billing and pay via Paystack to restore access.'
          : 'This fashion house account has been deactivated by the platform administrator.',
      );
    }

    const subscription = await this.syncExpiredTrial(tenantId);
    if (
      subscription.status === SubscriptionStatus.PAST_DUE ||
      subscription.status === SubscriptionStatus.CANCELLED
    ) {
      throw new SubscriptionSuspendedException();
    }
  }

  async adminChangePlan(tenantId: string, plan: SubscriptionPlan) {
    await this.getOrCreate(tenantId);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
    });

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  async getCurrent(tenantId: string) {
    const subscription = await this.syncExpiredTrial(tenantId);
    const config = PLAN_CONFIG[subscription.plan];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [customers, ordersThisMonth, measurements] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.order.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.measurement.count({ where: { tenantId } }),
    ]);

    return {
      ...subscription,
      config,
      usage: { customers, ordersThisMonth, measurements },
      isSuspended:
        subscription.status === SubscriptionStatus.PAST_DUE ||
        subscription.status === SubscriptionStatus.CANCELLED,
      requiresPayment:
        subscription.status === SubscriptionStatus.PAST_DUE ||
        (subscription.status === SubscriptionStatus.TRIALING &&
          subscription.currentPeriodEnd < new Date()),
    };
  }

  async changePlan(tenantId: string, plan: SubscriptionPlan) {
    await this.getOrCreate(tenantId);

    // Without Paystack configured, activate immediately (dev/demo).
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: true },
    });

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  async assertCanAddCustomer(tenantId: string) {
    await this.assertTenantAccess(tenantId);
    const subscription = await this.getOrCreate(tenantId);
    const config = PLAN_CONFIG[subscription.plan];
    if (config.maxCustomers == null) return;

    const count = await this.prisma.customer.count({ where: { tenantId } });
    if (count >= config.maxCustomers) {
      throw new PlanLimitReachedException(
        'customers',
        planLimitMessage(subscription.plan, 'customers', config.maxCustomers),
      );
    }
  }

  async assertCanCreateOrder(tenantId: string) {
    await this.assertTenantAccess(tenantId);
    const subscription = await this.getOrCreate(tenantId);
    const config = PLAN_CONFIG[subscription.plan];
    if (config.maxOrdersPerMonth == null) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.order.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    });
    if (count >= config.maxOrdersPerMonth) {
      throw new PlanLimitReachedException(
        'orders',
        planLimitMessage(
          subscription.plan,
          'orders',
          config.maxOrdersPerMonth,
        ),
      );
    }
  }

  async assertFeature(tenantId: string, feature: GatedFeature) {
    await this.assertTenantAccess(tenantId);
    const subscription = await this.getOrCreate(tenantId);
    const config = PLAN_CONFIG[subscription.plan];
    if (!config[feature]) {
      throw new PlanLimitReachedException(
        FEATURE_RESOURCE[feature],
        planLimitMessage(subscription.plan, FEATURE_RESOURCE[feature]),
      );
    }
  }
}
