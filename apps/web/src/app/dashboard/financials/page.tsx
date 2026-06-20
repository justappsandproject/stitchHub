'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financialsApi } from '@/lib/api';

export default function FinancialsPage() {
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof financialsApi.summary>
  > | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financialsApi
      .summary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading financials...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Financials
        </h1>
        <p className="text-muted-foreground">
          Income, expenditure, and petty cash overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Income (this month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              ₦{(summary?.incomeMonth ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Expenditure (this month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              ₦{(summary?.expenditureMonth ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Net (this month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                (summary?.netMonth ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              ₦{(summary?.netMonth ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Petty cash balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              ₦{(summary?.pettyCashBalance ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary?.monthlyTrend.map((row) => (
              <div
                key={row.month}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{row.month}</span>
                <span className="text-emerald-600">
                  +₦{row.income.toLocaleString()}
                </span>
                <span className="text-red-600">
                  -₦{row.expenditure.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
