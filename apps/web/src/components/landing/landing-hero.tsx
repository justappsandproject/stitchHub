import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const stats = [
  { icon: Users, value: '2,400+', label: 'Fashion businesses' },
  { icon: TrendingUp, value: '98%', label: 'On-time delivery rate' },
  { icon: Zap, value: '14 days', label: 'Free trial' },
];

const kanbanColumns = [
  { title: 'New', count: 4, color: 'bg-violet-500' },
  { title: 'Cutting', count: 3, color: 'bg-rose-500' },
  { title: 'Sewing', count: 5, color: 'bg-amber-500' },
  { title: 'Ready', count: 2, color: 'bg-emerald-500' },
];

export function LandingHero() {
  return (
    <section className="landing-mesh landing-grid-pattern relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="pointer-events-none absolute -left-32 top-32 h-72 w-72 rounded-full bg-primary/30 blur-[100px] animate-shimmer" />
      <div className="pointer-events-none absolute -right-20 top-48 h-96 w-96 rounded-full bg-rose-500/20 blur-[120px] animate-shimmer" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full glass-dark px-4 py-2 text-sm text-white/90">
              <Sparkles className="h-4 w-4 text-rose-300" />
              <span>The modern atelier operating system</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                New
              </span>
            </div>

            <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Run your fashion house{' '}
              <span className="text-gradient font-display italic">
                like a studio
              </span>
              , not a spreadsheet
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Measurements, orders, production, and payments — beautifully
              connected in one platform built for tailors, designers, and
              boutiques across Africa.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-full bg-gradient-to-r from-primary via-rose-500 to-amber-500 px-8 text-base font-semibold shadow-xl shadow-primary/30 hover:opacity-90"
              >
                <Link href="/register">
                  Start free trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="#showcase">See it in action</Link>
              </Button>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-white/10 pt-10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-rose-300" />
                    <p className="font-heading text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-white/50 sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-scale-in lg:pl-4">
            <div className="animate-float glass-dark relative z-10 overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="ml-2 text-xs text-white/40">
                  Elegant Stitches — Production Board
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 p-4">
                {kanbanColumns.map((col) => (
                  <div key={col.title} className="rounded-xl bg-white/5 p-2">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                        {col.title}
                      </span>
                      <span className="rounded-full bg-white/10 px-1.5 text-[10px] text-white/60">
                        {col.count}
                      </span>
                    </div>
                    {Array.from({ length: Math.min(col.count, 3) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="mb-1.5 rounded-lg border border-white/5 bg-white/[0.07] p-2"
                        >
                          <div
                            className={`mb-1.5 h-1 w-8 rounded-full ${col.color}`}
                          />
                          <div className="h-1.5 w-full rounded bg-white/10" />
                          <div className="mt-1 h-1.5 w-2/3 rounded bg-white/5" />
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-float-delayed glass-dark absolute -bottom-6 -left-6 z-20 rounded-xl px-4 py-3 shadow-xl">
              <p className="text-xs text-white/50">Today&apos;s revenue</p>
              <p className="font-heading text-lg font-bold text-white">
                ₦847,500
              </p>
              <p className="text-xs text-emerald-400">+12% vs yesterday</p>
            </div>

            <div className="animate-float glass-dark absolute -right-4 -top-4 z-20 hidden rounded-xl px-4 py-3 shadow-xl sm:block">
              <p className="text-xs text-white/50">Order #2847</p>
              <p className="text-sm font-medium text-white">
                Wedding gown — Ready ✓
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
