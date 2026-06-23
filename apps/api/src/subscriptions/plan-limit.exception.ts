import { ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PLAN_CONFIG } from '@stitchhub/shared';

export type PlanResource =
  | 'customers'
  | 'orders'
  | 'staff'
  | 'styleStore'
  | 'messaging'
  | 'financialReports';

export class PlanLimitReachedException extends ForbiddenException {
  constructor(resource: PlanResource, message: string) {
    super({
      statusCode: 403,
      code: 'PLAN_LIMIT_REACHED',
      resource,
      upgradeRequired: true,
      message,
    });
  }
}

export function planLimitMessage(
  plan: SubscriptionPlan,
  resource: PlanResource,
  limit?: number,
): string {
  const name = PLAN_CONFIG[plan]?.name ?? plan;
  switch (resource) {
    case 'customers':
      return `You've reached the ${limit} customer limit on the ${name} plan.`;
    case 'orders':
      return `You've reached the ${limit} orders per month limit on the ${name} plan.`;
    case 'staff':
      return `Staff accounts are not included on the ${name} plan.`;
    case 'styleStore':
      return `Style Store is not available on the ${name} plan.`;
    case 'messaging':
      return `Real-time messaging is not available on the ${name} plan.`;
    case 'financialReports':
      return `Financial reports are not available on the ${name} plan.`;
    default:
      return `This feature requires a plan upgrade.`;
  }
}
