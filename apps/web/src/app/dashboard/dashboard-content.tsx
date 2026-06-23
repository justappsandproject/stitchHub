'use client';

import {
  CreditCard,
  FileText,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dashboardApi, type DashboardData } from '@/lib/api';
import { cn } from '@/lib/utils';

const statConfig = [
  { key: 'totalCustomers', label: 'Customers', icon: Users, href: '/dashboard/customers' },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingBag, href: '/dashboard/orders' },
  { key: 'activeOrders', label: 'Active Orders', icon: Package, href: '/dashboard/orders' },
  { key: 'todayRevenue', label: "Today's Revenue", icon: TrendingUp, format: 'currency' as const, href: '/dashboard/payments' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: TrendingUp, format: 'currency' as const, href: '/dashboard/payments' },
  { key: 'pendingInvoices', label: 'Pending Invoices', icon: FileText, href: '/dashboard/payments' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: TrendingUp, format: 'currency' as const, href: '/dashboard/payments' },
  { key: 'outstandingBalance', label: 'Outstanding', icon: CreditCard, format: 'currency' as const, href: '/dashboard/payments' },
  { key: 'deliveredOrders', label: 'Delivered', icon: Package, href: '/dashboard/orders' },
] as const;

function formatMonthLabel(month: string) {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-48 animate-pulse rounded-md bg-secondary" />
        <div className="h-5 w-72 animate-pulse rounded-md bg-secondary" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded bg-secondary" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      setError('Not signed in');
      return;
    }

    try {
      const res = await dashboardApi.get();
      const payload = res as DashboardData;
      if (!payload.summary) {
        throw { message: 'Invalid dashboard response' };
      }
      setData(payload);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setShowWelcome(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-foreground">
          {error || 'Failed to load dashboard. Is the API running?'}
        </p>
        <Button onClick={loadDashboard}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const maxTrend = Math.max(
    ...(data.revenueTrend?.map((t) => t.amount) ?? [1]),
    1,
  );

  return (
    <div className="space-y-8">
      {showWelcome && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Welcome to StitchHub</CardTitle>
            <CardDescription>
              You&apos;re on the Free plan — up to 5 customers and 10 orders per
              month. Upgrade anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/settings#subscription">Upgrade</Link>
            </Button>
            <Button onClick={() => setShowWelcome(false)}>Get Started</Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your fashion business
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              value.toLocaleString()
            );

          return (
            <Link key={stat.key} href={stat.href} className="block">
              <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-display text-3xl font-semibold text-foreground">
                    {display}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {data.revenueTrend && data.revenueTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.revenueTrend.map((item) => {
                const pct = Math.round((item.amount / maxTrend) * 100);
                return (
                  <div key={item.month} className="flex items-center gap-4">
                    <span className="w-16 shrink-0 text-sm text-muted-foreground">
                      {formatMonthLabel(item.month)}
                    </span>
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-3 flex-1 rounded-full bg-secondary">
                        <div
                          className="h-3 rounded-full bg-gold transition-all"
                          style={{ width: `${Math.max(pct, item.amount > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="w-24 text-right text-sm font-medium text-foreground">
                        ₦{item.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {data.inventorySummary && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
            <CardDescription>Stock overview at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Products', value: data.inventorySummary.totalProducts },
                { label: 'In stock', value: data.inventorySummary.availableStock },
                { label: 'Low stock', value: data.inventorySummary.lowStock },
                { label: 'Out of stock', value: data.inventorySummary.outOfStock },
                {
                  label: 'Total value',
                  value: `₦${data.inventorySummary.totalInventoryValue.toLocaleString()}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-display text-xl font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/inventory"
              className={cn(
                'mt-4 inline-block text-sm font-medium text-primary hover:underline',
              )}
            >
              Manage inventory →
            </Link>
          </CardContent>
        </Card>
      )}

      {data.ordersByStatus && data.ordersByStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Production pipeline breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.ordersByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium text-foreground">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.recentOrders && data.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer
                        ? `${order.customer.firstName} ${order.customer.lastName}`
                        : order.style?.name ?? 'Order'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {order.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ₦{Number(order.totalAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
