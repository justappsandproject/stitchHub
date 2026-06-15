'use client';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ordersApi, stylesApi, type StyleRecord } from '@/lib/api';

export default function CustomerStyleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [style, setStyle] = useState<StyleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(0);
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await stylesApi.get(id);
      setStyle(data);
    } catch {
      setError('Style not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const media = style
    ? [
        ...style.photoUrls.map((url) => ({ type: 'photo' as const, url })),
        ...style.videoUrls.map((url) => ({ type: 'video' as const, url })),
      ]
    : [];

  async function handleOrder() {
    if (!style) return;
    setError('');
    setSuccess('');
    setOrdering(true);
    try {
      await ordersApi.create({
        styleId: style.id,
        notes: notes || undefined,
        discountCode: discountCode || undefined,
      });
      setSuccess('Order placed! Your fashion house will confirm shortly.');
      setTimeout(() => router.push('/customer/orders'), 2000);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to place order');
    } finally {
      setOrdering(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading style...</p>;
  }

  if (!style) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/customer/styles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to styles
          </Link>
        </Button>
        <p className="text-destructive">{error || 'Style not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/customer/styles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to styles
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border bg-secondary">
            {media[activeMedia]?.type === 'video' ? (
              <video
                src={media[activeMedia].url}
                controls
                className="h-full w-full object-cover"
              />
            ) : media[activeMedia]?.type === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media[activeMedia].url}
                alt={style.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No media
              </div>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {media.map((item, index) => (
                <button
                  key={`${item.url}-${index}`}
                  type="button"
                  onClick={() => setActiveMedia(index)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    activeMedia === index
                      ? 'border-primary'
                      : 'border-transparent'
                  }`}
                >
                  {item.type === 'photo' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-black/80 text-xs text-white">
                      Video
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-gold">
              {style.category}
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {style.name}
            </h1>
            {style.basePrice != null && (
              <p className="mt-2 font-display text-3xl font-semibold">
                ₦{Number(style.basePrice).toLocaleString()}
              </p>
            )}
          </div>

          {style.description && (
            <p className="text-muted-foreground leading-relaxed">
              {style.description}
            </p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Place an order</CardTitle>
              <CardDescription>
                Request this style from your fashion house
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </div>
              )}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Special instructions</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fabric preference, occasion, delivery timeline..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Promo code (optional)</Label>
                <Input
                  id="discount"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={ordering || !!success}
                onClick={handleOrder}
              >
                {ordering ? 'Placing order...' : 'Order this style'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
