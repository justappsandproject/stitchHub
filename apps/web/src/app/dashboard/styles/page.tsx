'use client';

import { Edit, ImagePlus, Plus, Search, Trash2, Video } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UpgradePromptDialog } from '@/components/subscription/upgrade-prompt-dialog';
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
import { stylesApi, uploadFile, type StyleRecord } from '@/lib/api';
import { isPlanLimitError } from '@/lib/plan-errors';
import type { PlanResource } from '@/lib/api';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  basePrice: '',
  stockQuantity: '0',
  tags: '',
  photoUrls: [] as string[],
  videoUrls: [] as string[],
};

function StylesSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-[4/3] animate-pulse bg-secondary" />
          <CardHeader>
            <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export default function StylesPage() {
  const [styles, setStyles] = useState<StyleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('date');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StyleRecord | null>(null);
  const [editStyle, setEditStyle] = useState<StyleRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [upgradeResource, setUpgradeResource] = useState<PlanResource>();

  const categories = useMemo(
    () => [...new Set(styles.map((s) => s.category).filter(Boolean))],
    [styles],
  );

  const loadStyles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stylesApi.list({
        q: search || undefined,
        category: categoryFilter || undefined,
        sort,
      });
      setStyles(data);
    } catch {
      setStyles([]);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, sort]);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  function handlePlanError(err: unknown) {
    if (isPlanLimitError(err)) {
      setUpgradeMessage(
        typeof err.message === 'string'
          ? err.message
          : 'Style Store is not available on the Free plan.',
      );
      setUpgradeResource(err.resource ?? 'styleStore');
      setUpgradeOpen(true);
      return true;
    }
    return false;
  }

  function openCreateDialog() {
    setEditStyle(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(style: StyleRecord) {
    setEditStyle(style);
    setForm({
      name: style.name,
      category: style.category,
      description: style.description ?? '',
      basePrice: style.basePrice != null ? String(style.basePrice) : '',
      stockQuantity: String(style.stockQuantity ?? 0),
      tags: (style.tags ?? []).join(', '),
      photoUrls: style.photoUrls ?? [],
      videoUrls: style.videoUrls ?? [],
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleUpload(files: FileList | null, type: 'photo' | 'video') {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const uploaded = await uploadFile(file);
      setForm((prev) => ({
        ...prev,
        photoUrls:
          type === 'photo'
            ? [...prev.photoUrls, uploaded.url]
            : prev.photoUrls,
        videoUrls:
          type === 'video'
            ? [...prev.videoUrls, uploaded.url]
            : prev.videoUrls,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        stockQuantity: Number(form.stockQuantity) || 0,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        photoUrls: form.photoUrls,
        videoUrls: form.videoUrls,
      };

      if (editStyle) {
        await stylesApi.update(editStyle.id, payload);
      } else {
        await stylesApi.create({ ...payload, isActive: true });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditStyle(null);
      loadStyles();
    } catch (err: unknown) {
      if (!handlePlanError(err)) {
        const apiErr = err as { message?: string | string[] };
        setError(
          Array.isArray(apiErr.message)
            ? apiErr.message.join(', ')
            : apiErr.message ?? 'Failed to save style',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await stylesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      loadStyles();
    } catch (err: unknown) {
      if (!handlePlanError(err)) {
        const apiErr = err as { message?: string };
        setError(apiErr.message ?? 'Failed to delete style');
      }
    }
  }

  const formValid =
    form.name.trim().length > 0 &&
    form.category.trim().length > 0 &&
    Number(form.stockQuantity) >= 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Style Store
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your lookbook — showcase designs with photos and pricing
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Style
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search styles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-36"
        >
          <option value="date">Newest</option>
          <option value="price">Price</option>
          <option value="name">Name</option>
        </Select>
      </div>

      {loading ? (
        <StylesSkeleton />
      ) : styles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No styles yet</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              Add your first style
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {styles.map((style) => {
            const inStock = (style.stockQuantity ?? 0) > 0;
            return (
              <Card
                key={style.id}
                className={`overflow-hidden transition-shadow hover:shadow-lg ${!style.isActive ? 'opacity-60' : ''}`}
              >
                <div className="relative aspect-[4/3] bg-secondary">
                  {style.photoUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={style.photoUrls[0]}
                      alt={style.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="mr-2 h-5 w-5" />
                      No photo
                    </div>
                  )}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      inStock
                        ? 'bg-success/90 text-white'
                        : 'bg-destructive/90 text-white'
                    }`}
                  >
                    {inStock ? 'In stock' : 'Out of stock'}
                  </span>
                  {style.videoUrls.length > 0 && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                      <Video className="h-3 w-3" />
                      {style.videoUrls.length}
                    </span>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">
                    {style.name}
                  </CardTitle>
                  <CardDescription>{style.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {style.basePrice != null && (
                    <p className="font-display text-xl font-semibold text-foreground">
                      ₦{Number(style.basePrice).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Qty: {style.stockQuantity ?? 0}
                  </p>
                  {style.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {style.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(style)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(style)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editStyle ? 'Edit Style' : 'Add Style'}</DialogTitle>
            <DialogDescription>
              Upload photos, set pricing, and track stock for your designs
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Style Name *</Label>
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
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="Agbada, Gown, Suit..."
                  required
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
              <div className="space-y-2">
                <Label htmlFor="basePrice">Price (₦)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, basePrice: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stockQuantity: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tags">Tags (optional, comma separated)</Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tags: e.target.value }))
                  }
                  placeholder="wedding, casual"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Photos</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files, 'photo')}
              />
              {form.photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.photoUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !formValid}>
                {saving ? 'Saving...' : editStyle ? 'Save changes' : 'Save Style'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The style will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradePromptDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        message={upgradeMessage}
        resource={upgradeResource}
      />
    </div>
  );
}
