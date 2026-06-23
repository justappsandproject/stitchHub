'use client';

import { Plus, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  CredentialsDialog,
  type CustomerCredentials,
} from '@/components/customers/credentials-dialog';
import { UpgradePromptDialog } from '@/components/subscription/upgrade-prompt-dialog';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { customersApi, uploadFile, api } from '@/lib/api';
import { isPlanLimitError } from '@/lib/plan-errors';
import type { PlanResource } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  isVip: boolean;
  tags: string[];
  _count: { orders: number; measurements: number };
}

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  gender: '',
  address: '',
  notes: '',
  isVip: false,
  tags: '',
  photoUrl: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<CustomerCredentials | null>(
    null,
  );
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [upgradeResource, setUpgradeResource] = useState<PlanResource>();

  const loadCustomers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      const data = await api<Customer[]>(`/customers${params}`);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  function update(field: keyof typeof emptyForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const result = await customersApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        gender: form.gender || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        isVip: form.isVip,
        photoUrl: form.photoUrl || undefined,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      });
      setDialogOpen(false);
      setForm(emptyForm);
      setCredentials(result.credentials);
      setCredentialsOpen(true);
      loadCustomers(search);
    } catch (err: unknown) {
      if (isPlanLimitError(err)) {
        setUpgradeMessage(
          typeof err.message === 'string'
            ? err.message
            : "You've reached the customer limit on the Free plan.",
        );
        setUpgradeResource(err.resource ?? 'customers');
        setUpgradeOpen(true);
        return;
      }
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to create customer',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Customers
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your customer profiles and history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/customers/onboard">Onboard Customer</Link>
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            loadCustomers(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading customers...</p>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No customers yet</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Add your first customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/dashboard/customers/${customer.id}`}>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-foreground">
                      {customer.firstName} {customer.lastName}
                    </CardTitle>
                    <CardDescription>{customer.phone}</CardDescription>
                  </div>
                  {customer.isVip && (
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{customer._count.orders} orders</span>
                  <span>{customer._count.measurements} measurements</span>
                </div>
                {customer.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
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
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const uploaded = await uploadFile(file);
                  update('photoUrl', uploaded.url);
                }}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+2348012345678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  id="gender"
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                >
                  <option value="">Not specified</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="wedding, repeat"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isVip}
                  onChange={(e) => update('isVip', e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                VIP customer
              </label>
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
                {saving ? 'Saving...' : 'Save Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CredentialsDialog
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        credentials={credentials}
      />
      <UpgradePromptDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        message={upgradeMessage}
        resource={upgradeResource}
      />
    </div>
  );
}
