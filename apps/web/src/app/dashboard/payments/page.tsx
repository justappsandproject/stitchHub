'use client';

import { Plus, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import { api } from '@/lib/api';

interface OrderOption {
  id: string;
  orderNumber: string;
  totalAmount: number;
  balanceAmount: number;
  customer: { firstName: string; lastName: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate?: string;
  order: {
    orderNumber: string;
    customer: { firstName: string; lastName: string };
  };
}

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    orderId: '',
    amount: '',
    dueDate: '',
  });

  const [payDialogInvoice, setPayDialogInvoice] = useState<Invoice | null>(
    null,
  );
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [invoiceData, orderData] = await Promise.all([
        api<Invoice[]>('/payments/invoices'),
        api<OrderOption[]>('/orders'),
      ]);
      setInvoices(invoiceData);
      setOrders(orderData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openInvoiceDialog() {
    setInvoiceForm({ orderId: '', amount: '', dueDate: '' });
    setError('');
    setInvoiceDialogOpen(true);
  }

  function openPayDialog(invoice: Invoice) {
    const remaining = Number(invoice.amount) - Number(invoice.paidAmount);
    setPayForm({ amount: String(remaining > 0 ? remaining : ''), method: 'CASH' });
    setError('');
    setPayDialogInvoice(invoice);
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api('/payments/invoices', {
        method: 'POST',
        body: JSON.stringify({
          orderId: invoiceForm.orderId,
          amount: parseFloat(invoiceForm.amount) || 0,
          dueDate: invoiceForm.dueDate || undefined,
        }),
      });
      setInvoiceDialogOpen(false);
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to create invoice',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payDialogInvoice) return;
    setError('');
    setSaving(true);

    try {
      await api('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: payDialogInvoice.id,
          amount: parseFloat(payForm.amount) || 0,
          method: payForm.method,
        }),
      });
      setPayDialogInvoice(null);
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to record payment',
      );
    } finally {
      setSaving(false);
    }
  }

  // Auto-fill invoice amount with the order's outstanding balance.
  function handleOrderSelect(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    setInvoiceForm((prev) => ({
      ...prev,
      orderId,
      amount:
        order && Number(order.balanceAmount) > 0
          ? String(order.balanceAmount)
          : prev.amount,
    }));
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Payments
          </h1>
          <p className="mt-1 text-muted-foreground">
            Invoices, receipts, and outstanding balances
          </p>
        </div>
        <Button onClick={openInvoiceDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No invoices yet</p>
            <Button className="mt-4" onClick={openInvoiceDialog}>
              Create your first invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const remaining =
              Number(invoice.amount) - Number(invoice.paidAmount);
            return (
              <Card key={invoice.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${invoiceStatusColors[invoice.status] ?? 'bg-gray-100'}`}
                    >
                      {invoice.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {invoice.order.customer.firstName}{' '}
                        {invoice.order.customer.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.order.orderNumber}
                        {invoice.dueDate &&
                          ` · Due ${new Date(invoice.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          ₦{Number(invoice.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Paid: ₦{Number(invoice.paidAmount).toLocaleString()}
                        </p>
                      </div>
                      {remaining > 0 && invoice.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          onClick={() => openPayDialog(invoice)}
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice for an order
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orderId">Order *</Label>
              <Select
                id="orderId"
                value={invoiceForm.orderId}
                onChange={(e) => handleOrderSelect(e.target.value)}
                required
              >
                <option value="">Select an order...</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customer.firstName}{' '}
                    {o.customer.lastName} (₦
                    {Number(o.totalAmount).toLocaleString()})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInvoiceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!payDialogInvoice}
        onOpenChange={(open) => !open && setPayDialogInvoice(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {payDialogInvoice?.invoiceNumber} ·{' '}
              {payDialogInvoice?.order.customer.firstName}{' '}
              {payDialogInvoice?.order.customer.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payAmount">Amount (₦) *</Label>
                <Input
                  id="payAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payForm.amount}
                  onChange={(e) =>
                    setPayForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Method *</Label>
                <Select
                  id="method"
                  value={payForm.method}
                  onChange={(e) =>
                    setPayForm((prev) => ({ ...prev, method: e.target.value }))
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PAYSTACK">Paystack</option>
                  <option value="FLUTTERWAVE">Flutterwave</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayDialogInvoice(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
