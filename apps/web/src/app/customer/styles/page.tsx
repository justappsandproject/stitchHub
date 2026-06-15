'use client';

import { Search, Sparkles, Video } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { stylesApi, type StyleRecord } from '@/lib/api';

export default function CustomerStylesPage() {
  const [styles, setStyles] = useState<StyleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await stylesApi.list(q ? { q } : undefined);
      setStyles(data.filter((s) => s.isActive));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-gold">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wider">
            Style catalog
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Browse styles
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review designs from your fashion house and place an order
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading styles...</p>
      ) : styles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No styles available yet. Check back soon!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {styles.map((style) => (
            <Link key={style.id} href={`/customer/styles/${style.id}`}>
              <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                  {style.photoUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={style.photoUrls[0]}
                      alt={style.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No preview
                    </div>
                  )}
                  {style.videoUrls.length > 0 && (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
                      <Video className="h-3.5 w-3.5" />
                      Video
                    </span>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{style.name}</CardTitle>
                  <CardDescription>{style.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  {style.basePrice != null && (
                    <p className="font-display text-xl font-semibold">
                      From ₦{Number(style.basePrice).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
