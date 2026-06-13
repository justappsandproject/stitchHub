'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  totalAmount: number;
  balanceAmount: number;
  fabric?: string;
  deliveryDate?: string;
  style?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  MEASURED: 'bg-indigo-100 text-indigo-800',
  CUTTING: 'bg-yellow-100 text-yellow-800',
  SEWING: 'bg-orange-100 text-orange-800',
  FITTING: 'bg-purple-100 text-purple-800',
  FINISHING: 'bg-pink-100 text-pink-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api<Order[]>('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return <p className="text-muted-foreground">Loading orders...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          My Orders
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track progress on all your orders
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders yet. Your fashion house will add orders for you here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{order.orderNumber}</CardTitle>
                  <CardDescription>
                    {order.style?.name ?? order.fabric ?? 'Custom order'}
                  </CardDescription>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusColors[order.status] ?? 'bg-muted text-muted-foreground'
                  }`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">
                    ₦{Number(order.totalAmount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-medium">
                    ₦{Number(order.balanceAmount).toLocaleString()}
                  </p>
                </div>
                {order.deliveryDate && (
                  <div>
                    <p className="text-muted-foreground">Delivery</p>
                    <p className="font-medium">
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
