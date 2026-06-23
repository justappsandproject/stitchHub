'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'businessName' && !prev.slug) {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.registerTenant(form);
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/dashboard?welcome=1');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-primary">
            <LogoMark className="mx-auto h-12 w-12" />
          </div>
          <CardTitle className="font-display text-2xl">
            Register your fashion house
          </CardTitle>
          <CardDescription>
            Start digitizing your atelier today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="businessName">Fashion House Name</Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => update('businessName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="slug">Fashion House URL</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value)}
                  placeholder="elegant-stitches"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+2348012345678"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  minLength={8}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
