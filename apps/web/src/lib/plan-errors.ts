import type { PlanResource } from '@/lib/api';

export function isPlanLimitError(
  err: unknown,
): err is { code: 'PLAN_LIMIT_REACHED'; message?: string; resource?: PlanResource } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'PLAN_LIMIT_REACHED'
  );
}
