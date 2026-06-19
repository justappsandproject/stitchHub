'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings#subscription');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Billing has moved</CardTitle>
          <CardDescription>
            Subscription and plan management now lives in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirecting you to subscription settings…
          </p>
          <Button asChild>
            <Link href="/dashboard/settings#subscription">
              Go to Subscription settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
