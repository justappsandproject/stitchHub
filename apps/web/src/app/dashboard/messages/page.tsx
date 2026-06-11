'use client';

import { MessagesPanel } from '@/components/messages/messages-panel';

export default function DashboardMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-muted-foreground">
          Contact StitchHub platform support
        </p>
      </div>
      <MessagesPanel />
    </div>
  );
}
