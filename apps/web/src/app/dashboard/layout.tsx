'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { SubscriptionBanner } from '@/components/layout/subscription-banner';
import { authApi, type AuthUser } from '@/lib/api';
import { isSuperAdmin, isCustomer } from '@/lib/auth';
import {
  clearSession,
  getStoredSession,
  isSessionExpiredError,
  saveUser,
} from '@/lib/session';

export default function DashboardLayout({
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
      router.replace('/login?next=/dashboard');
      return;
    }

    if (isSuperAdmin(session.user.role)) {
      router.replace('/admin');
      return;
    }

    if (isCustomer(session.user.role)) {
      router.replace('/customer');
      return;
    }

    setUser(session.user);
    setReady(true);

    authApi
      .getProfile()
      .then((profile) => {
        if (isSuperAdmin(profile.role)) {
          router.replace('/admin');
          return;
        }
        if (isCustomer(profile.role)) {
          router.replace('/customer');
          return;
        }
        setUser(profile);
        saveUser(profile);
      })
      .catch((error) => {
        if (isSessionExpiredError(error)) {
          clearSession();
          router.replace('/login?next=/dashboard');
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
          <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
          Loading your atelier...
        </div>
      </div>
    );
  }

  const initials =
    `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        fashionHouseName={user.fashionHouseName ?? undefined}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-8">
          <p className="text-sm text-muted-foreground">
            Welcome back,{' '}
            <span className="font-medium text-foreground">
              {user.firstName}
            </span>
          </p>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">
                {user.firstName} {user.lastName}
              </p>
              {user.fashionHouseName && (
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {user.fashionHouseName}
                </p>
              )}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-gold/40">
              {initials}
            </div>
          </div>
        </header>
        <SubscriptionBanner />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
