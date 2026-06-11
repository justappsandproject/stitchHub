'use client';

import { MessageSquare, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PasswordInput } from '@/components/ui/password-input';
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
import { Label } from '@/components/ui/label';
import { tenantsApi, type TenantRecord } from '@/lib/api';
import { PLAN_CONFIG } from '@stitchhub/shared';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  ACTIVE: 'text-emerald-600 bg-emerald-500/10',
  TRIALING: 'text-violet-600 bg-violet-500/10',
  PAST_DUE: 'text-amber-600 bg-amber-500/10',
  CANCELLED: 'text-muted-foreground bg-muted',
};

const PLANS = Object.keys(PLAN_CONFIG);

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTenant, setActionTenant] = useState<TenantRecord | null>(null);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const data = await tenantsApi.list(token);
    setTenants(data);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function toggleActive(tenant: TenantRecord) {
    setBusy(tenant.id);
    setFeedback('');
    try {
      await tenantsApi.adminUpdate(tenant.id, {
        isActive: !tenant.isActive,
      });
      await load();
      setFeedback(`${tenant.name} ${tenant.isActive ? 'deactivated' : 'activated'}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFeedback(e.message ?? 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  async function changePlan(tenantId: string, plan: string) {
    setBusy(tenantId);
    setFeedback('');
    try {
      await tenantsApi.adminUpdate(tenantId, { plan });
      await load();
      setFeedback('Subscription plan updated');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFeedback(e.message ?? 'Failed to change plan');
    } finally {
      setBusy(null);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTenant) return;
    setBusy(actionTenant.id);
    try {
      await tenantsApi.resetOwnerPassword(actionTenant.id, newPassword);
      setPasswordDialog(false);
      setNewPassword('');
      setFeedback(`Password reset for ${actionTenant.name}`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFeedback(e.message ?? 'Failed to reset password');
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading fashion houses...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Fashion Houses
        </h1>
        <p className="mt-1 text-muted-foreground">
          Activate, manage subscriptions, reset passwords, and message tenants
        </p>
      </div>

      {feedback && (
        <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">
          {feedback}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tenants.length} Fashion Houses</CardTitle>
          <CardDescription>Platform tenant management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Owner</th>
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Active</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const owner = tenant.users?.[0];
                  return (
                    <tr
                      key={tenant.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          /{tenant.slug}
                        </p>
                      </td>
                      <td className="py-4 pr-4">
                        <p>{owner?.email ?? tenant.email ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {owner
                            ? `${owner.firstName} ${owner.lastName}`
                            : '—'}
                        </p>
                      </td>
                      <td className="py-4 pr-4">
                        <select
                          value={tenant.subscription?.plan ?? 'STARTER'}
                          disabled={busy === tenant.id}
                          onChange={(e) =>
                            changePlan(tenant.id, e.target.value)
                          }
                          className="rounded-md border bg-background px-2 py-1.5 text-xs"
                        >
                          {PLANS.map((p) => (
                            <option key={p} value={p}>
                              {PLAN_CONFIG[p as keyof typeof PLAN_CONFIG].name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 pr-4">
                        {tenant.subscription ? (
                          <span
                            className={cn(
                              'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
                              statusColors[tenant.subscription.status],
                            )}
                          >
                            {tenant.subscription.status.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <Button
                          size="sm"
                          variant={tenant.isActive ? 'outline' : 'default'}
                          disabled={busy === tenant.id}
                          onClick={() => toggleActive(tenant)}
                        >
                          {tenant.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActionTenant(tenant);
                              setPasswordDialog(true);
                            }}
                          >
                            <MoreHorizontal className="mr-1 h-3 w-3" />
                            Reset pwd
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link
                              href={`/admin/messages?tenant=${tenant.id}`}
                            >
                              <MessageSquare className="mr-1 h-3 w-3" />
                              Message
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset owner password</DialogTitle>
            <DialogDescription>
              Set a new password for {actionTenant?.name}&apos;s owner account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={busy === actionTenant?.id}>
              {busy === actionTenant?.id ? 'Saving...' : 'Update password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
