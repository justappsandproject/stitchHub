'use client';

import { useEffect, useState } from 'react';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi, uploadFile } from '@/lib/api';
import { saveUser } from '@/lib/session';

export default function CustomerSettingsPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    authApi.getProfile().then((profile) => {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone ?? '');
      setEmail(profile.email);
      setPhotoUrl(profile.photoUrl ?? '');
    }).catch(console.error);
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    try {
      const profile = await authApi.updateProfile({ firstName, lastName, phone, email, photoUrl: photoUrl || undefined });
      saveUser(profile);
      setProfileMessage('Profile updated');
    } catch (err: unknown) {
      setProfileError((err as { message?: string }).message ?? 'Failed to update profile');
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMessage('Password updated');
    } catch (err: unknown) {
      setPasswordError((err as { message?: string }).message ?? 'Failed to update password');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and account</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            {profileMessage && <p className="text-sm text-green-700">{profileMessage}</p>}
            <Input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const uploaded = await uploadFile(file);
              setPhotoUrl(uploaded.url);
            }} />
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Button type="submit">Save profile</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
            <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
            <Button type="submit">Update password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
