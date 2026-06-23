'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface CurrentSubscription {
  plan: string;
  config: {
    styleStore?: boolean;
    messaging?: boolean;
    financialReports?: boolean;
    staffManagement?: boolean;
  };
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const sub = await api<CurrentSubscription>('/subscriptions/current');
      setSubscription(sub);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isFree = subscription?.plan === 'FREE';

  function isFeatureLocked(
    feature: 'styleStore' | 'messaging' | 'financialReports' | 'staffManagement',
  ) {
    if (!subscription?.config) return false;
    return subscription.config[feature] === false;
  }

  return { subscription, loading, isFree, isFeatureLocked, reload: load };
}
