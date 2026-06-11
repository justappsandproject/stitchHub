'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface SubscriptionStatus {
  status: string;
  isSuspended?: boolean;
  requiresPayment?: boolean;
  currentPeriodEnd: string;
}

export function SubscriptionBanner() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    api<SubscriptionStatus>('/subscriptions/current')
      .then(setSub)
      .catch(() => {});
  }, []);

  if (!sub?.isSuspended && !sub?.requiresPayment && sub?.status !== 'PAST_DUE') {
    return null;
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-8 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Account suspended — payment required
          </p>
          <p className="text-amber-800/80 dark:text-amber-200/80">
            Your free trial ended on{' '}
            {new Date(sub.currentPeriodEnd).toLocaleDateString()}. Pay via
            Paystack on the Billing page to restore full access to your
            atelier.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/billing">Go to Billing</Link>
        </Button>
      </div>
    </div>
  );
}
