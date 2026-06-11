'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { notifyMessagesRead } from '@/hooks/use-unread-messages';
import { messagesApi, type PlatformMessage } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface MessagesPanelProps {
  tenantId?: string;
  adminMode?: boolean;
}

export function MessagesPanel({ tenantId, adminMode }: MessagesPanelProps) {
  const [messages, setMessages] = useState<PlatformMessage[]>([]);
  const [tenantName, setTenantName] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      if (adminMode && tenantId) {
        const data = await messagesApi.getThread(tenantId);
        setMessages(data.messages);
        setTenantName(data.tenant.name);
      } else {
        const data = await messagesApi.getInbox();
        setMessages(data.messages);
        setTenantName(data.tenant.name);
      }
      notifyMessagesRead();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantId, adminMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await messagesApi.send(body.trim(), adminMode ? tenantId : undefined);
      setBody('');
      await load();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading messages...</p>;
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="font-medium">
          {adminMode ? `Chat with ${tenantName}` : 'Messages with StitchHub Support'}
        </p>
        <p className="text-xs text-muted-foreground">
          {adminMode
            ? 'Platform admin ↔ fashion house'
            : 'Ask questions or report issues to the platform team'}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No messages yet. Start the conversation below.
          </p>
        )}
        {messages.map((msg) => {
          const fromAdmin = msg.sender.role === 'SUPER_ADMIN';
          const isIncoming = adminMode ? !fromAdmin : fromAdmin;
          const isUnread = isIncoming && !msg.readAt;

          return (
            <div
              key={msg.id}
              className={cn('flex', fromAdmin ? 'justify-start' : 'justify-end')}
            >
              <div
                className={cn(
                  'relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm transition-colors',
                  fromAdmin
                    ? 'rounded-bl-md bg-muted text-foreground'
                    : 'rounded-br-md bg-primary text-primary-foreground',
                  isUnread && 'ring-2 ring-rose-400/60 ring-offset-2 ring-offset-card',
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                    {msg.sender.firstName} {msg.sender.lastName}
                    {isSuperAdmin(msg.sender.role) ? ' · Admin' : ''}
                  </p>
                  {isUnread && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className="mt-1 text-[10px] opacity-60">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
