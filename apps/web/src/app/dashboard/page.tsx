'use client';

import {
  CreditCard,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dashboardApi, type DashboardData } from '@/lib/api';

const statConfig = [
  { key: 'totalCustomers', label: 'Customers', icon: Users },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingBag },
  { key: 'activeOrders', label: 'Active Orders', icon: Package },
  { key: 'totalRevenue', label: 'Revenue', icon: TrendingUp, format: 'currency' },
  { key: 'outstandingBalance', label: 'Outstanding', icon: CreditCard, format: 'currency' },
  { key: 'deliveredOrders', label: 'Delivered', icon: Package },
] as const;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
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
        const payload = res as DashboardData;
        if (!payload.summary) {
          throw { message: 'Invalid dashboard response' };
        }
        setData(payload);
      })
      .catch((err: unknown) => {
        const apiErr = err as { message?: string };
        setError(apiErr.message ?? 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  if (!data) {
    return (
      <p className="text-muted-foreground">
        {error || 'Failed to load dashboard. Is the API running on port 3001?'}
      </p>
    );
  }

  return (
    <div className="space-y-8">
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
          // The naira sign renders poorly in the serif display font, so it
          // gets a sans-serif span of its own.
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
            <Card key={stat.key} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl font-semibold">
                  {display}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                  <span className="text-sm font-medium">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-lg font-bold">{item.count}</span>
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
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer
                        ? `${order.customer.firstName} ${order.customer.lastName}`
                        : order.style?.name ?? 'Order'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{order.status}</p>
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
