'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CustomerCredentials {
  username: string;
  password: string;
}

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: CustomerCredentials | null;
}

function formatCredentials(credentials: CustomerCredentials) {
  return `Username: ${credentials.username}\nPassword: ${credentials.password}`;
}

export function CredentialsDialog({
  open,
  onOpenChange,
  credentials,
}: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!credentials) return;
    await navigator.clipboard.writeText(formatCredentials(credentials));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Customer Account Created</DialogTitle>
          <DialogDescription>
            Share these login details with your customer.
          </DialogDescription>
        </DialogHeader>
        {credentials && (
          <div className="space-y-3 rounded-lg border bg-secondary/40 p-4 font-mono text-sm text-foreground">
            <p>
              <span className="font-semibold">Username:</span>{' '}
              {credentials.username}
            </p>
            <p>
              <span className="font-semibold">Password:</span>{' '}
              {credentials.password}
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Share these details with your customer. This password will not be
          shown again.
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Credentials'}
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
