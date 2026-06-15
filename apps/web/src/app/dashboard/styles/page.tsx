'use client';

import { ImagePlus, Plus, Search, Trash2, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { stylesApi, uploadFile, type StyleRecord } from '@/lib/api';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  basePrice: '',
  photoUrls: [] as string[],
  videoUrls: [] as string[],
};

export default function StylesPage() {
  const [styles, setStyles] = useState<StyleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStyles = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await stylesApi.list(q ? { q } : undefined);
      setStyles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await stylesApi.create({
        name: form.name,
        category: form.category,
        description: form.description || undefined,
        basePrice: form.basePrice ? Number(form.basePrice) : undefined,
        photoUrls: form.photoUrls,
        videoUrls: form.videoUrls,
        isActive: true,
      });
      setDialogOpen(false);
      setForm(emptyForm);
      loadStyles(search);
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to create style',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(style: StyleRecord) {
    await stylesApi.update(style.id, { isActive: !style.isActive });
    loadStyles(search);
  }

  async function removeStyle(id: string) {
    await stylesApi.remove(id);
    loadStyles(search);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Styles
          </h1>
          <p className="mt-1 text-muted-foreground">
            Showcase designs with photos and videos for customers to browse and
            order
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Style
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search styles..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            loadStyles(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading styles...</p>
      ) : styles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No styles yet</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              Add your first style
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {styles.map((style) => (
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
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No photo
                  </div>
                )}
                {style.videoUrls.length > 0 && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    <Video className="h-3 w-3" />
                    {style.videoUrls.length}
                  </span>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{style.name}</CardTitle>
                <CardDescription>{style.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {style.basePrice != null && (
                  <p className="font-display text-xl font-semibold">
                    ₦{Number(style.basePrice).toLocaleString()}
                  </p>
                )}
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
                    onClick={() => toggleActive(style)}
                  >
                    {style.isActive ? 'Hide' : 'Publish'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStyle(style.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Style</DialogTitle>
            <DialogDescription>
              Upload photos and videos customers can review before ordering
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
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
                <Label htmlFor="basePrice">Base price (₦)</Label>
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
            <div className="space-y-2">
              <Label>Videos</Label>
              <Input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                onChange={(e) => handleUpload(e.target.files, 'video')}
              />
              {form.videoUrls.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {form.videoUrls.length} video(s) uploaded
                </p>
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
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Style'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
