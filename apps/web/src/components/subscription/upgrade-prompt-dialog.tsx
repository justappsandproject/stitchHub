'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PlanResource } from '@/lib/api';

const resourceMessages: Record<PlanResource, string> = {
  customers: "You've reached the customer limit on the Free plan.",
  orders: "You've reached the monthly order limit on the Free plan.",
  staff: 'Staff accounts are not included on the Free plan.',
  styleStore: 'Style Store is not available on the Free plan.',
  messaging: 'Real-time messaging is not available on the Free plan.',
  financialReports: 'Financial reports are not available on the Free plan.',
};

interface UpgradePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  resource?: PlanResource;
}

export function UpgradePromptDialog({
  open,
  onOpenChange,
  message,
  resource,
}: UpgradePromptDialogProps) {
  const body =
    message ??
    (resource ? resourceMessages[resource] : 'Upgrade your plan to continue.');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Plan limit reached
          </DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-foreground">
          Upgrade to unlock more customers, orders, and premium atelier features.
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild>
            <Link href="/dashboard/settings#subscription">Upgrade Plan</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
