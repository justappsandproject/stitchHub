'use client';

import { ArrowLeft, Mail, MapPin, Phone, Ruler, ShoppingBag, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { TakeMeasurementDialog } from '@/components/measurements/take-measurement-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'tickets'>('overview');

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

  async function handleDelete() {
    setDeleting(true);
    try {
      await customersApi.delete(id);
      router.push('/dashboard/customers');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to delete customer');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

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
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
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
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMeasureOpen(true)}>
            <Ruler className="mr-2 h-4 w-4" />
            Take Measurement
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/orders/new?customerId=${customer.id}`}>
              New order
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(['overview', 'measurements', 'tickets'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Contact & profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {customer.email}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2 text-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {customer.address}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
                        <p className="font-medium text-foreground">
                          {order.orderNumber}
                        </p>
                        {order.style && (
                          <p className="text-sm text-muted-foreground">
                            {order.style.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[order.status] ?? 'bg-muted'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'measurements' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Measurement History</CardTitle>
            <Button size="sm" onClick={() => setMeasureOpen(true)}>
              <Ruler className="mr-2 h-4 w-4" />
              Take Measurement
            </Button>
          </CardHeader>
          <CardContent>
            {customer.measurements.length === 0 ? (
              <p className="text-muted-foreground">No measurements recorded</p>
            ) : (
              <div className="space-y-4">
                {customer.measurements.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        {m.template?.name ?? 'Body Measurement'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(m.values).map(([key, val]) => (
                        <span
                          key={key}
                          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                        >
                          {key}: {val}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/measurements?highlight=${m.id}`}>
                          View
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link
                          href={`/dashboard/orders/new?customerId=${customer.id}&measurementId=${m.id}`}
                        >
                          Use for Order
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tickets' && (
        <Card>
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Customer support tickets appear here. View all tickets from Settings or
              filter by customer in the tickets API.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href={`/dashboard/customers/${customer.id}?tab=tickets`}>
                Refresh tickets
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <TakeMeasurementDialog
        customerId={customer.id}
        open={measureOpen}
        onOpenChange={setMeasureOpen}
        onSaved={load}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>
                {customer.firstName} {customer.lastName}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete customer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
