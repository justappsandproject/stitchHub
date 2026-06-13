'use client';

import {
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dashboardApi, type DashboardData } from '@/lib/api';

const statConfig = [
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingBag },
  { key: 'activeOrders', label: 'Active Orders', icon: Package },
  { key: 'deliveredOrders', label: 'Delivered', icon: Truck },
  {
    key: 'outstandingBalance',
    label: 'Balance Due',
    icon: CreditCard,
    format: 'currency' as const,
  },
] as const;

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  MEASURED: 'bg-indigo-100 text-indigo-800',
  CUTTING: 'bg-yellow-100 text-yellow-800',
  SEWING: 'bg-orange-100 text-orange-800',
  FITTING: 'bg-purple-100 text-purple-800',
  FINISHING: 'bg-pink-100 text-pink-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CustomerHomePage() {
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
    return <p className="text-muted-foreground">Loading your dashboard...</p>;
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            My Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your orders and payments with your fashion house
          </p>
        </div>
        <Button asChild>
          <Link href="/customer/orders">View all orders</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {data.recentOrders && data.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest order activity</CardDescription>
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
                    {order.style?.name && (
                      <p className="text-sm text-muted-foreground">
                        {order.style.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[order.status] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
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
