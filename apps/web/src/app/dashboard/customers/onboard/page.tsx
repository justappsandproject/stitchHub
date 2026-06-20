'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customersApi } from '@/lib/api';

export default function OnboardCustomerPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    username: '',
  });
  const [result, setResult] = useState<{
    username: string;
    temporaryPassword: string;
    welcomeMessage: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await customersApi.onboard({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        username: form.username || undefined,
      });
      setResult({
        username: res.username,
        temporaryPassword: res.temporaryPassword,
        welcomeMessage: res.welcomeMessage,
      });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to onboard customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/customers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to customers
        </Link>
      </Button>

      <div>
        <h1 className="font-display text-3xl font-semibold">Onboard Customer</h1>
        <p className="text-muted-foreground">
          Create a customer profile and mobile app login credentials
        </p>
      </div>

      {result ? (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardHeader>
            <CardTitle>Customer onboarded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Username:</span> {result.username}
            </p>
            <p>
              <span className="font-medium">Temporary password:</span>{' '}
              {result.temporaryPassword}
            </p>
            <p className="rounded-md bg-white/80 p-3 dark:bg-black/20">
              {result.welcomeMessage}
            </p>
            <Button asChild>
              <Link href="/dashboard/customers">Done</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Username (auto-generated if empty)</Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="firstname.lastname123"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Creating...' : 'Onboard customer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
