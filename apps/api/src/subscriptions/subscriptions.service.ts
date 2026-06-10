import { ForbiddenException, Injectable } from '@nestjs/common';
import { Subscription, SubscriptionPlan } from '@prisma/client';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { PrismaService } from '../prisma/prisma.service';

const TRIAL_DAYS = 14;

type GatedFeature = 'staffManagement' | 'analytics' | 'multiBranch';

const FEATURE_LABELS: Record<GatedFeature, string> = {
  staffManagement: 'Staff management',
  analytics: 'Business analytics',
  multiBranch: 'Multi-branch support',
};

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /** Tenants created before subscriptions existed get a Starter trial. */
  async getOrCreate(tenantId: string): Promise<Subscription> {
    const existing = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + TRIAL_DAYS);

    return this.prisma.subscription.create({
      data: { tenantId, currentPeriodEnd: periodEnd },
    });
  }

  getPlans() {
    return Object.entries(PLAN_CONFIG).map(([plan, config]) => ({
      plan,
      ...config,
    }));
  }

  async getCurrent(tenantId: string) {
    const subscription = await this.getOrCreate(tenantId);
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
    };
  }

  async changePlan(tenantId: string, plan: SubscriptionPlan) {
    await this.getOrCreate(tenantId);

    // Payment collection (Paystack/Flutterwave) plugs in here; for now the
    // plan change activates immediately.
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

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
    const subscription = await this.getOrCreate(tenantId);
    const config = PLAN_CONFIG[subscription.plan];
    if (config.maxCustomers == null) return;

    const count = await this.prisma.customer.count({ where: { tenantId } });
    if (count >= config.maxCustomers) {
      throw new ForbiddenException(
        `The ${config.name} plan is limited to ${config.maxCustomers} customers. Upgrade your plan to add more.`,
      );
    }
  }

  async assertCanCreateOrder(tenantId: string) {
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
      throw new ForbiddenException(
        `The ${config.name} plan is limited to ${config.maxOrdersPerMonth} orders per month. Upgrade your plan to create more.`,
      );
    }
  }

  async assertFeature(tenantId: string, feature: GatedFeature) {
    const subscription = await this.getOrCreate(tenantId);
    const config = PLAN_CONFIG[subscription.plan];
    if (!config[feature]) {
      throw new ForbiddenException(
        `${FEATURE_LABELS[feature]} requires the Enterprise plan. Upgrade to unlock it.`,
      );
    }
  }
}
