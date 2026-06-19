'use client';

import {
  AlertTriangle,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  inventoryApi,
  uploadFile,
  type InventoryDashboard,
  type InventoryProduct,
  type InventoryTransaction,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  sku: '',
  unitCost: '',
  unitPrice: '',
  quantity: '0',
  lowStockThreshold: '5',
  supplier: '',
  photoUrls: [] as string[],
};

type Tab = 'products' | 'transactions';

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<InventoryProduct | null>(
    null,
  );
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<InventoryProduct | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);
  const [restockForm, setRestockForm] = useState({
    quantity: '',
    unitCost: '',
    supplier: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, productList, txList] = await Promise.all([
        inventoryApi.dashboard(),
        inventoryApi.list({
          q: search || undefined,
          stockStatus: stockFilter || undefined,
        }),
        inventoryApi.transactions(),
      ]);
      setDashboard(dash);
      setProducts(productList);
      setTransactions(txList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateDialog() {
    setEditProduct(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(product: InventoryProduct) {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category ?? '',
      description: product.description ?? '',
      sku: product.sku ?? '',
      unitCost: String(product.unitCost ?? ''),
      unitPrice: String(product.unitPrice ?? ''),
      quantity: String(product.quantity),
      lowStockThreshold: String(product.lowStockThreshold),
      supplier: product.supplier ?? '',
      photoUrls: product.photoUrls ?? [],
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category || undefined,
        description: form.description || undefined,
        sku: form.sku || undefined,
        unitCost: form.unitCost ? Number(form.unitCost) : 0,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : 0,
        quantity: form.quantity ? Number(form.quantity) : 0,
        lowStockThreshold: form.lowStockThreshold
          ? Number(form.lowStockThreshold)
          : 5,
        supplier: form.supplier || undefined,
        photoUrls: form.photoUrls,
      };

      if (editProduct) {
        await inventoryApi.update(editProduct.id, payload);
      } else {
        await inventoryApi.create(payload);
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditProduct(null);
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to save product',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    if (!restockTarget) return;
    setSaving(true);
    setError('');
    try {
      await inventoryApi.restock(restockTarget.id, {
        quantity: Number(restockForm.quantity),
        unitCost: restockForm.unitCost
          ? Number(restockForm.unitCost)
          : undefined,
        supplier: restockForm.supplier || undefined,
        notes: restockForm.notes || undefined,
      });
      setRestockTarget(null);
      setRestockForm({ quantity: '', unitCost: '', supplier: '', notes: '' });
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Restock failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await inventoryApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  }

  function stockStatus(product: InventoryProduct) {
    if (product.quantity <= 0) return 'out';
    if (product.quantity <= product.lowStockThreshold) return 'low';
    return 'ok';
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Inventory
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track fabrics, materials, and stock levels
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: 'Products',
              value: dashboard.totalProducts,
              icon: Package,
            },
            {
              label: 'Units in stock',
              value: dashboard.availableStock,
              icon: TrendingUp,
            },
            {
              label: 'Low stock',
              value: dashboard.lowStock,
              icon: AlertTriangle,
              warn: dashboard.lowStock > 0,
            },
            {
              label: 'Out of stock',
              value: dashboard.outOfStock,
              icon: AlertTriangle,
              warn: dashboard.outOfStock > 0,
            },
            {
              label: 'Total value',
              value: `₦${dashboard.totalInventoryValue.toLocaleString()}`,
              icon: TrendingUp,
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      stat.warn ? 'text-warning' : 'text-gold',
                    )}
                  />
                </CardHeader>
                <CardContent>
                  <p className="font-display text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          variant={tab === 'products' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('products')}
        >
          Products
        </Button>
        <Button
          variant={tab === 'transactions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('transactions')}
        >
          Transaction history
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {tab === 'products' ? (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              className="w-40"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="">All stock</option>
              <option value="available">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </Select>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading inventory...</p>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No products yet</p>
                <Button className="mt-4" onClick={openCreateDialog}>
                  Add your first product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const status = stockStatus(product);
                return (
                  <Card key={product.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg text-foreground">
                            {product.name}
                          </CardTitle>
                          <CardDescription>
                            {product.category ?? 'Uncategorized'}
                            {product.sku ? ` · ${product.sku}` : ''}
                          </CardDescription>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            status === 'out' && 'bg-destructive/10 text-destructive',
                            status === 'low' && 'bg-warning/10 text-warning',
                            status === 'ok' && 'bg-success/10 text-success',
                          )}
                        >
                          {status === 'out'
                            ? 'Out of stock'
                            : status === 'low'
                              ? 'Low stock'
                              : 'In stock'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {product.photoUrls[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.photoUrls[0]}
                          alt=""
                          className="h-24 w-full rounded-md object-cover"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium text-foreground">
                            {product.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unit cost</p>
                          <p className="font-medium text-foreground">
                            ₦{Number(product.unitCost).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setRestockForm({
                              quantity: '',
                              unitCost: String(product.unitCost ?? ''),
                              supplier: product.supplier ?? '',
                              notes: '',
                            });
                            setRestockTarget(product);
                          }}
                        >
                          Restock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Restocks, usage, and adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {tx.product?.name ?? 'Product'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.type.replace(/_/g, ' ')} ·{' '}
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                      {tx.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tx.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-foreground">
                        {tx.previousQty} → {tx.newQty}
                      </p>
                      <p className="text-muted-foreground">
                        Qty: {tx.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              Manage stock item details and pricing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="Fabric, Thread, Buttons..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sku: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, supplier: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit cost (₦)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  value={form.unitCost}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unitCost: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit price (₦)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unitPrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const uploaded = await uploadFile(file);
                    setForm((p) => ({
                      ...p,
                      photoUrls: [...p.photoUrls, uploaded.url],
                    }));
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editProduct ? 'Save changes' : 'Add product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!restockTarget}
        onOpenChange={(open) => !open && setRestockTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restockTarget?.name}</DialogTitle>
            <DialogDescription>
              Current stock: {restockTarget?.quantity} units
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restockQty">Quantity to add *</Label>
              <Input
                id="restockQty"
                type="number"
                min="1"
                value={restockForm.quantity}
                onChange={(e) =>
                  setRestockForm((p) => ({ ...p, quantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restockCost">Unit cost (₦)</Label>
              <Input
                id="restockCost"
                type="number"
                min="0"
                value={restockForm.unitCost}
                onChange={(e) =>
                  setRestockForm((p) => ({ ...p, unitCost: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restockSupplier">Supplier</Label>
              <Input
                id="restockSupplier"
                value={restockForm.supplier}
                onChange={(e) =>
                  setRestockForm((p) => ({ ...p, supplier: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restockNotes">Notes</Label>
              <Textarea
                id="restockNotes"
                value={restockForm.notes}
                onChange={(e) =>
                  setRestockForm((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestockTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Restocking...' : 'Confirm restock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{deleteTarget?.name}</strong> from your
              active inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Deleting...' : 'Delete product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
