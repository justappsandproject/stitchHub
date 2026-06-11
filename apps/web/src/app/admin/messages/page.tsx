'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessagesPanel } from '@/components/messages/messages-panel';
import { MESSAGES_READ_EVENT } from '@/hooks/use-unread-messages';
import { messagesApi, type MessageThread } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selected, setSelected] = useState<string | null>(
    searchParams.get('tenant'),
  );
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(() => {
    return messagesApi.listThreads().then((data) => {
      setThreads(data);
      return data;
    });
  }, []);

  useEffect(() => {
    loadThreads()
      .then((data) => {
        const fromQuery = searchParams.get('tenant');
        if (fromQuery) {
          setSelected(fromQuery);
        } else if (data.length > 0 && !selected) {
          setSelected(data[0].tenantId);
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    const onRead = () => {
      loadThreads();
    };
    window.addEventListener(MESSAGES_READ_EVENT, onRead);
    return () => window.removeEventListener(MESSAGES_READ_EVENT, onRead);
  }, [loadThreads]);

  if (loading) {
    return <p className="text-muted-foreground">Loading conversations...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-muted-foreground">
          Communicate with fashion houses on the platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-1 rounded-xl border bg-card p-2">
          {threads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet</p>
          )}
          {threads.map((thread) => {
            const hasUnread = thread.unreadCount > 0;
            return (
              <button
                key={thread.tenantId}
                type="button"
                onClick={() => setSelected(thread.tenantId)}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                  selected === thread.tenantId
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-muted',
                  hasUnread && selected !== thread.tenantId && 'bg-rose-50/50',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm',
                      hasUnread ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {hasUnread && (
                      <span
                        className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500"
                        aria-hidden
                      />
                    )}
                    {thread.tenantName}
                  </span>
                  {hasUnread && (
                    <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                {thread.lastMessage && (
                  <p
                    className={cn(
                      'mt-0.5 truncate text-xs',
                      hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {thread.lastMessage.body}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {selected ? (
          <MessagesPanel tenantId={selected} adminMode />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-muted-foreground">
            Select a fashion house to view messages
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Need to message a house with no thread yet?{' '}
        <Link href="/admin/tenants" className="text-primary hover:underline">
          Open Fashion Houses
        </Link>{' '}
        and use Message from the actions menu.
      </p>
    </div>
  );
}
