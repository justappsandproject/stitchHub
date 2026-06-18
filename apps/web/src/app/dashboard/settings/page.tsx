'use client';

import { useEffect, useState } from 'react';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { authApi, billingApi, uploadFile } from '@/lib/api';
import { saveUser } from '@/lib/session';

export default function DashboardSettingsPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<{
    plan: string;
    status: string;
    configName?: string;
    priceNgn?: number;
    usageCustomers?: number;
    maxCustomers?: number;
    usageOrdersThisMonth?: number;
    maxOrdersPerMonth?: number;
  } | null>(null);

  useEffect(() => {
    authApi.getProfile().then((profile) => {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone ?? '');
      setEmail(profile.email);
      setPhotoUrl(profile.photoUrl ?? '');
    }).catch(console.error);
    billingApi.getCurrent().then(setPlan).catch(console.error);
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setProfileLoading(true);
    try {
      const profile = await authApi.updateProfile({
        firstName,
        lastName,
        phone,
        email,
        photoUrl: photoUrl || undefined,
      });
      saveUser(profile);
      setProfileMessage('Profile updated successfully.');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setProfileError(apiErr.message ?? 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadFile(file);
      setPhotoUrl(uploaded.url);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setProfileError(apiErr.message ?? 'Upload failed');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile and account security
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {profileError}
              </div>
            )}
            {profileMessage && (
              <div className="rounded-md bg-success/10 p-3 text-sm text-success">
                {profileMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="photo">Profile photo</Label>
              <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Profile" className="mt-2 h-20 w-20 rounded-full object-cover" />
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fashion house plan</CardTitle>
          <CardDescription>Your atelier subscription and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan ? (
            <>
              <p className="text-lg font-semibold">
                {plan.configName ?? plan.plan} plan
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {plan.status.replace(/_/g, ' ')}
              </p>
              {plan.priceNgn != null && (
                <p className="text-sm">₦{plan.priceNgn.toLocaleString()}/month</p>
              )}
              {plan.usageCustomers != null && (
                <p className="text-sm">
                  Customers: {plan.usageCustomers}
                  {plan.maxCustomers != null ? ` / ${plan.maxCustomers}` : ''}
                </p>
              )}
              {plan.usageOrdersThisMonth != null && (
                <p className="text-sm">
                  Orders this month: {plan.usageOrdersThisMonth}
                  {plan.maxOrdersPerMonth != null
                    ? ` / ${plan.maxOrdersPerMonth}`
                    : ''}
                </p>
              )}
              <Button variant="outline" asChild>
                <Link href="/dashboard/billing">Manage billing</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading plan...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Update your login password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-md bg-success/10 p-3 text-sm text-success">
                {message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <PasswordInput
                id="current"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <PasswordInput
                id="new"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput
                id="confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
