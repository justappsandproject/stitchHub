'use client';

import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  api,
  customersApi,
  ordersApi,
  stylesApi,
  type CustomerDetail,
  type CustomerRecord,
  type StyleRecord,
  uploadFile,
} from '@/lib/api';

const STEPS = ['Customer', 'Items & Fabric', 'Review', 'Confirm'];

interface WizardState {
  customerId: string;
  styleId: string;
  fabric: string;
  notes: string;
  subtotalAmount: string;
  discountAmount: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  totalAmount: string;
  depositAmount: string;
  deliveryDate: string;
  measurementId: string;
  styleReferenceUrls: string[];
}

const initialState: WizardState = {
  customerId: '',
  styleId: '',
  fabric: '',
  notes: '',
  subtotalAmount: '',
  discountAmount: '',
  discountType: 'FIXED_AMOUNT',
  totalAmount: '',
  depositAmount: '',
  deliveryDate: '',
  measurementId: '',
  styleReferenceUrls: [],
};

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(initialState);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [styles, setStyles] = useState<StyleRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    customersApi.list().then(setCustomers).catch(console.error);
    stylesApi.list().then(setStyles).catch(console.error);
  }, []);

  const loadCustomer = useCallback(async (id: string) => {
    if (!id) {
      setSelectedCustomer(null);
      return;
    }
    try {
      const data = await customersApi.get(id);
      setSelectedCustomer(data);
    } catch {
      setSelectedCustomer(null);
    }
  }, []);

  useEffect(() => {
    if (form.customerId) loadCustomer(form.customerId);
  }, [form.customerId, loadCustomer]);

  const balanceDue = useMemo(() => {
    const total = parseFloat(form.totalAmount) || 0;
    const deposit = parseFloat(form.depositAmount) || 0;
    return Math.max(0, total - deposit);
  }, [form.totalAmount, form.depositAmount]);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'subtotalAmount' || key === 'discountAmount' || key === 'discountType') {
        const sub = parseFloat(key === 'subtotalAmount' ? (value as string) : prev.subtotalAmount) || 0;
        const disc = parseFloat(key === 'discountAmount' ? (value as string) : prev.discountAmount) || 0;
        const type = key === 'discountType' ? (value as WizardState['discountType']) : prev.discountType;
        const discountValue = type === 'PERCENTAGE' ? (sub * disc) / 100 : disc;
        next.totalAmount = String(Math.max(0, sub - discountValue));
      }
      if (key === 'styleId') {
        const style = styles.find((s) => s.id === value);
        if (style?.basePrice) {
          next.subtotalAmount = String(Number(style.basePrice));
          const sub = Number(style.basePrice);
          const disc = parseFloat(prev.discountAmount) || 0;
          const discountValue =
            prev.discountType === 'PERCENTAGE' ? (sub * disc) / 100 : disc;
          next.totalAmount = String(Math.max(0, sub - discountValue));
        }
      }
      return next;
    });
  }

  async function handleStyleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadFile(file);
    update('styleReferenceUrls', [...form.styleReferenceUrls, url]);
  }

  async function handleConfirm() {
    setSaving(true);
    setError('');
    try {
      const result = await ordersApi.confirm({
        customerId: form.customerId,
        styleId: form.styleId || undefined,
        fabric: form.fabric || undefined,
        deliveryDate: form.deliveryDate || undefined,
        notes: form.notes || undefined,
        subtotalAmount: parseFloat(form.subtotalAmount) || undefined,
        totalAmount: parseFloat(form.totalAmount) || 0,
        depositAmount: parseFloat(form.depositAmount) || undefined,
        discountAmount: parseFloat(form.discountAmount) || undefined,
        discountType: form.discountType,
        measurementId: form.measurementId || undefined,
        styleReferenceUrls: form.styleReferenceUrls,
      });
      const orderId = (result as { id: string }).id;
      router.push(`/dashboard/orders?confirmed=${orderId}`);
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to confirm order',
      );
    } finally {
      setSaving(false);
    }
  }

  const lastOrderDate = selectedCustomer?.orders[0]?.createdAt
    ? new Date(selectedCustomer.orders[0].createdAt as unknown as string).toLocaleDateString()
    : 'None';

  const latestMeasurement = selectedCustomer?.measurements[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            New Order
          </h1>
          <p className="text-muted-foreground">Create and confirm a customer order</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/orders">Cancel</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 hidden h-px flex-1 bg-border sm:block" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={form.customerId}
                onChange={(e) => update('customerId', e.target.value)}
              >
                <option value="">Choose a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — {c.phone}
                  </option>
                ))}
              </Select>
            </div>

            {selectedCustomer && (
              <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h3>
                <div className="mt-2 grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                  <p>
                    <span className="font-medium">Phone:</span> {selectedCustomer.phone}
                  </p>
                  {selectedCustomer.email && (
                    <p>
                      <span className="font-medium">Email:</span> {selectedCustomer.email}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Last order:</span> {lastOrderDate}
                  </p>
                  <p>
                    <span className="font-medium">Saved measurements:</span>{' '}
                    {selectedCustomer._count.measurements}
                  </p>
                </div>
                {latestMeasurement && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-semibold text-primary underline"
                    onClick={() => {
                      update('measurementId', latestMeasurement.id);
                      setStep(1);
                    }}
                  >
                    Use saved measurement from{' '}
                    {new Date(latestMeasurement.createdAt).toLocaleDateString()}
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Items & Fabric</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Style from catalog</Label>
              <Select
                value={form.styleId}
                onChange={(e) => update('styleId', e.target.value)}
              >
                <option value="">Optional — select style</option>
                {styles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₦{Number(s.basePrice ?? 0).toLocaleString()}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Style reference images</Label>
              <div className="flex flex-wrap gap-2">
                {form.styleReferenceUrls.map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-20 rounded-md border object-cover" />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                      onClick={() =>
                        update(
                          'styleReferenceUrls',
                          form.styleReferenceUrls.filter((u) => u !== url),
                        )
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted/50">
                  <Upload className="mb-1 h-4 w-4" />
                  Upload
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleStyleUpload} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fabric">Fabric</Label>
              <Input
                id="fabric"
                value={form.fabric}
                onChange={(e) => update('fabric', e.target.value)}
                placeholder="e.g. Ankara, Lace, Silk..."
                className="border-slate-300 bg-white dark:border-slate-600"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal (₦)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  min="0"
                  value={form.subtotalAmount}
                  onChange={(e) => update('subtotalAmount', e.target.value)}
                  className="border-slate-300 bg-white dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount</Label>
                <div className="flex gap-2">
                  <Select
                    value={form.discountType}
                    onChange={(e) =>
                      update('discountType', e.target.value as WizardState['discountType'])
                    }
                    className="w-32"
                  >
                    <option value="FIXED_AMOUNT">₦ Flat</option>
                    <option value="PERCENTAGE">%</option>
                  </Select>
                  <Input
                    type="number"
                    min="0"
                    value={form.discountAmount}
                    onChange={(e) => update('discountAmount', e.target.value)}
                    placeholder="0"
                    className="border-slate-300 bg-white dark:border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total Amount (₦) — editable</Label>
                <Input
                  id="total"
                  type="number"
                  min="0"
                  value={form.totalAmount}
                  onChange={(e) => update('totalAmount', e.target.value)}
                  className="border-slate-300 bg-white font-semibold dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit Paid (₦)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  value={form.depositAmount}
                  onChange={(e) => update('depositAmount', e.target.value)}
                  className="border-slate-300 bg-white dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Balance Due (₦)</Label>
                <Input
                  readOnly
                  value={balanceDue.toLocaleString()}
                  className="border-slate-300 bg-slate-100 font-semibold dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery">Due Date</Label>
                <Input
                  id="delivery"
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => update('deliveryDate', e.target.value)}
                  className="border-slate-300 bg-white dark:border-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Special instructions..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Customer:</span>{' '}
              {selectedCustomer
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                : '—'}
            </p>
            <p>
              <span className="font-medium">Fabric:</span> {form.fabric || '—'}
            </p>
            <p>
              <span className="font-medium">Total:</span> ₦
              {(parseFloat(form.totalAmount) || 0).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Deposit:</span> ₦
              {(parseFloat(form.depositAmount) || 0).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Balance due:</span> ₦
              {balanceDue.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Delivery:</span>{' '}
              {form.deliveryDate || 'Not set'}
            </p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Confirming will create the order, generate an invoice, and notify the
              customer.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            disabled={step === 0 && !form.customerId}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={saving || !form.customerId}>
            {saving ? 'Confirming...' : 'Confirm Order'}
          </Button>
        )}
      </div>
    </div>
  );
}
