'use client';

import {
  Building2,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dashboardApi, type SuperAdminDashboardData } from '@/lib/api';
import { PLAN_CONFIG } from '@stitchhub/shared';

const statConfig = [
  { key: 'totalTenants', label: 'Fashion Houses', icon: Building2 },
  { key: 'activeTenants', label: 'Active Houses', icon: Building2 },
  { key: 'totalUsers', label: 'Platform Users', icon: Users },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingBag },
  {
    key: 'monthlyRecurringRevenue',
    label: 'Monthly Recurring Revenue',
    icon: TrendingUp,
    format: 'currency' as const,
  },
] as const;

const planColors: Record<string, string> = {
  STARTER: 'bg-violet-500',
  PROFESSIONAL: 'bg-rose-500',
  ENTERPRISE: 'bg-amber-500',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'text-emerald-600 bg-emerald-500/10',
  TRIALING: 'text-violet-600 bg-violet-500/10',
  PAST_DUE: 'text-amber-600 bg-amber-500/10',
  CANCELLED: 'text-muted-foreground bg-muted',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      setError('Not signed in');
      return;
    }

    dashboardApi
      .get()
      .then((res) => {
        const payload = res as SuperAdminDashboardData;
        if (!payload.summary) {
          throw { message: 'Invalid dashboard response' };
        }
        setData(payload);
      })
      .catch((err: unknown) => {
        const apiErr = err as { message?: string };
        setError(apiErr.message ?? 'Failed to load platform overview');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading platform overview...</p>;
  }

  if (!data?.summary) {
    return (
      <p className="text-muted-foreground">
        {error || 'Failed to load platform overview. Is the API running?'}
      </p>
    );
  }

  const planTotals = Object.keys(PLAN_CONFIG).map((plan) => {
    const active = data.planBreakdown
      ?.filter((p) => p.plan === plan && p.status === 'ACTIVE')
      .reduce((sum, p) => sum + p.count, 0);
    return { plan, count: active ?? 0 };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Platform Overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          StitchHub health, revenue, and fashion house activity at a glance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          const value = data.summary[stat.key] ?? 0;
          const display =
            'format' in stat && stat.format === 'currency' ? (
              <>
                <span className="mr-0.5 font-sans text-xl font-semibold text-muted-foreground">
                  ₦
                </span>
                {Number(value).toLocaleString()}
              </>
            ) : (
              Number(value).toLocaleString()
            );

          return (
            <Card key={stat.key} className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold">{display}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>Active fashion houses by plan tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planTotals.map(({ plan, count }) => {
              const config = PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG];
              const total = data.summary.activeTenants || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{config.name}</span>
                    <span className="text-muted-foreground">
                      {count} houses · ₦{config.priceNgn.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${planColors[plan] ?? 'bg-primary'}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Breakdown across all fashion houses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.planBreakdown?.map((item) => (
                <div
                  key={`${item.plan}-${item.status}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {PLAN_CONFIG[item.plan as keyof typeof PLAN_CONFIG]?.name ??
                        item.plan}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusColors[item.status] ?? statusColors.CANCELLED}`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="font-heading text-xl font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Fashion Houses</CardTitle>
            <CardDescription>Latest registrations on the platform</CardDescription>
          </div>
          <Link
            href="/admin/tenants"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Fashion House</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Customers</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTenants?.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-0">
                    <td className="py-3">
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tenant.slug}
                      </p>
                    </td>
                    <td className="py-3">
                      {tenant.subscription?.plan ?? '—'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusColors[tenant.subscription?.status ?? 'CANCELLED']}`}
                      >
                        {tenant.subscription?.status?.replace(/_/g, ' ') ?? 'None'}
                      </span>
                    </td>
                    <td className="py-3">{tenant._count.customers}</td>
                    <td className="py-3">{tenant._count.orders}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
