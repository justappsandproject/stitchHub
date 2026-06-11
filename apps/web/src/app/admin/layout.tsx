'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { authApi, type AuthUser } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('user');
    if (!token || !stored) {
      router.push('/login');
      return;
    }

    const parsed = JSON.parse(stored) as AuthUser;
    if (!isSuperAdmin(parsed.role)) {
      router.push('/dashboard');
      return;
    }

    authApi
      .getProfile(token)
      .then((profile) => {
        if (!isSuperAdmin(profile.role)) {
          router.push('/dashboard');
          return;
        }
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      })
      .catch(() => {
        if (isSuperAdmin(parsed.role)) {
          setUser(parsed);
        } else {
          router.push('/dashboard');
        }
      });
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          Loading platform admin...
        </div>
      </div>
    );
  }

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Platform Administration
            </p>
            <p className="text-sm text-muted-foreground">
              Manage fashion houses, subscriptions, and platform health
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Super Admin
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-rose-500 text-xs font-semibold text-white ring-2 ring-primary/20">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
