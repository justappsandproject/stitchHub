'use client';

import { Check, CreditCard } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api, billingApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PlanInfo {
  plan: string;
  name: string;
  priceNgn: number;
  tagline: string;
  maxCustomers: number | null;
  maxOrdersPerMonth: number | null;
  features: string[];
}

interface CurrentSubscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  isSuspended?: boolean;
  requiresPayment?: boolean;
  config: {
    name: string;
    priceNgn: number;
    maxCustomers: number | null;
    maxOrdersPerMonth: number | null;
  };
  usage: {
    customers: number;
    ordersThisMonth: number;
    measurements: number;
  };
}

const statusLabels: Record<string, string> = {
  TRIALING: 'Free trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due — payment required',
  CANCELLED: 'Cancelled',
};

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const nearLimit = pct !== null && pct >= 80;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-medium', nearLimit && 'text-destructive')}>
          {used.toLocaleString()} / {limit ? limit.toLocaleString() : '∞'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            nearLimit ? 'bg-destructive' : 'bg-primary',
          )}
          style={{ width: `${pct ?? (used > 0 ? 8 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [paystackEnabled, setPaystackEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [sub, planList, paystack] = await Promise.all([
        api<CurrentSubscription>('/subscriptions/current'),
        api<PlanInfo[]>('/subscriptions/plans'),
        billingApi.getPaystackConfig(),
      ]);
      setCurrent(sub);
      setPlans(planList);
      setPaystackEnabled(paystack.enabled);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) return;

    billingApi
      .verifyPaystack(reference)
      .then(() => {
        setSuccess('Payment successful! Your subscription is now active.');
        loadData();
        window.history.replaceState({}, '', '/dashboard/billing');
      })
      .catch((err: { message?: string }) => {
        setError(err.message ?? 'Payment verification failed');
      });
  }, [searchParams, loadData]);

  async function handlePay(plan: string) {
    setError('');
    setSuccess('');
    setPaying(plan);
    try {
      if (paystackEnabled) {
        const init = await billingApi.initializePaystack(plan);
        window.location.href = init.authorizationUrl;
        return;
      }
      await api('/subscriptions/change-plan', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      setSuccess('Plan activated successfully.');
      await loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Payment failed');
    } finally {
      setPaying(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading billing...</p>;
  }

  const suspended =
    current?.isSuspended ||
    current?.requiresPayment ||
    current?.status === 'PAST_DUE';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Billing
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your subscription plan and usage
        </p>
      </div>

      {suspended && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-amber-900">Account suspended</CardTitle>
            <CardDescription className="text-amber-800/80">
              Your 14-day trial has ended. Choose a plan below and pay with
              Paystack to restore access to customers, orders, and all atelier
              features.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-success/10 p-3 text-sm text-success">
          {success}
        </div>
      )}

      {current && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-2xl">
                  {current.config.name} plan
                </CardTitle>
                <CardDescription>
                  ₦{current.config.priceNgn.toLocaleString()}/month ·{' '}
                  {statusLabels[current.status] ?? current.status}
                  {' · '}
                  {current.status === 'TRIALING' ? 'Trial ends' : 'Renews'}{' '}
                  {new Date(current.currentPeriodEnd).toLocaleDateString()}
                </CardDescription>
              </div>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  current.status === 'ACTIVE'
                    ? 'bg-success/10 text-success'
                    : current.status === 'TRIALING'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-destructive/10 text-destructive',
                )}
              >
                {statusLabels[current.status] ?? current.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              label="Customers"
              used={current.usage.customers}
              limit={current.config.maxCustomers}
            />
            <UsageBar
              label="Orders this month"
              used={current.usage.ordersThisMonth}
              limit={current.config.maxOrdersPerMonth}
            />
            <UsageBar
              label="Measurements"
              used={current.usage.measurements}
              limit={null}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold">Plans</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = current?.plan === plan.plan;
            const isPopular = plan.plan === 'PROFESSIONAL';
            return (
              <Card
                key={plan.plan}
                className={cn(
                  'relative flex flex-col',
                  isPopular && 'border-primary shadow-md',
                  isCurrent && 'ring-2 ring-gold',
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <p className="pt-2">
                    <span className="font-display text-3xl font-semibold">
                      ₦{plan.priceNgn.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-6 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrent && !suspended ? 'outline' : 'default'}
                    disabled={
                      (isCurrent && !suspended) || paying !== null
                    }
                    onClick={() => handlePay(plan.plan)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isCurrent && !suspended
                      ? 'Current plan'
                      : paying === plan.plan
                        ? 'Processing...'
                        : paystackEnabled
                          ? `Pay with Paystack`
                          : `Activate ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {paystackEnabled
          ? 'Payments are processed securely via Paystack. Add PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY on the API server.'
          : 'Paystack is not configured — plans activate instantly in demo mode. Add Paystack keys to enable live payments.'}
      </p>
    </div>
  );
}
