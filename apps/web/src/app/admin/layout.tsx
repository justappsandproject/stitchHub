'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { authApi, type AuthUser } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth';
import {
  clearSession,
  getStoredSession,
  isSessionExpiredError,
  saveUser,
} from '@/lib/session';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.replace('/login?next=/admin');
      return;
    }

    if (!isSuperAdmin(session.user.role)) {
      router.replace('/dashboard');
      return;
    }

    setUser(session.user);
    setReady(true);

    authApi
      .getProfile()
      .then((profile) => {
        if (!isSuperAdmin(profile.role)) {
          router.replace('/dashboard');
          return;
        }
        setUser(profile);
        saveUser(profile);
      })
      .catch((error) => {
        if (isSessionExpiredError(error)) {
          clearSession();
          router.replace('/login?next=/admin');
        }
      });
  }, [router]);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  if (!ready || !user) {
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
