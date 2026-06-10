'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';

interface KanbanOrder {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  customer: { firstName: string; lastName: string };
  progress: number;
}

type KanbanBoard = Record<string, KanbanOrder[]>;

const columns = [
  { key: 'NEW', label: 'New' },
  { key: 'CUTTING', label: 'Cutting' },
  { key: 'SEWING', label: 'Sewing' },
  { key: 'FITTING', label: 'Fitting' },
  { key: 'FINISHING', label: 'Finishing' },
  { key: 'READY', label: 'Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const nextStage: Record<string, string | undefined> = {
  NEW: 'CUTTING',
  MEASURED: 'CUTTING',
  CUTTING: 'SEWING',
  SEWING: 'FITTING',
  FITTING: 'FINISHING',
  FINISHING: 'READY',
  READY: 'DELIVERED',
};

export default function ProductionPage() {
  const [board, setBoard] = useState<KanbanBoard>({});
  const [loading, setLoading] = useState(true);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    try {
      const data = await api<KanbanBoard>('/orders/kanban');
      setBoard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  async function advance(order: KanbanOrder) {
    const next = nextStage[order.status];
    if (!next) return;

    setAdvancingId(order.id);
    try {
      await api(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await loadBoard();
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancingId(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading production board...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Production Board
        </h1>
        <p className="mt-1 text-muted-foreground">
          Kanban workflow for order production
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.key}
            className="min-w-[260px] flex-shrink-0 rounded-xl border bg-secondary/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium shadow-sm">
                {(board[col.key] ?? []).length}
              </span>
            </div>
            <div className="min-h-[120px] space-y-3">
              {(board[col.key] ?? []).map((order) => {
                const next = nextStage[order.status];
                return (
                  <Card key={order.id}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">
                        {order.orderNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground">
                        {order.customer.firstName} {order.customer.lastName}
                      </p>
                      {order.priority !== 'NORMAL' && (
                        <span className="mt-2 inline-block rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                          {order.priority}
                        </span>
                      )}
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full"
                          disabled={advancingId === order.id}
                          onClick={() => advance(order)}
                        >
                          {advancingId === order.id ? (
                            'Moving...'
                          ) : (
                            <>
                              {columns.find((c) => c.key === next)?.label}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
