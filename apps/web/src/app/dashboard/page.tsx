'use client';

import { Suspense } from 'react';
import DashboardPageContent, {
  DashboardSkeleton,
} from './dashboard-content';

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
