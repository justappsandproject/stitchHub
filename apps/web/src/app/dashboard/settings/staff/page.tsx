'use client';

import { useEffect, useState } from 'react';
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
import { staffApi } from '@/lib/api';

export default function StaffSettingsPage() {
  const [staff, setStaff] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'TAILOR',
  });
  const [created, setCreated] = useState<{ password: string } | null>(null);

  useEffect(() => {
    staffApi.list().then(setStaff).catch(console.error);
  }, [created]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await staffApi.create(form);
    setCreated({ password: (res as { temporaryPassword: string }).temporaryPassword });
    setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'TAILOR' });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Staff Management</h1>
        <p className="text-muted-foreground">Invite and manage fashion house staff</p>
      </div>

      {created && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="pt-6">
            Staff invited. Temporary password: <strong>{created.password}</strong>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add staff member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="MANAGER">Manager</option>
                <option value="TAILOR">Tailor</option>
                <option value="CUTTER">Cutter</option>
                <option value="FINISHER">Finisher</option>
                <option value="APPRENTICE">Apprentice</option>
              </Select>
            </div>
            <Button type="submit" className="sm:col-span-2">
              Invite staff
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {staff.map((member) => (
            <div
              key={member.id as string}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {member.firstName as string} {member.lastName as string}
                </p>
                <p className="text-sm text-muted-foreground">
                  {member.role as string} · {member.email as string}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {member.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
