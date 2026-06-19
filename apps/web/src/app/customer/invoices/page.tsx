'use client';

import { FileText, Receipt } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  paymentsApi,
  type InvoiceRecord,
  type PaymentRecord,
  type ReceiptRecord,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-blue-100 text-blue-800',
  PARTIALLY_PAID: 'bg-warning/10 text-warning',
  PAID: 'bg-success/10 text-success',
  OVERDUE: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

type Tab = 'invoices' | 'payments' | 'receipts';

export default function CustomerInvoicesPage() {
  const [tab, setTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceData, paymentData, receiptData] = await Promise.all([
        paymentsApi.listInvoices(),
        paymentsApi.listPayments(),
        paymentsApi.listReceipts(),
      ]);
      setInvoices(invoiceData);
      setPayments(paymentData);
      setReceipts(receiptData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Invoices & Payments
        </h1>
        <p className="mt-1 text-muted-foreground">
          View your invoices, payment history, and receipts
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          variant={tab === 'invoices' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('invoices')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Invoices
        </Button>
        <Button
          variant={tab === 'payments' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('payments')}
        >
          Payment history
        </Button>
        <Button
          variant={tab === 'receipts' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('receipts')}
        >
          <Receipt className="mr-2 h-4 w-4" />
          Receipts
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tab === 'invoices' ? (
        invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No invoices yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const balance =
                Number(invoice.amount) - Number(invoice.paidAmount);
              return (
                <Card key={invoice.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg text-foreground">
                          {invoice.invoiceNumber}
                        </CardTitle>
                        <CardDescription>
                          Order {invoice.order.orderNumber}
                          {invoice.dueDate &&
                            ` · Due ${new Date(invoice.dueDate).toLocaleDateString()}`}
                        </CardDescription>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          invoiceStatusColors[invoice.status] ??
                            'bg-muted text-muted-foreground',
                        )}
                      >
                        {invoice.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-display text-xl font-semibold text-foreground">
                          ₦{Number(invoice.amount).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-medium text-success">
                          ₦{Number(invoice.paidAmount).toLocaleString()}
                        </p>
                        {balance > 0 && (
                          <p className="text-destructive">
                            Balance: ₦{balance.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {invoice.payments && invoice.payments.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Payments on this invoice
                        </p>
                        <div className="space-y-2">
                          {invoice.payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {p.method} ·{' '}
                                {p.paidAt
                                  ? new Date(p.paidAt).toLocaleDateString()
                                  : new Date(p.createdAt).toLocaleDateString()}
                              </span>
                              <span className="font-medium text-foreground">
                                ₦{Number(p.amount).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : tab === 'payments' ? (
        payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No payments recorded yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
              <CardDescription>All payments made on your orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      ₦{Number(payment.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.method.replace(/_/g, ' ')}
                      {payment.invoice?.invoiceNumber &&
                        ` · ${payment.invoice.invoiceNumber}`}
                      {payment.invoice?.order?.orderNumber &&
                        ` · ${payment.invoice.order.orderNumber}`}
                    </p>
                    {payment.reference && (
                      <p className="text-xs text-muted-foreground">
                        Ref: {payment.reference}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-success">
                      {payment.status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-muted-foreground">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString()
                        : new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                    {payment.receipt && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() =>
                          setSelectedReceipt({
                            id: payment.receipt!.id,
                            receiptNumber: payment.receipt!.receiptNumber,
                            createdAt: payment.createdAt,
                            payment,
                          })
                        }
                      >
                        View receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      ) : receipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No receipts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {receipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  {receipt.receiptNumber}
                </CardTitle>
                <CardDescription>
                  {new Date(receipt.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {receipt.payment && (
                  <div className="space-y-2 text-sm">
                    <p className="font-display text-2xl font-semibold text-foreground">
                      ₦{Number(receipt.payment.amount).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">
                      {receipt.payment.method.replace(/_/g, ' ')}
                    </p>
                    {receipt.payment.invoice && (
                      <p className="text-muted-foreground">
                        Invoice: {receipt.payment.invoice.invoiceNumber}
                        {receipt.payment.invoice.order?.orderNumber &&
                          ` · Order ${receipt.payment.invoice.order.orderNumber}`}
                      </p>
                    )}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSelectedReceipt(receipt)}
                >
                  View receipt
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt {selectedReceipt?.receiptNumber}</DialogTitle>
            <DialogDescription>
              {selectedReceipt &&
                new Date(selectedReceipt.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt?.payment && (
            <div className="space-y-4 rounded-lg border bg-secondary/30 p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Amount paid</p>
                <p className="font-display text-3xl font-semibold text-foreground">
                  ₦{Number(selectedReceipt.payment.amount).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium text-foreground">
                    {selectedReceipt.payment.method.replace(/_/g, ' ')}
                  </span>
                </div>
                {selectedReceipt.payment.reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-medium text-foreground">
                      {selectedReceipt.payment.reference}
                    </span>
                  </div>
                )}
                {selectedReceipt.payment.invoice && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice</span>
                      <span className="font-medium text-foreground">
                        {selectedReceipt.payment.invoice.invoiceNumber}
                      </span>
                    </div>
                    {selectedReceipt.payment.invoice.order?.orderNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order</span>
                        <span className="font-medium text-foreground">
                          {selectedReceipt.payment.invoice.order.orderNumber}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-success">
                    {selectedReceipt.payment.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Thank you for your payment
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
