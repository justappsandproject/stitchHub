'use client';

import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, ordersApi, type OrderRecord } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const ORDER_STATUSES = [
  'NEW',
  'MEASURED',
  'CUTTING',
  'SEWING',
  'FITTING',
  'FINISHING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

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

const emptyForm = {
  customerId: '',
  fabric: '',
  deliveryDate: '',
  priority: 'NORMAL',
  notes: '',
  totalAmount: '',
  depositAmount: '',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    api<Customer[]>('/customers').then(setCustomers).catch(console.error);
  }, [loadOrders]);

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await ordersApi.create({
        customerId: form.customerId,
        fabric: form.fabric || undefined,
        deliveryDate: form.deliveryDate || undefined,
        priority: form.priority,
        notes: form.notes || undefined,
        totalAmount: parseFloat(form.totalAmount) || 0,
        depositAmount: form.depositAmount
          ? parseFloat(form.depositAmount)
          : undefined,
      });
      setDialogOpen(false);
      setForm(emptyForm);
      loadOrders();
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to create order',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      await api(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ordersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadOrders();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Orders
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage customer orders
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      {error && !dialogOpen && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No orders yet</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Create your first order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] ?? 'bg-gray-100'}`}
                    >
                      {order.status}
                    </span>
                    <Select
                      className="h-8 w-36 text-xs"
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(order)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.phone}
                      {order.deliveryDate &&
                        ` · Due ${new Date(order.deliveryDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₦{Number(order.totalAmount).toLocaleString()}
                    </p>
                    {Number(order.balanceAmount) > 0 && (
                      <p className="text-sm text-destructive">
                        Balance: ₦{Number(order.balanceAmount).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{order.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete order{' '}
              <strong>{deleteTarget?.orderNumber}</strong>. This action cannot
              be undone.
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
              {deleting ? 'Deleting...' : 'Delete order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>Create a new customer order</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <Select
                id="customerId"
                value={form.customerId}
                onChange={(e) => update('customerId', e.target.value)}
                required
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — {c.phone}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fabric">Fabric</Label>
                <Input
                  id="fabric"
                  value={form.fabric}
                  onChange={(e) => update('fabric', e.target.value)}
                  placeholder="Ankara, Aso Oke..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => update('deliveryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => update('priority', e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount (₦) *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) => update('totalAmount', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit (₦)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.depositAmount}
                  onChange={(e) => update('depositAmount', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Style details, special requests..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
