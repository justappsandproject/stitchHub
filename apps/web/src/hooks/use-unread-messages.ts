'use client';

import { useCallback, useEffect, useState } from 'react';
import { conversationsApi } from '@/lib/api';

export const MESSAGES_READ_EVENT = 'stitchhub:messages-read';

export function notifyMessagesRead() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MESSAGES_READ_EVENT));
  }
}

export function useUnreadMessages(pollMs = 30000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    conversationsApi
      .unreadCount()
      .then((r) => setCount(r.count))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollMs);
    const onRead = () => refresh();
    window.addEventListener(MESSAGES_READ_EVENT, onRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener(MESSAGES_READ_EVENT, onRead);
    };
  }, [refresh, pollMs]);

  return { count, refresh };
}
