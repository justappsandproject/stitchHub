'use client';

import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ShoppingBag,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customersApi, type CustomerDetail } from '@/lib/api';

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

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await customersApi.get(id);
      setCustomer(data);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-muted-foreground">Loading customer...</p>;
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to customers
          </Link>
        </Button>
        <p className="text-destructive">{error || 'Customer not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to customers
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {customer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customer.photoUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gold/40"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
                {customer.firstName[0]}
                {customer.lastName[0]}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {customer.firstName} {customer.lastName}
                {customer.isVip && (
                  <Star className="ml-2 inline h-6 w-6 fill-yellow-400 text-yellow-400" />
                )}
              </h1>
              <p className="text-muted-foreground">
                {customer._count.orders} orders ·{' '}
                {customer._count.measurements} measurements
              </p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/measurements?customerId=${customer.id}`}>
            <Ruler className="mr-2 h-4 w-4" />
            Add measurement
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact & profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {customer.phone}
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {customer.email}
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {customer.address}
              </div>
            )}
            {customer.gender && (
              <p>
                <span className="text-muted-foreground">Gender:</span>{' '}
                {customer.gender}
              </p>
            )}
            {customer.user && (
              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="font-medium">Portal account</p>
                <p className="text-muted-foreground">{customer.user.email}</p>
                {customer.user.lastLoginAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last login:{' '}
                    {new Date(customer.user.lastLoginAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {customer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {customer.notes && (
              <div>
                <p className="mb-1 font-medium">Notes</p>
                <p className="text-muted-foreground">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fashion house plan</CardTitle>
            <CardDescription>
              Subscription context for this atelier
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold">
                {customer.tenantPlan ?? '—'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {customer.tenantSubscriptionStatus?.replace(/_/g, ' ') ?? '—'}
              </p>
            </div>
            {customer.tenantUsage && (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Usage</p>
                <p className="text-sm">
                  {customer.tenantUsage.customers} customers ·{' '}
                  {customer.tenantUsage.ordersThisMonth} orders/mo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Measurements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.measurements.length === 0 ? (
            <p className="text-muted-foreground">No measurements recorded</p>
          ) : (
            <div className="space-y-4">
              {customer.measurements.map((m) => (
                <div key={m.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {m.template?.name ?? 'Measurement'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(m.values).map(([key, val]) => (
                      <span
                        key={key}
                        className="rounded-md bg-secondary px-2 py-1 text-xs"
                      >
                        {key}: {val}
                        {m.template ? '' : ''}
                      </span>
                    ))}
                  </div>
                  {m.notes && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {m.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    {order.style && (
                      <p className="text-sm text-muted-foreground">
                        {order.style.name} · {order.style.category}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[order.status] ??
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <p className="mt-1 text-sm font-medium">
                      ₦{Number(order.totalAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
